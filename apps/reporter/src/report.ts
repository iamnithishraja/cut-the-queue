import prisma from "@repo/db/client";
import { OrderReportItem } from "./types";
import * as XLSX from 'xlsx';
import Decimal from 'decimal.js';

const TEST_EMAILS = [
    // 'developer@cuttheq.in'
];

interface DateRange {
    startDate: Date;
    endDate: Date;
}

async function generateReport({ startDate, endDate }: DateRange) {
    const orders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            orderStatus: 'DONE',
            isPaid: true,
            customer: {
                email: {
                    notIn: TEST_EMAILS
                }
            }
        },
        include: {
            customer: {
                select: {
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                },
            },
            canteen: {
                select: {
                    id: true,
                    name: true,
                }
            },
            OrderItem: {
                include: {
                    menuItem: {
                        select: {
                            name: true,
                            price: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    const excludedOrders = await prisma.order.count({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            orderStatus: 'DONE',
            isPaid: true,
            customer: {
                email: {
                    in: TEST_EMAILS
                }
            }
        }
    });

    if (excludedOrders > 0) {
        console.log(`Excluded ${excludedOrders} test orders from the report`);
    }

    if (!orders || orders.length === 0) {
        console.log('No paid orders found for the selected date range');
        return null;
    }

    const processedOrders = [...orders];

    const ordersByCanteen = processedOrders.reduce((acc, order) => {
        const canteenId = order.canteen.id;
        if (!acc[canteenId]) {
            acc[canteenId] = {
                canteenName: order.canteen.name,
                orders: []
            };
        }
        acc[canteenId].orders.push(order);
        return acc;
    }, {} as Record<string, { canteenName: string; orders: typeof orders }>);

    const canteenReports = Object.entries(ordersByCanteen).map(([canteenId, { canteenName, orders }]) => {
        const reportData: OrderReportItem[] = [];
        
        for (const order of orders) {
            // Use exact decimal arithmetic for precise calculations
            const subtotal = order.OrderItem.reduce((sum, item) => {
                const itemTotal = new Decimal(item.menuItem.price).times(item.quantity);
                return sum.plus(itemTotal);
            }, new Decimal(0));

            const razorpayFee = subtotal.times(new Decimal('0.02'));
            const gstOnRazorpayFee = razorpayFee.times(new Decimal('0.18'));
            const finalTotal = subtotal.minus(razorpayFee).minus(gstOnRazorpayFee);

            const formattedItems = order.OrderItem.map(item => {
                return `${item.menuItem.name} (${item.quantity} × ₹${item.menuItem.price})`;
            }).join(', ');

            const reportItem: OrderReportItem = {
                orderId: order.id,
                // @ts-ignore
                customerName: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
                // @ts-ignore
                phoneNumber: order.customer.phoneNumber,
                items: formattedItems,
                subtotal: subtotal.toNumber(),
                razorpayFee: razorpayFee.toNumber(),
                gstOnRazorpayFee: gstOnRazorpayFee.toNumber(),
                finalTotal: finalTotal.toNumber(),
                orderDate: new Date(order.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                }),
                paymentId: order.paymentId || 'N/A'
            };
            
            reportData.push(reportItem);
        }

        console.log(`Processing ${canteenName}: ${reportData.length} orders`);

        // Use Decimal for summary calculations
        const summary = {
            canteenName,
            totalOrders: reportData.length,
            totalRevenue: reportData.reduce((sum, order) => sum.plus(new Decimal(order.subtotal)), new Decimal(0)).toNumber(),
            totalRazorpayFee: reportData.reduce((sum, order) => sum.plus(new Decimal(order.razorpayFee)), new Decimal(0)).toNumber(),
            totalGSTOnFee: reportData.reduce((sum, order) => sum.plus(new Decimal(order.gstOnRazorpayFee)), new Decimal(0)).toNumber(),
            finalTotal: reportData.reduce((sum, order) => sum.plus(new Decimal(order.finalTotal)), new Decimal(0)).toNumber(),
        };

        return { canteenId, canteenName, reportData, summary };
    });

    const wb = XLSX.utils.book_new();

    const headers = [
        { header: 'Order ID', key: 'orderId', width: 25 },
        { header: 'Customer Name', key: 'customerName', width: 20 },
        { header: 'Phone Number', key: 'phoneNumber', width: 15 },
        { header: 'Items Ordered', key: 'items', width: 40 },
        { header: 'Subtotal (₹)', key: 'subtotal', width: 12 },
        { header: 'Razorpay Fee (₹)', key: 'razorpayFee', width: 15 },
        { header: 'GST on Fee (₹)', key: 'gstOnRazorpayFee', width: 15 },
        { header: 'Final Total (₹)', key: 'finalTotal', width: 12 },
        { header: 'Order Date', key: 'orderDate', width: 20 },
        { header: 'Payment ID', key: 'paymentId', width: 25 }
    ];

    // Create sheets for each canteen
    canteenReports.forEach(({ canteenName, reportData, summary }) => {
        const ws = XLSX.utils.json_to_sheet([], { header: headers.map(h => h.key) });
        
        // Add headers
        XLSX.utils.sheet_add_aoa(ws, [headers.map(h => h.header)], { origin: 'A1' });
        
        // Add data starting from row 2
        if (reportData.length > 0) {
            XLSX.utils.sheet_add_json(ws, reportData, {
                origin: 'A2',
                skipHeader: true,
            });
        }

        // Set column widths
        ws['!cols'] = headers.map(h => ({ width: h.width }));

        // Add summary at the bottom
        const dataEndRow = reportData.length + 1;
        const summaryStartRow = dataEndRow + 2;

        const summaryRows = [
            ['Summary'],
            ['Total Orders:', summary.totalOrders],
            ['Total Revenue:', summary.totalRevenue],
            ['Razorpay Fee (2%):', summary.totalRazorpayFee],
            ['GST on Fee (18%):', summary.totalGSTOnFee],
            ['Final Settlement Amount:', summary.finalTotal]
        ];

        XLSX.utils.sheet_add_aoa(ws, summaryRows, { origin: `A${summaryStartRow}` });

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, canteenName);
    });

    // Create consolidated summary sheet
    const grandTotal = {
        orders: canteenReports.reduce((sum, { summary }) => sum + summary.totalOrders, 0),
        revenue: new Decimal(canteenReports.reduce((sum, { summary }) => sum + summary.totalRevenue, 0)).toNumber(),
        razorpayFee: new Decimal(canteenReports.reduce((sum, { summary }) => sum + summary.totalRazorpayFee, 0)).toNumber(),
        gst: new Decimal(canteenReports.reduce((sum, { summary }) => sum + summary.totalGSTOnFee, 0)).toNumber(),
        final: new Decimal(canteenReports.reduce((sum, { summary }) => sum + summary.finalTotal, 0)).toNumber()
    };

    const dateStr = new Date(startDate.getTime());
    dateStr.setDate(dateStr.getDate() + 1);

    const consolidatedSummary = [
        ['Report Date:', new Date(startDate.getTime()).toLocaleDateString('en-IN')],
        [],
        ['Canteen', 'Orders', 'Revenue', 'Razorpay Fee', 'GST on Fee', 'Final Settlement'],
        ...canteenReports.map(({ summary }) => [
            summary.canteenName,
            summary.totalOrders,
            summary.totalRevenue,
            summary.totalRazorpayFee,
            summary.totalGSTOnFee,
            summary.finalTotal
        ]),
        [],
        ['Overall Totals'],
        ['Total Orders:', grandTotal.orders],
        ['Total Revenue:', grandTotal.revenue],
        ['Total Razorpay Fee:', grandTotal.razorpayFee],
        ['Total GST:', grandTotal.gst],
        ['Total Final Settlement:', grandTotal.final]
    ];

    const summaryWS = XLSX.utils.aoa_to_sheet(consolidatedSummary);
    summaryWS['!cols'] = [
        { width: 30 }, { width: 15 }, { width: 15 }, 
        { width: 15 }, { width: 15 }, { width: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

    const filename = `orders_report_${dateStr.toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    return {
        filename,
        canteenReports,
    };
}

export const generateDateReport = async (dateString: string) => {
    try {
        // Create date in local timezone without UTC conversion
        const selectedDate = new Date(dateString);
        selectedDate.setHours(0, 0, 0, 0);

        const endDate = new Date(dateString);
        endDate.setHours(23, 59, 59, 999);

        const report = await generateReport({
            startDate: selectedDate,
            endDate: endDate
        });

        if (report) {
            console.log(`Generated report '${report.filename}'`);
            report.canteenReports.forEach(({ canteenName, summary }) => {
                console.log(`\n${canteenName}:`);
                console.log(`- Orders: ${summary.totalOrders}`);
                console.log(`- Total Revenue: ₹${summary.totalRevenue}`);
                console.log(`- Final Settlement: ₹${summary.finalTotal}`);
            });
        }
    } catch (error) {
        console.error('Error generating report:', error);
        throw error;
    }
};
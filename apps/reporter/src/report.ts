import prisma from "@repo/db/client";
import { OrderReportItem } from "./types";
import * as XLSX from 'xlsx';

async function generateDailyReport() {
    const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: past24Hours,
            },
            orderStatus: 'DONE',
            isPaid: true,
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

    if (orders.length === 0) {
        console.log('No paid orders found in the last 24 hours');
        return null;
    }

    // Group orders by canteen
    const ordersByCanteen = orders.reduce((acc, order) => {
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

    // Process orders for each canteen
    const canteenReports = Object.entries(ordersByCanteen).map(([canteenId, { canteenName, orders }]) => {
        const reportData: OrderReportItem[] = orders.map((order) => {
            const subtotal = order.OrderItem.reduce((sum, item) => {
                return sum + (item.menuItem.price * item.quantity);
            }, 0);

            const razorpayFee = subtotal * 0.02;
            const gstOnRazorpayFee = razorpayFee * 0.18;
            const finalTotal = subtotal - razorpayFee - gstOnRazorpayFee;

            const formattedItems = order.OrderItem.map(item => {
                return `${item.menuItem.name} (${item.quantity} × ₹${item.menuItem.price})`;
            }).join(', ');

            return {
                orderId: order.id,
                customerName: `${order.customer.firstName} ${order.customer.lastName}`,
                phoneNumber: order.customer.phoneNumber,
                items: formattedItems,
                subtotal: Number(subtotal.toFixed(2)),
                razorpayFee: Number(razorpayFee.toFixed(2)),
                gstOnRazorpayFee: Number(gstOnRazorpayFee.toFixed(2)),
                finalTotal: Number(finalTotal.toFixed(2)),
                orderDate: new Date(order.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                }),
                paymentId: order.paymentId || 'N/A'
            };
        });

        const summary = {
            canteenName,
            totalOrders: reportData.length,
            totalRevenue: Number(reportData.reduce((sum, order) => sum + order.subtotal, 0).toFixed(2)),
            totalRazorpayFee: Number(reportData.reduce((sum, order) => sum + order.razorpayFee, 0).toFixed(2)),
            totalGSTOnFee: Number(reportData.reduce((sum, order) => sum + order.gstOnRazorpayFee, 0).toFixed(2)),
            finalTotal: Number(reportData.reduce((sum, order) => sum + order.finalTotal, 0).toFixed(2)),
        };

        return { canteenId, canteenName, reportData, summary };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Configure headers for order sheets
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
        // Create order details sheet
        const ws = XLSX.utils.json_to_sheet(reportData, {
            header: headers.map(h => h.key),
            skipHeader: true
        });

        // Add header row
        XLSX.utils.sheet_add_aoa(ws, [headers.map(h => h.header)], { origin: 'A1' });
        
        // Set column widths
        ws['!cols'] = headers.map(h => ({ width: h.width }));

        // Add summary at the bottom of the sheet
        const lastRow = reportData.length + 3; // +3 for header row and a gap
        const summaryRows: (string | number)[][] = [
            ['Summary'],
            ['Total Orders:', summary.totalOrders],
            ['Total Revenue:', summary.totalRevenue],
            ['Razorpay Fee (2%):', summary.totalRazorpayFee],
            ['GST on Fee (18%):', summary.totalGSTOnFee],
            ['Final Settlement Amount:', summary.finalTotal]
        ];

        XLSX.utils.sheet_add_aoa(ws, summaryRows, { origin: `A${lastRow}` });

        XLSX.utils.book_append_sheet(wb, ws, canteenName);
    });

    // Create consolidated summary sheet
    const grandTotal = {
        orders: canteenReports.reduce((sum, { summary }) => sum + summary.totalOrders, 0),
        revenue: canteenReports.reduce((sum, { summary }) => sum + summary.totalRevenue, 0),
        razorpayFee: canteenReports.reduce((sum, { summary }) => sum + summary.totalRazorpayFee, 0),
        gst: canteenReports.reduce((sum, { summary }) => sum + summary.totalGSTOnFee, 0),
        final: canteenReports.reduce((sum, { summary }) => sum + summary.finalTotal, 0),
    };

    const consolidatedSummary: (string | number)[][] = [
        ['Daily Orders Summary Report'],
        ['Reporting Period:', `Last 24 hours (as of ${new Date().toLocaleString('en-IN')})`],
        [],
        ['Canteen-wise Summary'],
        ['Canteen Name', 'Orders', 'Revenue (₹)', 'Razorpay Fee (₹)', 'GST (₹)', 'Final Amount (₹)'],
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
        ['Total Revenue:', Number(grandTotal.revenue.toFixed(2))],
        ['Total Razorpay Fee:', Number(grandTotal.razorpayFee.toFixed(2))],
        ['Total GST:', Number(grandTotal.gst.toFixed(2))],
        ['Total Final Settlement:', Number(grandTotal.final.toFixed(2))]
    ];

    const summaryWS = XLSX.utils.aoa_to_sheet(consolidatedSummary);
    summaryWS['!cols'] = [
        { width: 30 }, { width: 15 }, { width: 15 }, 
        { width: 15 }, { width: 15 }, { width: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

    // Save the workbook
    const date = new Date().toISOString().split('T')[0];
    const filename = `daily_orders_report_${date}.xlsx`;
    XLSX.writeFile(wb, filename);

    return {
        filename,
        canteenReports,
    };
}

export const generateReport = async () => {
    try {
        const report = await generateDailyReport();
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
import prisma from "@repo/db/client";
import * as XLSX from 'xlsx';
import Decimal from 'decimal.js';
import { CanteenReportMenu, DateRange, MenuItemAnalysis } from "./types";

async function generateMenuAnalysisReport({ startDate, endDate }: DateRange) {
    const orders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            orderStatus: 'DONE',
            isPaid: true,
        },
        include: {
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
                            id: true,
                            name: true,
                            price: true,
                        },
                    },
                },
            },
        },
    });

    if (!orders || orders.length === 0) {
        console.log('No paid orders found for the selected date range');
        return null;
    }

    // Group orders by canteen first
    const canteenOrders = orders.reduce((acc, order) => {
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

    const canteenReports: CanteenReportMenu[] = [];

    // Process each canteen separately
    for (const [canteenId, { canteenName, orders }] of Object.entries(canteenOrders)) {
        const menuItemStats = new Map<string, MenuItemAnalysis>();

        // Process orders for this canteen
        orders.forEach(order => {
            order.OrderItem.forEach(item => {
                const key = item.menuItem.name;
                const existing = menuItemStats.get(key);

                const itemRevenue = new Decimal(item.menuItem.price).times(item.quantity);
                const razorpayFee = itemRevenue.times('0.02');
                const gstOnFee = razorpayFee.times('0.18');
                const finalSettlement = itemRevenue.minus(razorpayFee).minus(gstOnFee);

                if (existing) {
                    existing.totalQuantitySold += item.quantity;
                    existing.totalRevenue = new Decimal(existing.totalRevenue)
                        .plus(itemRevenue)
                        .toNumber();
                    existing.razorpayFee = new Decimal(existing.razorpayFee)
                        .plus(razorpayFee)
                        .toNumber();
                    existing.gstOnFee = new Decimal(existing.gstOnFee)
                        .plus(gstOnFee)
                        .toNumber();
                    existing.finalSettlement = new Decimal(existing.finalSettlement)
                        .plus(finalSettlement)
                        .toNumber();
                    existing.numberOfOrders += 1;
                } else {
                    menuItemStats.set(key, {
                        menuItemName: item.menuItem.name,
                        totalQuantitySold: item.quantity,
                        totalRevenue: itemRevenue.toNumber(),
                        razorpayFee: razorpayFee.toNumber(),
                        gstOnFee: gstOnFee.toNumber(),
                        finalSettlement: finalSettlement.toNumber(),
                        numberOfOrders: 1
                    });
                }
            });
        });

        const menuAnalysis = Array.from(menuItemStats.values())
            .sort((a, b) => b.totalRevenue - a.totalRevenue);

        // Calculate summary for this canteen
        const summary = {
            totalRevenue: menuAnalysis.reduce((sum, item) =>
                new Decimal(sum).plus(item.totalRevenue).toNumber(), 0),
            totalRazorpayFee: menuAnalysis.reduce((sum, item) =>
                new Decimal(sum).plus(item.razorpayFee).toNumber(), 0),
            totalGST: menuAnalysis.reduce((sum, item) =>
                new Decimal(sum).plus(item.gstOnFee).toNumber(), 0),
            totalSettlement: menuAnalysis.reduce((sum, item) =>
                new Decimal(sum).plus(item.finalSettlement).toNumber(), 0),
            totalQuantity: menuAnalysis.reduce((sum, item) => sum + item.totalQuantitySold, 0)
        };

        // Create separate workbook for this canteen
        const wb = XLSX.utils.book_new();

        // Configure headers
        const headers = [
            { header: 'Menu Item', key: 'menuItemName', width: 30 },
            { header: 'Total Quantity', key: 'totalQuantitySold', width: 15 },
            { header: 'Total Revenue (₹)', key: 'totalRevenue', width: 15 },
            { header: 'Razorpay Fee (₹)', key: 'razorpayFee', width: 15 },
            { header: 'GST on Fee (₹)', key: 'gstOnFee', width: 15 },
            { header: 'Final Settlement (₹)', key: 'finalSettlement', width: 15 },
            { header: 'Number of Orders', key: 'numberOfOrders', width: 15 },
        ];

        // Create main analysis sheet
        const ws = XLSX.utils.json_to_sheet([], { header: headers.map(h => h.key) });
        XLSX.utils.sheet_add_aoa(ws, [headers.map(h => h.header)], { origin: 'A1' });

        if (menuAnalysis.length > 0) {
            XLSX.utils.sheet_add_json(ws, menuAnalysis, {
                origin: 'A2',
                skipHeader: true,
            });
        }

        ws['!cols'] = headers.map(h => ({ width: h.width }));

        // Add summary at the bottom
        const summaryStartRow = menuAnalysis.length + 3;
        const summaryRows = [
            ['Summary Statistics'],
            ['Total Items Sold:', summary.totalQuantity],
            ['Total Revenue:', summary.totalRevenue],
            ['Total Razorpay Fee:', summary.totalRazorpayFee],
            ['Total GST on Fee:', summary.totalGST],
            ['Final Settlement Amount:', summary.totalSettlement],
            ['Unique Menu Items:', menuAnalysis.length]
        ];

        XLSX.utils.sheet_add_aoa(ws, summaryRows, { origin: `A${summaryStartRow}` });
        XLSX.utils.book_append_sheet(wb, ws, 'Menu Analysis');

        // Create top performers sheet
        const topPerformersWs = XLSX.utils.json_to_sheet([], { header: headers.map(h => h.key) });
        XLSX.utils.sheet_add_aoa(topPerformersWs, [headers.map(h => h.header)], { origin: 'A1' });

        const top20Items = menuAnalysis.slice(0, 20);
        if (top20Items.length > 0) {
            XLSX.utils.sheet_add_json(topPerformersWs, top20Items, {
                origin: 'A2',
                skipHeader: true,
            });
        }

        topPerformersWs['!cols'] = headers.map(h => ({ width: h.width }));
        XLSX.utils.book_append_sheet(wb, topPerformersWs, 'Top 20 Items');

        // Save workbook for this canteen
        const dateStr = startDate.toISOString().split('T')[0];
        const filename = `${canteenName.toLowerCase().replace(/\s+/g, '_')}_menu_analysis_${dateStr}.xlsx`;
        XLSX.writeFile(wb, filename);

        canteenReports.push({
            canteenName,
            menuAnalysis,
            summary
        });
    }

    return canteenReports;
}


export const generateMenuReport = async (dateString: string) => {
    try {
        const selectedDate = new Date(dateString);
        selectedDate.setHours(0, 0, 0, 0);

        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

        const reports = await generateMenuAnalysisReport({
            startDate: selectedDate,
            endDate: endDate
        });

        if (reports && reports.length > 0) {
            reports.forEach(report => {
                console.log(`\nReport generated for ${report.canteenName}:`);
                console.log(`- Total Items Sold: ${report.summary.totalQuantity}`);
                console.log(`- Total Revenue: ₹${report.summary.totalRevenue}`);
                console.log(`- Total Razorpay Fee: ₹${report.summary.totalRazorpayFee}`);
                console.log(`- Total GST on Fee: ₹${report.summary.totalGST}`);
                console.log(`- Final Settlement: ₹${report.summary.totalSettlement}`);

                console.log('\nTop 5 Items by Revenue:');
                report.menuAnalysis.slice(0, 5).forEach((item, index) => {
                    console.log(`${index + 1}. ${item.menuItemName}`);
                    console.log(`   Quantity: ${item.totalQuantitySold}, Revenue: ₹${item.totalRevenue}`);
                    console.log(`   Final Settlement: ₹${item.finalSettlement}`);
                });
            });
        }
    } catch (error) {
        console.error('Error generating menu analysis reports:', error);
        throw error;
    }
};
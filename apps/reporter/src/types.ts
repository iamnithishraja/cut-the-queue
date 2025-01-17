export interface OrderReportItem {
    orderId: string;
    customerName: string;
    phoneNumber: string;
    items: string;
    subtotal: number;
    razorpayFee: number;
    gstOnRazorpayFee: number;
    finalTotal: number;
    orderDate: string;
    paymentId: string;
}

export interface CanteenSummary {
    canteenName: string;
    totalOrders: number;
    totalRevenue: number;
    totalRazorpayFee: number;
    totalGSTOnFee: number;
    finalTotal: number;
}

export interface CanteenReport {
    canteenId: string;
    canteenName: string;
    reportData: OrderReportItem[];
    summary: CanteenSummary;
}

export interface Report {
    filename: string;
    canteenReports: CanteenReport[];
}
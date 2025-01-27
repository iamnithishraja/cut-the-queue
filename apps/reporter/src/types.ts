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

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

export interface MenuItemAnalysis {
    menuItemName: string;
    totalQuantitySold: number;
    totalRevenue: number;
    razorpayFee: number;
    gstOnFee: number;
    finalSettlement: number;
    numberOfOrders: number;
}

export interface CanteenReportMenu {
    canteenName: string;
    menuAnalysis: MenuItemAnalysis[];
    summary: {
        totalRevenue: number;
        totalRazorpayFee: number;
        totalGST: number;
        totalSettlement: number;
        totalQuantity: number;
    };
}

export interface CanteenOrder {
    canteenName: string;
    orders: OrderReportItem[]; 
  };
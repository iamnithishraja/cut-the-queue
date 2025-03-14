import z from "zod";

export type SMSMessage = {
  to: string;
  content: string;
};

export interface EmailMessage {
  to: string;
  subject: string;
  content: string;
  html?: string;
}

export const NotificationMessage = z.object({
	firebaseToken: z.string(),
	title: z.string(),
  body: z.string().optional(),
	data: z.record(z.string()).optional(),
});

export interface OrderResult {
  id: string;
  canteenId: string;
  customer: {
      fcmToken: string | null;
  };
}
type MenuItemArray = {
  itemName:string;
  quantity:number;
  image:string | null;
  price:number;
  total:number;
}
export type OrderList={
  menuItems:MenuItemArray[]
  summary:{
    totalAmount:number;
    razorPayCut:number;
    taxOnRazorPayCut:number;
    totalAmountToBePaid:number;
  }
}

export type NotificationMessage = z.infer<typeof NotificationMessage>;

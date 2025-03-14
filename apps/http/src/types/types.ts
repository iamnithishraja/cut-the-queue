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
type MenuItem = {
  name: string;
  quantity: number;
  image: string | null;
  price: number;
  total: number;
};

type OrderSummary = {
  totalAmount: number;
  razorPayCut: number;
  taxOnRazorPayCut: number;
  totalAmountToBePaid: number;
};

export type OrderDetails = {
  items: MenuItem[];
  summary: OrderSummary;
};

type UserOrder = {
  name: string;
  email: string;
  phoneNumber: string;
  items: MenuItem[];
  summary: OrderSummary;
};

export type UserOrdersResponse = {
  users: UserOrder[];
  summary: OrderSummary;
};

export type NotificationMessage = z.infer<typeof NotificationMessage>;

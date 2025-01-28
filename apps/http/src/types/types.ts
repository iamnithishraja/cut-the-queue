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

export type PaymentSuccessResponse = {
  status: 200;
  data: {
      success: boolean;
      message: string;
      orderId: string;
  };
};

export type PaymentOrderResponse = {
  status: 200;
  data: {
      id: string;
      userId: string;
      orderStatus: string;
      canteenId: string;
      isPaid: boolean;
      paymentId: string | null;
      paymentToken: string;
      createdAt: Date;
      menuItemId: string | null;
      customer: {
          fcmToken: string | null;
      };
  };
};

export type TransactionResult = PaymentSuccessResponse | PaymentOrderResponse;


export type NotificationMessage = z.infer<typeof NotificationMessage>;

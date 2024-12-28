import z from "zod";

export type SMSMessage = {
  to: string;
  content: string;
};

export type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  content: string;
  html?: string;
};

export const NotificationMessage = z.object({
	firebaseToken: z.string(),
	title: z.string(),
  body: z.string().optional(),
	data: z.record(z.string()).optional(),
});

export type NotificationMessage = z.infer<typeof NotificationMessage>;

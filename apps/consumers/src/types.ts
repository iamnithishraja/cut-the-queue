import { Message } from "kafkajs";
import { z } from "zod";

export interface KafkaMessage {
	topic: string;
	partition: number;
	message: Message;
}

export const smsMessage = z.object({
	to: z.string(),
	content: z.string(),
});

export type SMSMessage = Zod.infer<typeof smsMessage>;

export const EmailMessage = z.object({
	to: z.string().email(),
	from: z.string().email(),
	subject: z.string(),
	content: z.string(),
	html: z.string().optional(),
});

export type EmailMessage = z.infer<typeof EmailMessage>;

export const NotificationMessage = z.object({
	firebaseToken: z.string(),
	title: z.string(),
	data: z.record(z.string()).optional(),
});

export type NotificationMessage = z.infer<typeof NotificationMessage>;

export type MessageHandler = (message: KafkaMessage) => Promise<void>;

import { z } from 'zod';
import { MessageType, Screen } from '../types';

export const InitMessageSchema = z.object({
	type: z.literal(MessageType.INIT),
	token: z.string()
});

export const SubscribeMessageSchema = z.object({
	type: z.literal(MessageType.SUBSCRIBE),
	canteenId: z.string(),
	screen: z.nativeEnum(Screen)
});

export const UnsubscribeMessageSchema = z.object({
	type: z.literal(MessageType.UNSUBSCRIBE),
	canteenId: z.string(),
	screen: z.nativeEnum(Screen)
});

export const PartnerOrderUpdates = z.object({
	type: z.literal(MessageType.PARTNER_ORDER_STATUS_UPDATE),
	canteenId: z.string(),
})

export const pingSchema = z.object({
	type: z.literal(MessageType.PING)
})

export const MessageSchema = z.discriminatedUnion('type', [
	InitMessageSchema,
	SubscribeMessageSchema,
	UnsubscribeMessageSchema,
	PartnerOrderUpdates,
	pingSchema
]);

export const orderItemSchema = z.object({
	userId: z.string().cuid(),
	orderId: z.string().cuid()
});
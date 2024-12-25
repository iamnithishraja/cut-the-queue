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

export const MessageSchema = z.discriminatedUnion('type', [
	InitMessageSchema,
	SubscribeMessageSchema,
	UnsubscribeMessageSchema
]);
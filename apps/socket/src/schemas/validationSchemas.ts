import { z } from "zod";
import { Screen } from "../types/socketTypes";

export const canteenIdSchema = z.object({
	params: z.object({
		canteenId: z.string().uuid(),
	}),
});

export const orderIdSchema = z.object({
	params: z.object({
		orderId: z.string().uuid(),
	}),
});

export const socketMessageSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("init"),
		token: z.string(),
		id: z.string().uuid(),
	}),
	z.object({
		type: z.literal("subscribe"),
		screen: z.nativeEnum(Screen),
	}),
	z.object({
		type: z.literal("unsubscribe"),
		screen: z.nativeEnum(Screen),
	}),
]);

export const orderItemSchema = z.object({
  params: z.object({
    order_item_id: z.string().uuid(),
  }),
  body: z.object({
    user_id: z.string().uuid(),
  }),
});

export type CanteenIdSchema = z.infer<typeof canteenIdSchema>;
export type OrderIdSchema = z.infer<typeof orderIdSchema>;
export type SocketMessageSchema = z.infer<typeof socketMessageSchema>;
export type OrderItemSchema = z.infer<typeof orderItemSchema>;

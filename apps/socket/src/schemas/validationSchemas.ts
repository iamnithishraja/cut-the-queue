import { z } from 'zod';
import { Screen } from '../types/screen';

export const canteenIdSchema = z.object({
  params: z.object({
    canteenId: z.string().uuid()
  })
});

export const orderIdSchema = z.object({
  params: z.object({
    orderId: z.string().uuid()
  })
});

export const socketMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('init'),
    token: z.string()
  }),
  z.object({
    type: z.literal('subscribe'),
    screen: z.nativeEnum(Screen),
    active: z.boolean()
  }),
  z.object({
    type: z.literal('unsubscribe'),
    screen: z.nativeEnum(Screen)
  })
]);

export type CanteenIdSchema = z.infer<typeof canteenIdSchema>;
export type OrderIdSchema = z.infer<typeof orderIdSchema>;
export type SocketMessageSchema = z.infer<typeof socketMessageSchema>;

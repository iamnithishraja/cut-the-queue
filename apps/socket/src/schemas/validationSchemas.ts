import { z } from 'zod';

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

export const socketMessageSchema = z.object({
  type: z.string(),
  id: z.string().uuid()
});

export type CanteenIdSchema = z.infer<typeof canteenIdSchema>;
export type OrderIdSchema = z.infer<typeof orderIdSchema>;
export type SocketMessageSchema = z.infer<typeof socketMessageSchema>;

import { z } from 'zod';

export const CheckoutInputSchema = z.object({
    items: z.array(z.object({
        menuItemId: z.string(),
        quantity: z.number().int().positive()
    })),
    canteenId: z.string()
});

export const PaymentVerificationSchema = z.object({
    razorpay_payment_id: z.string(),
    razorpay_order_id: z.string(),
    razorpay_signature: z.string()
});
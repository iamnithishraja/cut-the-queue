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

export const AvailabilityStatusEnum = z.enum(['AVAILABLE', 'UNAVAILABLE']);
export const MenuItemTypeEnum = z.enum(["Instant", "TimeConsuming"]);

export const menuItemSchema = z.object({
    id: z.string().cuid(),
    name: z.string(),
    type: MenuItemTypeEnum,
    description: z.string().nullable().optional(),
    isVegetarian: z.boolean().default(true),
    itemImage: z.string().nullable().optional(),
    price: z.number().positive(),
    avilableLimit: z.number().int().nullable().optional(),
    canteenId: z.string(),
    status: AvailabilityStatusEnum.default('AVAILABLE'),
});

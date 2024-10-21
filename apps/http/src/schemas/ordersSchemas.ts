import { z } from 'zod';

export const CheckoutInputSchema = z.object({
    items: z.array(z.object({
        menuItemId: z.string(),
        quantity: z.number().int().positive()
    })),
    userId: z.string(),
    canteenId: z.string()
});

import { z } from 'zod';

// Enums
export const OrderItemStatusEnum = z.enum(["COOKING", "WAITING_FOR_PICKUP", "SENT"]);
export const OrderStatusEnum = z.enum(["PROCESSING", "DONE"]);
export const AvailabilityStatusEnum = z.enum(["AVAILABLE", "UNAVAILABLE"]);
export const MenuItemTypeEnum = z.enum(["Instant", "TimeConsuming"]);
export const UserRoleEnum = z.enum(["USER", "PARTNER", "ADMIN"]);

// User Schema
export const UserSchema = z.object({
  id: z.string().cuid(),
  firstName: z.string(),
  lastName: z.string(),
  userProfile: z.string().nullable(),
  email: z.string().email(),
  phoneNumber: z.string(),
  isVerified: z.boolean(),
  canteenId: z.string().nullable(),
  resetPasswordToken: z.string().nullable(),
  expire: z.date().nullable(),
  otp: z.string().nullable(),
  fcmToken: z.string().nullable(),
  password: z.string().nullable(),
  googleId: z.string().nullable(),
  role: UserRoleEnum,
  orders: z.array(z.object({ id: z.string().cuid() })), // Simplified relation
});

// Canteen Schema
export const CanteenSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  canteenImage: z.string().nullable(),
  isOpen: z.boolean().default(true),
  password: z.string(),
  orders: z.array(z.object({ id: z.string().cuid() })), // Simplified relation
  users: z.array(z.object({ id: z.string().cuid() })), // Simplified relation
});

// MenuItem Schema
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

// OrderItem Schema
export const OrderItemSchema = z.object({
  id: z.string().cuid(),
  menuItemId: z.string(),
  menuItem: menuItemSchema,
  quantity: z.number().positive(),
  status: OrderItemStatusEnum,
  orderId: z.string(),
});

// Order Schema
export const OrderSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  orderStatus: OrderStatusEnum,
  canteenId: z.string(),
  isPaid: z.boolean(),
  paymentId: z.string().nullable(),
  paymentToken: z.string(),
  createdAt: z.date(),
  menuItemId: z.string().nullable(),
  OrderItem: z.array(OrderItemSchema),
});

// Input Validation Schema for Checkout
export const CheckoutInputSchema = z.object({
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().int().positive(),
  })),
  canteenId: z.string(),
});

// Payment Verification Schema
export const PaymentVerificationSchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_order_id: z.string(),
  razorpay_signature: z.string(),
});

import { z } from "zod";

// Enums
export const OrderItemStatusEnum = z.enum([
	"COOKING",
	"WAITING_FOR_PICKUP",
	"SENT",
]);
export const OrderStatusEnum = z.enum(["PROCESSING", "DONE"]);
export const AvailabilityStatusEnum = z.enum(["AVAILABLE", "UNAVAILABLE"]);
export const MenuItemTypeEnum = z.enum(["Instant", "TimeConsuming"]);
export const UserRoleEnum = z.enum(["USER", "PARTNER", "ADMIN"]);
const OrderAnalysisTypeEnum = z.enum(["MENUITEM", "USER"]);
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
	counter: z.number().int(),
	isVegetarian: z.boolean().default(true),
	itemImage: z.string().nullable().optional(),
	price: z.number().positive(),
	avilableLimit: z.number().int().nullable().optional(),
	canteenId: z.string(),
	status: AvailabilityStatusEnum.default("AVAILABLE"),
});

export const CreateMenuItemSchema = z.object({
	name: z.string().min(1),
	type: MenuItemTypeEnum,
	description: z.string().optional(),
	price: z.number().positive(),
	isVegetarian: z.boolean().default(true),
	avilableLimit: z.number().int().optional(),
	category: z.string(),
	status: AvailabilityStatusEnum.default("AVAILABLE"),
	mimeType: z.string().optional(),
});

export const EditMenuItemSchema = CreateMenuItemSchema.partial().refine(
	(data) => Object.keys(data).length > 0,
	"At least one field must be provided for update"
);

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
	items: z.array(
		z.object({
			menuItemId: z.string(),
			quantity: z.number().int().positive(),
		})
	),
	canteenId: z.string(),
});

// Payment Verification Schema
export const PaymentVerificationSchema = z.object({
	razorpay_payment_id: z.string(),
	razorpay_order_id: z.string(),
	razorpay_signature: z.string(),
});

export const OrderAnalysisSchema = z.object({
    dateString: z.string(),
    type: OrderAnalysisTypeEnum
});
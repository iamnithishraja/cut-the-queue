export const USER_ALREADY_EXISTS = "User already exists";
export const USER_NOT_VERIFIED = "User not verified";
export const INVALID_INPUT = "Invalid input";
export const SERVER_ERROR = "Server error";
export const INVALID_CREDENTIALS = "Invalid credentials";
export const INVALID_GOOGLE_TOKEN = "Invalid Google token";
export const USER_NOT_REGISTERED = "User not registered";
export const OTP_SENT = "OTP sent successfully";
export const INVALID_OTP = "INVALID OTP";
export const OTP_VERIFICATION_SUCCESSFUL = "OTP verification successful";
export const CANTEENS_NOT_FOUND = "No canteens available";
export const DISHES_NOT_FOUND = "No dishes found";
export const BROADCAST_QUANTITY = "Updated quantity successfully broadcasted";
export const ORDER_HANDOVER = "Order handover successful";
export const USER_NOT_AUTHORISED = "You Are Not Allowed To Access This Route";
export const REDIS_CONNECTION_ERROR = "Unable to connect to redis";
export const PASSWORD_MISMATCH = "Passwords don't match";
export const PASSWORD_CHANGE_SUCCESS = "Password changed successfully";
export const ACTIVE_ORDERS_EXIST = "Cannot delete account with active orders";
export const ACCOUNT_DELETED = "Account deleted successfully";
export const LOGOUT_SUCCESS = "Logout successful";
export const PHONE_UPDATE_SUCCESS = "Phone number updated successfully";
export const INVALID_PHONE_FORMAT = "Phone number must be 10 digits";
export const UNAUTHORIZED = "Unauthorized";
export const INVALID_PAGE_NUMBER = "Invalid page number";
export const OTP_SEND_FAILED = "Failed to send OTP";

// Payment related constants
export const CHECKOUT_FAILED = "Failed to process checkout";
export const PAYMENT_ALREADY_PROCESSED = "Payment already processed";
export const PAYMENT_PROCESSED = "Payment processed successfully";
export const PAYMENT_ACKNOWLEDGED =
	"Payment acknowledged despite processing error";
export const MISSING_SIGNATURE = "Missing signature";
export const INVALID_SIGNATURE = "Invalid signature";
export const INVALID_WEBHOOK_PAYLOAD = "Invalid webhook payload format";
export const ORDER_NOT_FOUND = "Order not found";

// Canteen related constants
export const CANTEEN_NOT_FOUND = "Canteen not found";
export const NO_CANTEEN_ASSOCIATED = "No canteen associated with this user";
export const CANTEEN_STATUS_UPDATED = "Canteen status updated";
export const CANTEEN_OPENED = "Canteen is now open";
export const CANTEEN_CLOSED = "Canteen is now closed";
export const MENU_ITEM_NOT_FOUND = "Menu item not found or not authorized";
export const MENU_ITEM_ADDED = "Menu item added successfully";
export const IMAGE_UPLOAD_FAILED = "Failed to process image upload";
export const MENU_ITEM_UPDATED = "Menu item updated successfully";

// Order related constants
export const ITEMS_UNAVAILABLE = "Some items are not available or do not exist";
export const QUANTITY_EXCEEDS_LIMIT = "Quantity exceeds available limit";
export const ORDER_ITEM_NOT_FOUND = "No valid order items found";
export const ORDER_UPDATED = "Order updated successfully";
export const ORDER_COMPLETED = "Order completed successfully";
export const ORDER_ALREADY_PAID = "Order already paid";
export const ORDER_ITEM_READY = "Your order item is ready";
export const ORDER_MISMATCHED = "Order items mismatch";

import prisma, { MenuItemType, OrderItemStatus } from "@repo/db/client";
import crypto from "crypto";
import { Response } from "express";
import z from "zod";
import { razorpayInstance } from "../..";
import { SERVER_ERROR } from "../constants/userConstants";
import { CheckoutInputSchema } from "../schemas/ordersSchemas";
import { sendPushNotification } from "../services/pushNotificationService";
import { CustomRequest } from "../types/userTypes";

// TODO: modify to process one order at a time by locking the transactions if multithread machine is used.
async function checkout(req: CustomRequest, res: Response): Promise<any> {
  try {
    const validatedInput = CheckoutInputSchema.parse(req.body);
    const { items, canteenId } = validatedInput;

    // Fetch menu items to verify prices and availability
    const menuItemIds = items.map((item) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        status: "AVAILABLE",
      },
    });

    // Verify all items exist and are available
    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({
        error: "Some items are not available or do not exist",
      });
    }

    // Calculate total and verify quantities
    let total = 0;
    const orderItems = items.map((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      if (!menuItem) throw new Error("Item not found");

      if (menuItem.avilableLimit && item.quantity > menuItem.avilableLimit) {
        throw new Error(
          `Quantity exceeds available limit for ${menuItem.name}`
        );
      }

      total += menuItem.price * item.quantity;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        status:
          menuItem.type == MenuItemType.Instant
            ? OrderItemStatus.WAITING_FOR_PICKUP
            : OrderItemStatus.COOKING,
      };
    });

    const razorpayOptions = {
      amount: Math.round(total * 100),
      currency: "INR",
    };

    const razorpayOrder = await razorpayInstance.orders.create(razorpayOptions);
    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: req.user!.id,
        canteenId,
        paymentToken: razorpayOrder.id,
        isPaid: false,
        OrderItem: {
          createMany: {
            data: orderItems,
          },
        },
      },
      include: {
        OrderItem: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    res.status(200).json({
      order,
      paymentOrder: razorpayOrder,
    });
  } catch (error) {
    console.error("Checkout error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid input",
        details: error.errors,
      });
    }

    res.status(500).json({
      error: "Failed to process checkout",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function paymentVerification(
  req: CustomRequest,
  res: Response
): Promise<any> {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: "Missing signature",
      });
    }

    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== signature) {
      return res.status(400).json({
        success: false,
        error: "Invalid signature",
      });
    }

    // Extract payment details
    const { payload } = req.body;
    if (!payload || !payload.payment || !payload.payment.entity) {
      return res.status(400).json({
        success: false,
        error: "Invalid webhook payload format",
      });
    }

    const {
      payment: { entity },
    } = payload;
    const razorpay_payment_id = entity.id;
    const razorpay_order_id = entity.order_id;

    // First, check if the order exists and if it's already paid
    const existingOrder = await prisma.order.findFirst({
      where: { paymentToken: razorpay_order_id },
    });

    if (!existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order not found, but acknowledging payment",
      });
    }

    if (existingOrder.isPaid) {
      // If the order is already marked as paid, consider this a success
      // This handles duplicate webhook calls from Razorpay
      return res.status(200).json({
        success: true,
        message: "Payment already processed",
        orderId: existingOrder.id,
      });
    }

    // Simply mark the order as paid - this is the critical step
    const updatedOrder = await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        isPaid: true,
        paymentId: razorpay_payment_id,
      },
      include: {
        customer: {
          select: {
            fcmToken: true,
          },
        },
      },
    });

    // Handle non-critical operations separately and don't let them affect the response
    setTimeout(async () => {
      try {
        // Handle inventory updates in a separate, non-blocking process
        await prisma.$transaction(async (prismaClient) => {
          const orderWithItems = await prismaClient.order.findUnique({
            where: { id: updatedOrder.id },
            include: {
              OrderItem: {
                include: {
                  menuItem: true,
                },
              },
            },
          });

          if (orderWithItems) {
            for (const orderItem of orderWithItems.OrderItem) {
              const menuItem = orderItem.menuItem;

              // Skip if item has unlimited stock
              if (menuItem.avilableLimit === null) continue;

              // Update inventory status separately
              await prismaClient.menuItem.update({
                where: { id: menuItem.id },
                data: {
                  avilableLimit: {
                    decrement: orderItem.quantity,
                  },
                  status:
                    menuItem.avilableLimit - orderItem.quantity <= 0
                      ? "UNAVAILABLE"
                      : "AVAILABLE",
                },
              });
            }
          }
        });

        // Send notification
        if (updatedOrder.customer?.fcmToken) {
          await sendPushNotification(
            updatedOrder.customer.fcmToken,
            `Your Payment is Successful ✅`,
            `Thank You for choosing CutTheQ`
          );
        }
      } catch (error) {
        // Just log the error, don't affect the main process
        console.error("Error in post-payment processing:", error);

        // Send notification
        if (updatedOrder.customer?.fcmToken) {
          await sendPushNotification(
            updatedOrder.customer.fcmToken,
            `Your Payment is Successful ✅`,
            `Thank You for choosing CutTheQ`
          );
        }
      }
    }, 0);

    // Always return success for the payment
    return res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      orderId: updatedOrder.id,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);

    return res.status(200).json({
      success: true,
      message: "Payment acknowledged despite processing error",
    });
  }
}

const getAllOrders = async (req: CustomRequest, res: Response) => {
  try {
    const items = await prisma.order.findMany({
      where: {
        userId: req.user?.id,
        orderStatus: "PROCESSING",
        isPaid: true,
      },
      include: {
        OrderItem: {
          include: {
            menuItem: true,
          },
        },
      },
    });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ mesage: SERVER_ERROR });
    console.log(e);
  }
};

export { checkout, getAllOrders, paymentVerification };


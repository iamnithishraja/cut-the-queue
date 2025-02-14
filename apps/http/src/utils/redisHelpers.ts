import {
    BROADCAST_QUANTITY,
    DISHES_NOT_FOUND,
    SERVER_ERROR,
    REDIS_CONNECTION_ERROR,
} from "@repo/constants";
import prisma from "@repo/db/client";
import { RedisManager } from "../publisher/redis";

// Helper function to safely publish Redis messages
const safeRedisPublish = async (message: any): Promise<boolean> => {
    try {
        const publisher = RedisManager.getInstance().getPublisher();
        const channel = process.env.REDIS_CHANNEL || "sockets";
        
        // Check Redis connection before publishing
        const isConnected = publisher.status === "ready";
        if (!isConnected) {
            console.error({ message: REDIS_CONNECTION_ERROR });
            return false;
        }

        await publisher.publish(channel, JSON.stringify(message));
        return true;
    } catch (error) {
        console.error({ message: REDIS_CONNECTION_ERROR, error });
        return false;
    }
};

const broadcastMenuItems = async (canteenId: string): Promise<boolean> => {
    try {
        const updatedMenuItems = await prisma.menuItem.findMany({
            where: { canteenId },
        });

        if (!updatedMenuItems?.length) {
            throw new Error(DISHES_NOT_FOUND);
        }

        const success = await safeRedisPublish({
            type: 'UPDATE_MENU_ITEMS',
            canteenId,
            menuItems: updatedMenuItems,
        });

        if (success) {
            console.log({ message: BROADCAST_QUANTITY });
        }
        return success;
    } catch (error) {
        console.error({ message: SERVER_ERROR, error });
        return false;
    }
};

const updateUserOrders = async (userId: string): Promise<boolean> => {
    try {
        const success = await safeRedisPublish({
            type: 'ORDERS_UPDATE_USER',
            userId,
        });

        if (success) {
            console.log({ message: "Notified User Successfully" });
        }
        return success;
    } catch (error) {
        console.error({ message: SERVER_ERROR, error });
        return false;
    }
};

const updateCanteenOrders = async (canteenId: string): Promise<boolean> => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                canteenId,
                orderStatus: "PROCESSING",
                isPaid: true
            },
            include: {
                OrderItem: {
                    include: {
                        menuItem: true
                    }
                }
            }
        });

        const success = await safeRedisPublish({
            type: 'ORDERS_UPDATE_ADMIN',
            canteenId,
            orders,
        });

        if (success) {
            console.log({ message: "Notified User Successfully" });
        }
        return success;
    } catch (error) {
        console.error({ message: SERVER_ERROR, error });
        return false;
    }
};

// Re-export with more specific return types
export { 
    broadcastMenuItems, 
    updateUserOrders, 
    updateCanteenOrders 
};
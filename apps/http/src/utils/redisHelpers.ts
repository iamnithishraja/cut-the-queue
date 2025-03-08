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
        const channel = process.env.REDIS_CHANNEL || "broadcaster";

        // Enhanced connection check
        const isConnected = publisher.status === "ready";
        if (!isConnected) {
            console.error('Redis not connected:', { status: publisher.status, isOpen: publisher.status === "ready" });
            throw new Error(REDIS_CONNECTION_ERROR);
        }

        await publisher.publish(channel, JSON.stringify(message));
        console.log(`Published message to channel ${channel}`);
        return true;
    } catch (error) {
        console.error('Redis publish error:', error);
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
                },
                customer: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
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
const broadcastCanteenStatus = async (canteenId: string, isOpen: boolean): Promise<boolean> => {
    try {
        const success = await safeRedisPublish({
            type: 'UPDATE_CANTEEN_STATUS',
            canteenId,
            isOpen,
        });
        if(success) {
            console.log({ message: "Notified users and partners sucessfully" });
        }
        return success;
    } catch (error) {
        console.error({ message: SERVER_ERROR, error });   
        return false; 
    }
}

// Re-export with more specific return types
export { 
    broadcastMenuItems, 
    updateUserOrders, 
    updateCanteenOrders,
    broadcastCanteenStatus
};
import { INVALID_INPUT, SERVER_ERROR } from "@repo/constants";
import prisma from "@repo/db/client";
import { Request, Response } from "express";
import z from "zod";
import {
  CreateMenuItemSchema,
  EditMenuItemSchema,
  OrderAnalysisSchema,
} from "../schemas/ordersSchemas";
import { calculateAmountSchema } from "../schemas/userSchemas";
import { CustomRequest } from "../types/userTypes";
import { getUploadUrl } from "../utils/r2";
import {
  broadcastMenuItems,
  broadcastCanteenStatus,
} from "../utils/redisHelpers";
import { OrderDetails } from "../types/types";

async function getAllDishes(req: Request, res: Response) {
  const canteenId = req.params.canteenId;
  try {
    const items = await prisma.menuItem.findMany({
      where: { canteenId: canteenId },
    });
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: SERVER_ERROR });
  }
}

const getAllCanteen = async (req: Request, res: Response): Promise<any> => {
  try {
    const canteens = await prisma.canteen.findMany();
    res.json({ canteens, length: canteens.length });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR });
  }
};

const calculateAmountForOrder = async (req: Request, res: Response) => {
  try {
    const orderItemList = calculateAmountSchema.parse(req.body);
    const ids = orderItemList.map((item) => item.id);
    const orderItemMap = new Map();
    for (const order of orderItemList) {
      orderItemMap.set(order.id, order.quantity);
    }

    const dishes = await prisma.menuItem.findMany({
      where: { id: { in: ids } },
    });

    if (dishes.length <= 0) {
      res.status(404).json({ message: INVALID_INPUT });
      return;
    }

    if (dishes.length != orderItemList.length) {
      res.status(404).json({ message: "mismatch" });
      return;
    }

    let totalAmount = 0;
    dishes.forEach((dish) => {
      const quantity = orderItemMap.get(dish?.id);
      if (dish) {
        totalAmount += quantity * dish.price;
      }
    });

    res.status(200).json({ total: totalAmount });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ message: INVALID_INPUT, errors: e.errors });
    } else {
      console.error(e);
      res.status(500).json({ message: SERVER_ERROR });
    }
  }
};

const toggleCanteenAvailability = async (req: Request, res: Response) => {
  try {
    const canteenId = req.params.canteenId;
    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId },
      select: { isOpen: true },
    });

    if (!canteen) {
      res.status(404).json({
        success: false,
        message: "Canteen not found",
      });
      return;
    }

    const newStatus = !canteen.isOpen;

    await prisma.canteen.update({
      where: { id: canteenId },
      data: { isOpen: newStatus },
    });

    await broadcastMenuItems(canteenId as string);
    await broadcastCanteenStatus(canteenId as string, newStatus);

    res.status(200).json({
      success: true,
      message: `Canteen is now ${newStatus ? "open" : "closed"}`,
      isOpen: newStatus,
    });
  } catch (error) {
    console.error("Toggle canteen availability error:", error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR,
    });
  }
};

const addMenuItem = async (req: CustomRequest, res: Response) => {
  try {
    const data = CreateMenuItemSchema.parse(req.body);
    const canteenId = req.user?.canteenId;

    if (!canteenId) {
      res.status(403).json({
        message: "No canteen associated with this user",
      });
      return;
    }

    // Get upload URL if mimeType is provided
    let uploadData: { url: string; key: string } | null = null;
    if (data.mimeType) {
      try {
        uploadData = await getUploadUrl(data.mimeType, canteenId);
      } catch (error) {
        res.status(400).json({ message: (error as Error).message });
        return;
      }
    }

    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        price: data.price,
        isVegetarian: data.isVegetarian,
        avilableLimit: data.avilableLimit,
        category: data.category,
        status: data.status,
        canteenId,
        itemImage: uploadData?.key
          ? `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${uploadData.key}`
          : null,
      },
    });

    await broadcastMenuItems(canteenId);

    res.status(201).json({
      success: true,
      menuItem,
      upload: uploadData,
    });
  } catch (error) {
    console.error("Add menu item error:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: INVALID_INPUT,
      });
      return;
    }

    res.status(500).json({ message: SERVER_ERROR });
  }
};

const editMenuItem = async (req: CustomRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const data = EditMenuItemSchema.parse(req.body);
    const canteenId = req.user?.canteenId;

    if (!canteenId) {
      res.status(403).json({ message: "No canteen associated with this user" });
      return;
    }

    // Check if menu item exists and belongs to this canteen
    const existingMenuItem = await prisma.menuItem.findFirst({
      where: { id: menuItemId, canteenId },
    });

    if (!existingMenuItem) {
      res
        .status(404)
        .json({ message: "Menu item not found or not authorized" });
      return;
    }

    // Handle image upload if new image is being set
    let imageUrl: string | undefined;
    if (data.mimeType) {
      try {
        const uploadData = await getUploadUrl(data.mimeType, canteenId);
        imageUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${uploadData.key}`;
      } catch (error) {
        res.status(400).json({
          message: "Failed to process image upload",
          error: (error as Error).message,
        });
        return;
      }
    }

    // Create clean update data object without mimeType
    const updateData = {
      name: data.name,
      type: data.type,
      description: data.description,
      price: data.price,
      isVegetarian: data.isVegetarian,
      avilableLimit: data.avilableLimit,
      category: data.category,
      status: data.status,
      ...(imageUrl && { itemImage: imageUrl }),
    };

    // Update menu item with clean data
    const menuItem = await prisma.menuItem
      .update({
        where: { id: menuItemId },
        data: updateData,
      })
      .catch((error) => {
        console.error("Database update error:", error);
        throw new Error("Failed to update menu item in database");
      });

    await broadcastMenuItems(canteenId).catch((error) => {
      console.error("Broadcast error:", error);
    });

    res.status(200).json({
      success: true,
      menuItem,
      ...(imageUrl && { imageUrl }),
    });
  } catch (error) {
    console.error("Edit menu item error:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: INVALID_INPUT,
        errors: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }

    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: SERVER_ERROR,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: SERVER_ERROR,
    });
  }
};

const getCanteenAvilabality = async (req: Request, res: Response) => {
  try {
    const canteenId = req.params.canteenId;
    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId },
    });
    if (!canteen) {
      res.status(404).json({ message: "Canteen not found" });
      return;
    }
    res.status(200).json({ isOpen: canteen.isOpen });
  } catch (error) {
    console.error("Get canteen availability error:", error);
    res.status(500).json({ message: SERVER_ERROR });
  }
};
const getOrderAnalysis = async (req: CustomRequest, res: Response) => {
  const { startDate, type } = OrderAnalysisSchema.parse(
    req.query
  );
  const TEST_EMAILS = ["developer@cuttheq.in"];
  const canteenId= req.user?.canteenId;

  try {
    if(type==="MENUITEM"){
    const orders = await prisma.order.findMany({
      where: {
        canteenId: canteenId!,
        createdAt: {
          gte: startDate
        },
        orderStatus: "DONE",
        isPaid: true,
        customer: {
          email: {
            notIn: TEST_EMAILS,
          },
        },
      },
      include: {
        canteen: {
          select: {
            id: true,
            name: true,
          },
        },
        OrderItem: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                itemImage: true,
              },
            },
          },
        },
      },
    });
    const orderItems: OrderDetails = {
      items: [],  
      summary: {
        totalAmount: 0,
        razorPayCut: 0,
        taxOnRazorPayCut: 0,
        totalAmountToBePaid: 0
      }
    };
    orders.forEach((order) => {
      order.OrderItem.forEach((item) => {
        const existingItem = orderItems.items.find(
          (menuItem) => menuItem.name === item.menuItem.name
        );
    
        if (existingItem) {
          existingItem.quantity += item.quantity;
          existingItem.total += item.quantity * item.menuItem.price;
        } else {
          orderItems.items.push({
            name: item.menuItem.name,
            quantity: item.quantity,
            image: item.menuItem.itemImage,
            price: item.menuItem.price,
            total: item.quantity * item.menuItem.price,
          });
        }
    
        orderItems.summary.totalAmount += item.quantity * item.menuItem.price;
        orderItems.summary.razorPayCut += (item.quantity * item.menuItem.price) * 0.02;
        orderItems.summary.taxOnRazorPayCut += (item.quantity * item.menuItem.price) * 0.02 * 0.18;
      });
    });
    
    orderItems.summary.totalAmountToBePaid = orderItems.summary.totalAmount - orderItems.summary.razorPayCut - orderItems.summary.taxOnRazorPayCut;
    res.status(200).json({ orderItems });
  }
  else if(type==="USER"){
      const orders= await prisma.order.findMany({
        where: {
          canteenId: canteenId!,
          createdAt: {
            gte: startDate
          },
          orderStatus: "DONE",
          isPaid: true,
          customer: {
            email: {
              notIn: TEST_EMAILS,
            },
          },
        },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
          OrderItem: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  itemImage: true,
                },
              },
            },
          },
        },
      });
  }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: INVALID_INPUT, errors: error.errors });
      return;
    }
    console.error("Get order analysis error:", error);
    res.status(500).json({ message: SERVER_ERROR });
  }
};

export {
  addMenuItem,
  calculateAmountForOrder,
  getCanteenAvilabality,
  editMenuItem,
  getAllCanteen,
  getAllDishes,
  toggleCanteenAvailability,
  getOrderAnalysis,
};

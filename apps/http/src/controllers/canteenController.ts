import { Request, Response } from "express";
import prisma from "@repo/db/client";
import {
  SERVER_ERROR,
  INVALID_INPUT
} from "@repo/constants";
import { calculateAmountSchema } from "../schemas/userSchemas";
import z from 'zod';

async function getAllDishes(req: Request, res: Response): Promise<any> {
  const canteenId = req.params.canteenId;
  try {
    const items = await prisma.menuItem.findMany({
      where: {
        canteenId: canteenId,
      },
    });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ mesage: SERVER_ERROR });
    console.log(e);
  }
}

async function getAllCanteen(req: Request, res: Response) {
  try {
    const canteens = await prisma.canteen.findMany({
      where: {
        isOpen: true
      }
    });
    res.json({ canteens, length: canteens.length });
  } catch (e) {
    res.status(500).json({ message: SERVER_ERROR });
    console.log(e);
  }
}
const calculateAmountForOrder = async (req: Request, res: Response): Promise<any> => {
  try {
    const orderItemList = calculateAmountSchema.parse(req.body);
    const ids = orderItemList.map((item) => item.id);
    const orderItemMap = new Map();
    for (const order of orderItemList) {
      orderItemMap.set(order.id, order.quantity);
    }
    const dishes = await prisma.menuItem.findMany({
      where: {
        id: { in: ids }
      },
    })

    if (dishes.length <= 0) {
      return res.status(404).json({ message: INVALID_INPUT });
    }
    let totalAmount = 0;
    if (dishes.length != orderItemList.length) {
      return res.status(404).json({ message: "mismatch" });
      //this will most likely not occur but handling that as well
    }
    dishes.forEach(dish => {
      const quantity = orderItemMap.get(dish?.id);
      if (dish) {
        totalAmount += quantity * dish.price;
      }
    });

    return res.status(200).json({ total: totalAmount });
  }
  catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ message: INVALID_INPUT, errors: e.errors });
    } else {
      res.status(500).json({ message: SERVER_ERROR });
    }

  }
}
const toggleCanteenAvailability= async(req:Request,res:Response)=>{
   const canteenId=req.params.canteenId;
   const canteen=await prisma.canteen.findUnique({
    where:{
      canteenId:canteenId
    },
    select:{
      isOpen:true,
    }
   });
   if(!canteen){
    return res.status(500).json({success:false,message:"no canteen found"});
   }
    const status= !canteen.isOpen;
   await prisma.canteen.update({
    where:{
      canteenId:canteenId
    },
     data:{
        isOpen:status,
     }
   })
   const menuItems=await prisma.MenuItem.update({
    where:{
      canteenId:canteenId
    },
      data:{
        status:status
      }
   })
   return res.status(200).json({ success:true ,message:"toggled the availability of canteen"});
}
export { getAllDishes, getAllCanteen, calculateAmountForOrder,toggleCanteenAvailability };

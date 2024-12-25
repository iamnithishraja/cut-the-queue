import { Request, Response } from "express";
import prisma from "@repo/db/client";
import {
  CANTEENS_NOT_FOUND,
  DISHES_NOT_FOUND,
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
const calculateAmountForOrder = async(req: Request, res: Response):Promise<any> => {
   try{
    const orderItemList = calculateAmountSchema.parse(req.body);
    const ids=orderItemList.map((item)=>item.id);
    const orderItemMap=new Map();
    for( const order of orderItemList){
       orderItemMap.set(order.id,order.quantity);
    }
    const dishes= await prisma.menuItem.findMany({
      where:{
        id:{ in :ids}
      },
    })
    
    if(dishes.length<=0){
      return res.status(404).json({message : INVALID_INPUT});
    }
    let totalAmount = 0;
    if(dishes.length!=orderItemList.length){
      return res.status(404).json({ message :"mismatch"})
    }
    dishes.forEach(dish => {
      const quantity = orderItemMap.get(dish?.id);
      if (dish) {
        totalAmount += quantity * dish.price;
      }
    });
    
  return res.status(200).json({ totalAmount : totalAmount});

   }
   catch(e){
    if (e instanceof z.ZodError) {
      res.status(400).json({ message: INVALID_INPUT, errors: e.errors });
    } else {
      res.status(500).json({ message: SERVER_ERROR });
    }  
    
   }
}
export { getAllDishes, getAllCanteen, calculateAmountForOrder };

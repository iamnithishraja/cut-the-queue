import { Request, Response } from "express";
import prisma from "@repo/db/client";
async function getAllDishes(req: Request, res: Response): Promise<any> {
   const canteenId = req.params.canteenId;
   try {
      const items = await prisma.menuItem.findMany({
         where: {
            canteenId: canteenId
         }
      })
      if (items) {
         res.json(items);
      }
      else {
         res.sendStatus(404);
      }
   }
   catch (e) {
      res.sendStatus(500);
      console.log(e);
   }
}

async function getAllCanteen(req:Request,res:Response){
   try{
      const canteens=await prisma.canteen.findMany();
      if(canteens){
         res.json(canteens);
      }
      else{
         res.sendStatus(404);
      }
   }
   catch(e){
      res.sendStatus(500);
   }
}
export { getAllDishes,getAllCanteen };
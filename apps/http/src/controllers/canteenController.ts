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
         res.json({ "sucess": false });
      }
   }
   catch (e) {
      console.log(e);
   }
}
export { getAllDishes };
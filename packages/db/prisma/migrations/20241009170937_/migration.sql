/*
  Warnings:

  - Added the required column `canteenId` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'PARTNER');

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "itemImage" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "canteenId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "userProfile" TEXT;

-- CreateIndex
CREATE INDEX "canteens_id_idx" ON "canteens"("id");

-- CreateIndex
CREATE INDEX "menu_items_id_idx" ON "menu_items"("id");

-- CreateIndex
CREATE INDEX "menu_items_canteenId_idx" ON "menu_items"("canteenId");

-- CreateIndex
CREATE INDEX "orders_id_idx" ON "orders"("id");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_menuItemId_idx" ON "orders"("menuItemId");

-- CreateIndex
CREATE INDEX "orders_canteenId_idx" ON "orders"("canteenId");

-- CreateIndex
CREATE INDEX "users_id_idx" ON "users"("id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "canteens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

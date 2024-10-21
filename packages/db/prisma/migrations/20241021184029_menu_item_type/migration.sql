-- CreateEnum
CREATE TYPE "MenuItemType" AS ENUM ('Instant', 'TimeConsuming');

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "type" "MenuItemType" NOT NULL DEFAULT 'TimeConsuming';

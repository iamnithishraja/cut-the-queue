/*
  Warnings:

  - Added the required column `password` to the `canteens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "canteens" ADD COLUMN     "password" TEXT NOT NULL;

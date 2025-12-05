/*
  Warnings:

  - You are about to drop the column `categoryTitle` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedPriceRange` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `serviceCategory` on the `appointments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `stylists` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'STYLIST';

-- DropIndex
DROP INDEX "public"."stylists_email_key";

-- AlterTable
ALTER TABLE "public"."appointments" DROP COLUMN "categoryTitle",
DROP COLUMN "estimatedPriceRange",
DROP COLUMN "serviceCategory";

-- AlterTable
ALTER TABLE "public"."stylists" ADD COLUMN     "userId" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "stylists_userId_key" ON "public"."stylists"("userId");

-- AddForeignKey
ALTER TABLE "public"."stylists" ADD CONSTRAINT "stylists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

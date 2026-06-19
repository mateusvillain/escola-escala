-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "allowOneTimePurchase" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceOneTime" DECIMAL(65,30),
ADD COLUMN     "stripePriceIdOneTime" TEXT;

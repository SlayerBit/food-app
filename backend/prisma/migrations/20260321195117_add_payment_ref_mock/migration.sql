-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'MOCK';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentRef" TEXT;

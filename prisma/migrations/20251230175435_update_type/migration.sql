/*
  Warnings:

  - You are about to alter the column `action` on the `AuditLog` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `targetType` on the `AuditLog` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `targetId` on the `AuditLog` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `model` on the `ChatMessage` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `title` on the `ChatSession` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `code` on the `Discount` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `name` on the `Discount` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `title` on the `Document` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `filename` on the `Document` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `mimeType` on the `Document` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `storageKey` on the `Document` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `sourceType` on the `Document` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `vectorId` on the `DocumentChunk` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `orderNumber` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `currency` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `currency` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `providerRef` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `currency` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `sku` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `name` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `brand` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `imageUrl` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - You are about to alter the column `currency` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `status` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `name` on the `ProductDiscount` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `password` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `name` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `provider` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `providerId` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "action" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "targetType" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "targetId" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "ChatMessage" ALTER COLUMN "model" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "ChatSession" ALTER COLUMN "title" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "Discount" ALTER COLUMN "code" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "title" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "filename" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "mimeType" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "storageKey" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "sourceType" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "DocumentChunk" ALTER COLUMN "vectorId" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "providerRef" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3);

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "sku" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "brand" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "imageUrl" SET DATA TYPE VARCHAR(2048),
ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3),
ALTER COLUMN "status" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "ProductDiscount" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "provider" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "providerId" SET DATA TYPE VARCHAR(255);

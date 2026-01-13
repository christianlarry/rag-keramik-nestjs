/*
  Warnings:

  - Changed the type of `label` on the `Address` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AddressLabel" AS ENUM ('HOME', 'OFFICE', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('PAYMENT_WEBHOOK', 'LOGIN', 'DOC_UPLOAD');

-- AlterTable
ALTER TABLE "Address" DROP COLUMN "label",
ADD COLUMN     "label" "AddressLabel" NOT NULL;

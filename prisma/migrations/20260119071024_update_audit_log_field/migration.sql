/*
  Warnings:

  - The values [DOC_UPLOAD] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.
  - Changed the type of `action` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `targetType` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AuditTargetType" AS ENUM ('USER', 'PRODUCT', 'ORDER', 'DOCUMENT');

-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('REGISTER', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'EMAIL_VERIFICATION', 'PROFILE_UPDATE', 'ADDRESS_ADD', 'ADDRESS_UPDATE', 'ADDRESS_DELETE', 'ORDER_CREATE', 'ORDER_UPDATE', 'ORDER_CANCEL', 'PAYMENT_WEBHOOK', 'DOCUMENT_UPLOAD', 'DOCUMENT_DELETE', 'CHAT_SESSION_START', 'CHAT_SESSION_END');
ALTER TABLE "AuditLog" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "action",
ADD COLUMN     "action" "AuditAction" NOT NULL,
DROP COLUMN "targetType",
ADD COLUMN     "targetType" "AuditTargetType" NOT NULL;

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

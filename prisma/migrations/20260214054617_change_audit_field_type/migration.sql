/*
  Warnings:

  - Changed the type of `action` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `targetType` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "action",
ADD COLUMN     "action" TEXT NOT NULL,
DROP COLUMN "targetType",
ADD COLUMN     "targetType" TEXT NOT NULL;

-- DropEnum
DROP TYPE "AuditAction";

-- DropEnum
DROP TYPE "AuditTargetType";

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

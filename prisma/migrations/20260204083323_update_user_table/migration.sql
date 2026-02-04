/*
  Warnings:

  - Made the column `provider` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" VARCHAR(2048),
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "loginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phoneNumber" VARCHAR(50),
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3),
ALTER COLUMN "gender" DROP NOT NULL,
ALTER COLUMN "provider" SET NOT NULL;

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

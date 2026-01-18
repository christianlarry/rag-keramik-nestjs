/*
  Warnings:

  - Made the column `gender` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refreshTokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "provider" DROP DEFAULT;

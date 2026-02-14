/*
  Warnings:

  - You are about to drop the column `provider` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AuthProviderName" AS ENUM ('GOOGLE', 'FACEBOOK');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "provider",
DROP COLUMN "providerId";

-- DropEnum
DROP TYPE "AuthProvider";

-- CreateTable
CREATE TABLE "AuthProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProviderName" NOT NULL,
    "providerId" VARCHAR(255) NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthProvider_userId_idx" ON "AuthProvider"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthProvider_provider_providerId_key" ON "AuthProvider"("provider", "providerId");

-- AddForeignKey
ALTER TABLE "AuthProvider" ADD CONSTRAINT "AuthProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

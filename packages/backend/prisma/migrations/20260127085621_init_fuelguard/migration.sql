/*
  Warnings:

  - A unique constraint covering the columns `[vehicleType,wilaya]` on the table `FuelRule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "QREntityType" AS ENUM ('VEHICLE', 'HOUSEHOLD');

-- DropIndex
DROP INDEX "FuelRule_vehicleType_key";

-- AlterTable
ALTER TABLE "FuelRule" ADD COLUMN     "wilaya" TEXT;

-- AlterTable
ALTER TABLE "GasBottleTransaction" ADD COLUMN     "exchangeType" TEXT NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "Household" ADD COLUMN     "residenceProofUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "flagReason" TEXT,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wilaya" TEXT;

-- CreateTable
CREATE TABLE "QRCode" (
    "id" TEXT NOT NULL,
    "entityType" "QREntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "codeData" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blacklist" (
    "id" TEXT NOT NULL,
    "nationalId" TEXT,
    "plateNumber" TEXT,
    "reason" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "addedById" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_codeHash_key" ON "QRCode"("codeHash");

-- CreateIndex
CREATE INDEX "QRCode_entityType_entityId_idx" ON "QRCode"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "QRCode_codeHash_idx" ON "QRCode"("codeHash");

-- CreateIndex
CREATE INDEX "QRCode_expiresAt_idx" ON "QRCode"("expiresAt");

-- CreateIndex
CREATE INDEX "Blacklist_nationalId_idx" ON "Blacklist"("nationalId");

-- CreateIndex
CREATE INDEX "Blacklist_plateNumber_idx" ON "Blacklist"("plateNumber");

-- CreateIndex
CREATE INDEX "Blacklist_isActive_idx" ON "Blacklist"("isActive");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "FuelRule_wilaya_idx" ON "FuelRule"("wilaya");

-- CreateIndex
CREATE UNIQUE INDEX "FuelRule_vehicleType_wilaya_key" ON "FuelRule"("vehicleType", "wilaya");

-- CreateIndex
CREATE INDEX "Household_wilaya_idx" ON "Household"("wilaya");

-- CreateIndex
CREATE INDEX "User_wilaya_idx" ON "User"("wilaya");

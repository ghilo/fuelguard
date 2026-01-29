-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'STATION_MANAGER', 'CITIZEN');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('PRIVATE_CAR', 'TAXI', 'TRUCK', 'MOTORCYCLE', 'BUS', 'GOVERNMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('ESSENCE', 'GASOIL', 'GPL');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('APPROVED', 'DENIED', 'PENDING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nationalId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CITIZEN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "wilaya" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationManager" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StationManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "carteGrisePhoto" TEXT,
    "qrCodeData" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelRule" (
    "id" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "fuelType" "FuelType",
    "maxFillsPerPeriod" INTEGER NOT NULL,
    "periodHours" INTEGER NOT NULL,
    "maxLitersPerFill" DOUBLE PRECISION NOT NULL,
    "exceptions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelTransaction" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "processedById" TEXT NOT NULL,
    "liters" DOUBLE PRECISION,
    "status" "TransactionStatus" NOT NULL,
    "denialReason" TEXT,
    "qrScannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuelTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "wilaya" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "memberCount" INTEGER NOT NULL DEFAULT 1,
    "qrCodeData" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GasBottleRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxBottlesPerPeriod" INTEGER NOT NULL,
    "periodDays" INTEGER NOT NULL,
    "minMemberCount" INTEGER NOT NULL DEFAULT 1,
    "maxMemberCount" INTEGER,
    "bottleSize" DOUBLE PRECISION NOT NULL DEFAULT 13,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GasBottleRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GasBottleTransaction" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "processedById" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "bottleSize" DOUBLE PRECISION NOT NULL DEFAULT 13,
    "status" "TransactionStatus" NOT NULL,
    "denialReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GasBottleTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nationalId_key" ON "User"("nationalId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_nationalId_idx" ON "User"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Station_code_key" ON "Station"("code");

-- CreateIndex
CREATE INDEX "Station_code_idx" ON "Station"("code");

-- CreateIndex
CREATE INDEX "Station_wilaya_idx" ON "Station"("wilaya");

-- CreateIndex
CREATE INDEX "StationManager_userId_idx" ON "StationManager"("userId");

-- CreateIndex
CREATE INDEX "StationManager_stationId_idx" ON "StationManager"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "StationManager_userId_stationId_key" ON "StationManager"("userId", "stationId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE INDEX "Vehicle_plateNumber_idx" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE INDEX "Vehicle_ownerId_idx" ON "Vehicle"("ownerId");

-- CreateIndex
CREATE INDEX "Vehicle_vehicleType_idx" ON "Vehicle"("vehicleType");

-- CreateIndex
CREATE UNIQUE INDEX "FuelRule_vehicleType_key" ON "FuelRule"("vehicleType");

-- CreateIndex
CREATE INDEX "FuelRule_vehicleType_idx" ON "FuelRule"("vehicleType");

-- CreateIndex
CREATE INDEX "FuelTransaction_vehicleId_idx" ON "FuelTransaction"("vehicleId");

-- CreateIndex
CREATE INDEX "FuelTransaction_stationId_idx" ON "FuelTransaction"("stationId");

-- CreateIndex
CREATE INDEX "FuelTransaction_processedById_idx" ON "FuelTransaction"("processedById");

-- CreateIndex
CREATE INDEX "FuelTransaction_createdAt_idx" ON "FuelTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "FuelTransaction_status_idx" ON "FuelTransaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Household_nationalId_key" ON "Household"("nationalId");

-- CreateIndex
CREATE INDEX "Household_nationalId_idx" ON "Household"("nationalId");

-- CreateIndex
CREATE INDEX "Household_ownerId_idx" ON "Household"("ownerId");

-- CreateIndex
CREATE INDEX "GasBottleTransaction_householdId_idx" ON "GasBottleTransaction"("householdId");

-- CreateIndex
CREATE INDEX "GasBottleTransaction_stationId_idx" ON "GasBottleTransaction"("stationId");

-- CreateIndex
CREATE INDEX "GasBottleTransaction_createdAt_idx" ON "GasBottleTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationManager" ADD CONSTRAINT "StationManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationManager" ADD CONSTRAINT "StationManager_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelTransaction" ADD CONSTRAINT "FuelTransaction_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelTransaction" ADD CONSTRAINT "FuelTransaction_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelTransaction" ADD CONSTRAINT "FuelTransaction_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GasBottleTransaction" ADD CONSTRAINT "GasBottleTransaction_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GasBottleTransaction" ADD CONSTRAINT "GasBottleTransaction_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GasBottleTransaction" ADD CONSTRAINT "GasBottleTransaction_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

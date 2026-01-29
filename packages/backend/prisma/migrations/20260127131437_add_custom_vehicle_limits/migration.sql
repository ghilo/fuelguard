-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "customLimitReason" TEXT,
ADD COLUMN     "customMaxFillsPerPeriod" INTEGER,
ADD COLUMN     "customMaxLitersPerFill" DOUBLE PRECISION,
ADD COLUMN     "customPeriodHours" INTEGER;

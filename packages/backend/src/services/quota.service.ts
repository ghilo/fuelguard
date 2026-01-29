import prisma from '../config/database.js';
import { addHours, addDays } from '../utils/helpers.js';
import { checkBlacklist, type BlacklistCheckResult } from './blacklist.service.js';
import type { Vehicle, Household, FuelRule, GasBottleRule } from '@prisma/client';

export type EligibilityStatus = 'APPROVED' | 'DENIED' | 'WARNING';

export interface FuelEligibilityResult {
  status: EligibilityStatus;
  eligible: boolean;
  vehicle: Vehicle & { owner?: { fullName: string; nationalId: string | null; isFlagged: boolean; flagReason: string | null } };
  rule: FuelRule | null;
  reason?: string;
  nextEligibleAt?: Date;
  lastFillDate?: Date;
  lastFillLiters?: number;
  fillsInPeriod: number;
  maxFillsAllowed: number;
  maxLitersAllowed: number;
  blacklistInfo?: BlacklistCheckResult;
  hoursUntilNextFill?: number;
}

export interface GasEligibilityResult {
  status: EligibilityStatus;
  eligible: boolean;
  household: Household & { owner?: { fullName: string; nationalId: string | null; isFlagged: boolean; flagReason: string | null } };
  rule: GasBottleRule | null;
  reason?: string;
  nextEligibleAt?: Date;
  lastPurchaseDate?: Date;
  bottlesInPeriod: number;
  maxBottlesAllowed: number;
  blacklistInfo?: BlacklistCheckResult;
  daysUntilNextPurchase?: number;
}

export async function checkFuelEligibility(vehicleId: string, stationWilaya?: string): Promise<FuelEligibilityResult> {
  // Get vehicle with owner info
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      owner: {
        select: {
          fullName: true,
          nationalId: true,
          isFlagged: true,
          flagReason: true,
        },
      },
    },
  });

  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  // Check blacklist
  const blacklistCheck = await checkBlacklist(
    vehicle.owner?.nationalId || undefined,
    vehicle.plateNumber
  );

  if (blacklistCheck.isBlacklisted && blacklistCheck.severity === 'BLOCKED') {
    return {
      status: 'DENIED',
      eligible: false,
      vehicle: vehicle as FuelEligibilityResult['vehicle'],
      rule: null,
      reason: `BLOCKED: ${blacklistCheck.reason}`,
      fillsInPeriod: 0,
      maxFillsAllowed: 0,
      maxLitersAllowed: 0,
      blacklistInfo: blacklistCheck,
    };
  }

  if (!vehicle.isActive) {
    return {
      status: 'DENIED',
      eligible: false,
      vehicle: vehicle as FuelEligibilityResult['vehicle'],
      rule: null,
      reason: 'Vehicle is deactivated',
      fillsInPeriod: 0,
      maxFillsAllowed: 0,
      maxLitersAllowed: 0,
    };
  }

  if (!vehicle.isVerified) {
    return {
      status: 'DENIED',
      eligible: false,
      vehicle: vehicle as FuelEligibilityResult['vehicle'],
      rule: null,
      reason: 'Vehicle is not verified - pending admin approval',
      fillsInPeriod: 0,
      maxFillsAllowed: 0,
      maxLitersAllowed: 0,
    };
  }

  // Get applicable rule for vehicle type (check wilaya-specific first)
  let rule = await prisma.fuelRule.findFirst({
    where: {
      vehicleType: vehicle.vehicleType,
      wilaya: stationWilaya,
      isActive: true,
    },
  });

  // Fall back to general rule if no wilaya-specific rule
  if (!rule) {
    rule = await prisma.fuelRule.findFirst({
      where: {
        vehicleType: vehicle.vehicleType,
        OR: [
          { wilaya: null },
          { wilaya: 'ALL' },
        ],
        isActive: true,
      },
    });
  }

  if (!rule) {
    return {
      status: 'DENIED',
      eligible: false,
      vehicle: vehicle as FuelEligibilityResult['vehicle'],
      rule: null,
      reason: 'No active fuel rule found for this vehicle type',
      fillsInPeriod: 0,
      maxFillsAllowed: 0,
      maxLitersAllowed: 0,
    };
  }

  // Calculate period window
  const periodStart = addHours(new Date(), -rule.periodHours);

  // Count approved transactions in the period window
  const transactionsInPeriod = await prisma.fuelTransaction.findMany({
    where: {
      vehicleId: vehicle.id,
      status: 'APPROVED',
      createdAt: {
        gte: periodStart,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const fillsInPeriod = transactionsInPeriod.length;
  const lastFill = transactionsInPeriod[0];

  // Check if quota exceeded
  if (fillsInPeriod >= rule.maxFillsPerPeriod) {
    const oldestTransaction = transactionsInPeriod[transactionsInPeriod.length - 1];
    const nextEligibleAt = oldestTransaction
      ? addHours(oldestTransaction.createdAt, rule.periodHours)
      : new Date();

    const hoursUntilNextFill = Math.ceil(
      (nextEligibleAt.getTime() - Date.now()) / (1000 * 60 * 60)
    );

    return {
      status: 'DENIED',
      eligible: false,
      vehicle: vehicle as FuelEligibilityResult['vehicle'],
      rule,
      reason: `Quota exceeded: ${fillsInPeriod}/${rule.maxFillsPerPeriod} fills used. Next fill allowed in ${hoursUntilNextFill} hours`,
      nextEligibleAt,
      lastFillDate: lastFill?.createdAt,
      lastFillLiters: lastFill?.liters || undefined,
      fillsInPeriod,
      maxFillsAllowed: rule.maxFillsPerPeriod,
      maxLitersAllowed: rule.maxLitersPerFill,
      hoursUntilNextFill,
    };
  }

  // Check for warning status (blacklisted with WARNING or user is flagged)
  const isWarning =
    (blacklistCheck.isBlacklisted && blacklistCheck.severity === 'WARNING') ||
    vehicle.owner?.isFlagged;

  return {
    status: isWarning ? 'WARNING' : 'APPROVED',
    eligible: true,
    vehicle: vehicle as FuelEligibilityResult['vehicle'],
    rule,
    reason: isWarning
      ? `WARNING: ${blacklistCheck.reason || vehicle.owner?.flagReason || 'Account flagged for review'}`
      : undefined,
    lastFillDate: lastFill?.createdAt,
    lastFillLiters: lastFill?.liters || undefined,
    fillsInPeriod,
    maxFillsAllowed: rule.maxFillsPerPeriod,
    maxLitersAllowed: rule.maxLitersPerFill,
    blacklistInfo: isWarning ? blacklistCheck : undefined,
  };
}

export async function checkGasBottleEligibility(householdId: string, stationWilaya?: string): Promise<GasEligibilityResult> {
  // Get household with owner info
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: {
      owner: {
        select: {
          fullName: true,
          nationalId: true,
          isFlagged: true,
          flagReason: true,
        },
      },
    },
  });

  if (!household) {
    throw new Error('Household not found');
  }

  // Check blacklist
  const blacklistCheck = await checkBlacklist(household.nationalId);

  if (blacklistCheck.isBlacklisted && blacklistCheck.severity === 'BLOCKED') {
    return {
      status: 'DENIED',
      eligible: false,
      household: household as GasEligibilityResult['household'],
      rule: null,
      reason: `BLOCKED: ${blacklistCheck.reason}`,
      bottlesInPeriod: 0,
      maxBottlesAllowed: 0,
      blacklistInfo: blacklistCheck,
    };
  }

  // Check wilaya match for gas bottles
  if (stationWilaya && household.wilaya !== stationWilaya) {
    return {
      status: 'DENIED',
      eligible: false,
      household: household as GasEligibilityResult['household'],
      rule: null,
      reason: `Household is registered in ${household.wilaya}, not ${stationWilaya}. Gas bottles must be purchased in your registered wilaya.`,
      bottlesInPeriod: 0,
      maxBottlesAllowed: 0,
    };
  }

  if (!household.isActive) {
    return {
      status: 'DENIED',
      eligible: false,
      household: household as GasEligibilityResult['household'],
      rule: null,
      reason: 'Household registration is deactivated',
      bottlesInPeriod: 0,
      maxBottlesAllowed: 0,
    };
  }

  if (!household.isVerified) {
    return {
      status: 'DENIED',
      eligible: false,
      household: household as GasEligibilityResult['household'],
      rule: null,
      reason: 'Household is not verified - pending admin approval',
      bottlesInPeriod: 0,
      maxBottlesAllowed: 0,
    };
  }

  // Find applicable rule based on member count
  const rule = await prisma.gasBottleRule.findFirst({
    where: {
      isActive: true,
      minMemberCount: { lte: household.memberCount },
      OR: [
        { maxMemberCount: null },
        { maxMemberCount: { gte: household.memberCount } },
      ],
    },
    orderBy: { minMemberCount: 'desc' },
  });

  if (!rule) {
    return {
      status: 'DENIED',
      eligible: false,
      household: household as GasEligibilityResult['household'],
      rule: null,
      reason: 'No active gas bottle rule found for this household size',
      bottlesInPeriod: 0,
      maxBottlesAllowed: 0,
    };
  }

  // Calculate period window (in days)
  const periodStart = addDays(new Date(), -rule.periodDays);

  // Count approved transactions in the period window
  const transactionsInPeriod = await prisma.gasBottleTransaction.findMany({
    where: {
      householdId: household.id,
      status: 'APPROVED',
      createdAt: {
        gte: periodStart,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const bottlesInPeriod = transactionsInPeriod.reduce((sum, t) => sum + t.quantity, 0);
  const lastPurchase = transactionsInPeriod[0];

  // Check if quota exceeded
  if (bottlesInPeriod >= rule.maxBottlesPerPeriod) {
    const oldestTransaction = transactionsInPeriod[transactionsInPeriod.length - 1];
    const nextEligibleAt = oldestTransaction
      ? addDays(oldestTransaction.createdAt, rule.periodDays)
      : new Date();

    const daysUntilNextPurchase = Math.ceil(
      (nextEligibleAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      status: 'DENIED',
      eligible: false,
      household: household as GasEligibilityResult['household'],
      rule,
      reason: `Quota exceeded: ${bottlesInPeriod}/${rule.maxBottlesPerPeriod} bottles used. Next purchase allowed in ${daysUntilNextPurchase} days`,
      nextEligibleAt,
      lastPurchaseDate: lastPurchase?.createdAt,
      bottlesInPeriod,
      maxBottlesAllowed: rule.maxBottlesPerPeriod,
      daysUntilNextPurchase,
    };
  }

  // Check for warning status
  const isWarning =
    (blacklistCheck.isBlacklisted && blacklistCheck.severity === 'WARNING') ||
    household.owner?.isFlagged;

  return {
    status: isWarning ? 'WARNING' : 'APPROVED',
    eligible: true,
    household: household as GasEligibilityResult['household'],
    rule,
    reason: isWarning
      ? `WARNING: ${blacklistCheck.reason || household.owner?.flagReason || 'Account flagged for review'}`
      : undefined,
    lastPurchaseDate: lastPurchase?.createdAt,
    bottlesInPeriod,
    maxBottlesAllowed: rule.maxBottlesPerPeriod,
    blacklistInfo: isWarning ? blacklistCheck : undefined,
  };
}

export async function recordFuelTransaction(
  vehicleId: string,
  stationId: string,
  processedById: string,
  status: 'APPROVED' | 'DENIED',
  liters?: number,
  denialReason?: string
) {
  return prisma.fuelTransaction.create({
    data: {
      vehicleId,
      stationId,
      processedById,
      status,
      liters,
      denialReason,
      completedAt: status === 'APPROVED' ? new Date() : undefined,
    },
    include: {
      vehicle: true,
      station: true,
    },
  });
}

export async function recordGasBottleTransaction(
  householdId: string,
  stationId: string,
  processedById: string,
  status: 'APPROVED' | 'DENIED',
  quantity: number,
  exchangeType: 'NEW' | 'EXCHANGE' = 'NEW',
  denialReason?: string
) {
  return prisma.gasBottleTransaction.create({
    data: {
      householdId,
      stationId,
      processedById,
      status,
      quantity,
      exchangeType,
      denialReason,
    },
    include: {
      household: true,
      station: true,
    },
  });
}

export async function getLastFillInfo(vehicleId: string) {
  const lastFill = await prisma.fuelTransaction.findFirst({
    where: {
      vehicleId,
      status: 'APPROVED',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      liters: true,
      station: {
        select: { name: true, code: true },
      },
    },
  });

  return lastFill;
}

export async function getLastGasBottlePurchase(householdId: string) {
  const lastPurchase = await prisma.gasBottleTransaction.findFirst({
    where: {
      householdId,
      status: 'APPROVED',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      quantity: true,
      exchangeType: true,
      station: {
        select: { name: true, code: true },
      },
    },
  });

  return lastPurchase;
}

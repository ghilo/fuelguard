import type { Response } from 'express';
import { body } from 'express-validator';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import prisma from '../config/database.js';
import * as qrcodeService from '../services/qrcode.service.js';
import * as quotaService from '../services/quota.service.js';

export const scanValidation = [
  body('qrContent').notEmpty().withMessage('QR content is required'),
];

export const approveValidation = [
  body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
  body('liters').isFloat({ min: 0.1 }).withMessage('Liters must be a positive number'),
];

export const denyValidation = [
  body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
  body('reason').notEmpty().withMessage('Denial reason is required'),
];

export const manualLookupValidation = [
  body('plateNumber').notEmpty().withMessage('Plate number is required'),
];

async function getManagerStation(userId: string) {
  const stationManager = await prisma.stationManager.findFirst({
    where: { userId, isActive: true },
    include: { station: true },
  });
  return stationManager?.station || null;
}

export async function scanQR(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const station = await getManagerStation(req.user.userId);
    if (!station && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'You are not assigned to any station' });
      return;
    }

    const { qrContent } = req.body;

    // Validate QR code (checks format, signature, expiration, and database record)
    const validation = await qrcodeService.validateQRCode(qrContent);

    if (!validation.valid) {
      res.status(400).json({
        error: validation.error,
        expired: validation.expired,
      });
      return;
    }

    const qrData = validation.data!;

    if (qrData.type === 'vehicle') {
      // Check fuel eligibility with station wilaya for location-based rules
      try {
        const eligibility = await quotaService.checkFuelEligibility(qrData.id, station?.wilaya);

        res.json({
          type: 'vehicle',
          status: eligibility.status,
          eligible: eligibility.eligible,
          reason: eligibility.reason,
          nextEligibleAt: eligibility.nextEligibleAt,
          hoursUntilNextFill: eligibility.hoursUntilNextFill,
          lastFillDate: eligibility.lastFillDate,
          lastFillLiters: eligibility.lastFillLiters,
          vehicle: {
            id: eligibility.vehicle.id,
            plateNumber: eligibility.vehicle.plateNumber,
            vehicleType: eligibility.vehicle.vehicleType,
            fuelType: eligibility.vehicle.fuelType,
            brand: eligibility.vehicle.brand,
            model: eligibility.vehicle.model,
            owner: eligibility.vehicle.owner ? {
              fullName: eligibility.vehicle.owner.fullName,
              isFlagged: eligibility.vehicle.owner.isFlagged,
              flagReason: eligibility.vehicle.owner.flagReason,
            } : undefined,
          },
          quota: {
            fillsInPeriod: eligibility.fillsInPeriod,
            maxFillsAllowed: eligibility.maxFillsAllowed,
            maxLitersAllowed: eligibility.maxLitersAllowed,
            periodHours: eligibility.rule?.periodHours,
          },
          blacklistInfo: eligibility.blacklistInfo,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Vehicle lookup failed';
        res.status(404).json({ error: message });
      }
    } else if (qrData.type === 'household') {
      // Check gas bottle eligibility with station wilaya for location restriction
      try {
        const eligibility = await quotaService.checkGasBottleEligibility(qrData.id, station?.wilaya);

        res.json({
          type: 'household',
          status: eligibility.status,
          eligible: eligibility.eligible,
          reason: eligibility.reason,
          nextEligibleAt: eligibility.nextEligibleAt,
          daysUntilNextPurchase: eligibility.daysUntilNextPurchase,
          lastPurchaseDate: eligibility.lastPurchaseDate,
          household: {
            id: eligibility.household.id,
            fullName: eligibility.household.fullName,
            address: eligibility.household.address,
            wilaya: eligibility.household.wilaya,
            commune: eligibility.household.commune,
            memberCount: eligibility.household.memberCount,
            owner: eligibility.household.owner ? {
              fullName: eligibility.household.owner.fullName,
              isFlagged: eligibility.household.owner.isFlagged,
              flagReason: eligibility.household.owner.flagReason,
            } : undefined,
          },
          quota: {
            bottlesInPeriod: eligibility.bottlesInPeriod,
            maxBottlesAllowed: eligibility.maxBottlesAllowed,
            periodDays: eligibility.rule?.periodDays,
          },
          blacklistInfo: eligibility.blacklistInfo,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Household lookup failed';
        res.status(404).json({ error: message });
      }
    }
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to process QR code' });
  }
}

export async function approveTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const station = await getManagerStation(req.user.userId);
    if (!station && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'You are not assigned to any station' });
      return;
    }

    const { vehicleId, liters } = req.body;

    // Double-check eligibility before approving
    const eligibility = await quotaService.checkFuelEligibility(vehicleId);
    if (!eligibility.eligible) {
      res.status(400).json({
        error: 'Cannot approve - vehicle is not eligible',
        reason: eligibility.reason,
      });
      return;
    }

    // Check liters against max allowed
    if (liters > eligibility.maxLitersAllowed) {
      res.status(400).json({
        error: `Cannot exceed ${eligibility.maxLitersAllowed}L for this vehicle type`,
      });
      return;
    }

    const stationId = station?.id || req.body.stationId;
    if (!stationId) {
      res.status(400).json({ error: 'Station ID required' });
      return;
    }

    const transaction = await quotaService.recordFuelTransaction(
      vehicleId,
      stationId,
      req.user.userId,
      'APPROVED',
      liters
    );

    res.json({
      message: 'Transaction approved',
      transaction: {
        id: transaction.id,
        vehicleId: transaction.vehicleId,
        plateNumber: transaction.vehicle.plateNumber,
        liters: transaction.liters,
        status: transaction.status,
        stationName: transaction.station.name,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve transaction' });
  }
}

export async function denyTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const station = await getManagerStation(req.user.userId);
    if (!station && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'You are not assigned to any station' });
      return;
    }

    const { vehicleId, reason } = req.body;

    const stationId = station?.id || req.body.stationId;
    if (!stationId) {
      res.status(400).json({ error: 'Station ID required' });
      return;
    }

    const transaction = await quotaService.recordFuelTransaction(
      vehicleId,
      stationId,
      req.user.userId,
      'DENIED',
      undefined,
      reason
    );

    res.json({
      message: 'Transaction denied',
      transaction: {
        id: transaction.id,
        vehicleId: transaction.vehicleId,
        plateNumber: transaction.vehicle.plateNumber,
        status: transaction.status,
        denialReason: transaction.denialReason,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Deny error:', error);
    res.status(500).json({ error: 'Failed to deny transaction' });
  }
}

export async function manualLookup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const station = await getManagerStation(req.user.userId);
    if (!station && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'You are not assigned to any station' });
      return;
    }

    const { plateNumber } = req.body;

    const vehicle = await prisma.vehicle.findUnique({
      where: { plateNumber },
      include: {
        owner: {
          select: { fullName: true, phone: true, isFlagged: true, flagReason: true },
        },
      },
    });

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found with this plate number' });
      return;
    }

    if (!vehicle.isActive) {
      res.status(400).json({ error: 'Vehicle is deactivated' });
      return;
    }

    // Check eligibility with station wilaya
    const eligibility = await quotaService.checkFuelEligibility(vehicle.id, station?.wilaya);

    res.json({
      type: 'vehicle',
      status: eligibility.status,
      eligible: eligibility.eligible,
      reason: eligibility.reason,
      nextEligibleAt: eligibility.nextEligibleAt,
      hoursUntilNextFill: eligibility.hoursUntilNextFill,
      lastFillDate: eligibility.lastFillDate,
      lastFillLiters: eligibility.lastFillLiters,
      vehicle: {
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        vehicleType: vehicle.vehicleType,
        fuelType: vehicle.fuelType,
        brand: vehicle.brand,
        model: vehicle.model,
        isVerified: vehicle.isVerified,
        owner: vehicle.owner ? {
          fullName: vehicle.owner.fullName,
          phone: vehicle.owner.phone,
          isFlagged: vehicle.owner.isFlagged,
          flagReason: vehicle.owner.flagReason,
        } : undefined,
      },
      quota: {
        fillsInPeriod: eligibility.fillsInPeriod,
        maxFillsAllowed: eligibility.maxFillsAllowed,
        maxLitersAllowed: eligibility.maxLitersAllowed,
        periodHours: eligibility.rule?.periodHours,
      },
      blacklistInfo: eligibility.blacklistInfo,
    });
  } catch (error) {
    console.error('Manual lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup vehicle' });
  }
}

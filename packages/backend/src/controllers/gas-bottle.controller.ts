import type { Response } from 'express';
import { body } from 'express-validator';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import prisma from '../config/database.js';
import * as qrcodeService from '../services/qrcode.service.js';
import * as quotaService from '../services/quota.service.js';

export const createHouseholdValidation = [
  body('nationalId').notEmpty().withMessage('National ID is required'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('wilaya').trim().notEmpty().withMessage('Wilaya is required'),
  body('commune').trim().notEmpty().withMessage('Commune is required'),
  body('memberCount').isInt({ min: 1, max: 20 }).withMessage('Member count must be between 1 and 20'),
];

export const verifyHouseholdValidation = [
  body('qrContent').notEmpty().withMessage('QR content is required'),
];

export const transactionValidation = [
  body('householdId').notEmpty().withMessage('Household ID is required'),
  body('quantity').isInt({ min: 1, max: 5 }).withMessage('Quantity must be between 1 and 5'),
  body('status').isIn(['APPROVED', 'DENIED']).withMessage('Invalid status'),
];

export async function createHousehold(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { nationalId, fullName, address, wilaya, commune, memberCount } = req.body;

    // Check if national ID already registered
    const existing = await prisma.household.findUnique({ where: { nationalId } });
    if (existing) {
      res.status(400).json({ error: 'This national ID is already registered for gas bottle quota' });
      return;
    }

    const household = await prisma.household.create({
      data: {
        ownerId: req.user.userId,
        nationalId,
        fullName,
        address,
        wilaya,
        commune,
        memberCount,
        isVerified: false,
      },
    });

    // Generate QR code data (stored in QRCode table with expiration)
    const qrContent = await qrcodeService.getOrGenerateHouseholdQR(household.id, nationalId);
    await prisma.household.update({
      where: { id: household.id },
      data: { qrCodeData: qrContent },
    });

    res.status(201).json({
      message: 'Household registered successfully. Pending verification.',
      household: {
        id: household.id,
        fullName: household.fullName,
        address: household.address,
        memberCount: household.memberCount,
        isVerified: household.isVerified,
      },
    });
  } catch (error) {
    console.error('Create household error:', error);
    res.status(500).json({ error: 'Failed to register household' });
  }
}

export async function getHouseholds(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const households = await prisma.household.findMany({
      where: {
        ownerId: req.user.userId,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        address: true,
        wilaya: true,
        commune: true,
        memberCount: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ households });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch households' });
  }
}

export async function getHouseholdQRCode(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const household = await prisma.household.findFirst({
      where: {
        id,
        ownerId: req.user.userId,
        isActive: true,
      },
    });

    if (!household) {
      res.status(404).json({ error: 'Household not found' });
      return;
    }

    if (!household.isVerified) {
      res.status(400).json({ error: 'Household is not yet verified. Please wait for admin approval.' });
      return;
    }

    // Get or generate QR content (regenerates daily at midnight)
    const qrContent = await qrcodeService.getOrGenerateHouseholdQR(household.id, household.nationalId);

    // Update the cached QR data in household record
    await prisma.household.update({
      where: { id: household.id },
      data: { qrCodeData: qrContent },
    });

    const qrDataUrl = await qrcodeService.generateQRCodeDataURL(qrContent);

    // Get expiration info
    const qrRecord = await prisma.qRCode.findFirst({
      where: {
        entityType: 'HOUSEHOLD',
        entityId: household.id,
        isActive: true,
      },
      select: { expiresAt: true },
    });

    res.json({
      qrCode: qrDataUrl,
      expiresAt: qrRecord?.expiresAt,
      household: {
        id: household.id,
        fullName: household.fullName,
        memberCount: household.memberCount,
      },
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}

export async function verifyHousehold(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get manager's station for wilaya check
    const stationManager = await prisma.stationManager.findFirst({
      where: { userId: req.user.userId, isActive: true },
      include: { station: true },
    });

    const station = stationManager?.station;
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
    if (qrData.type !== 'household') {
      res.status(400).json({ error: 'Invalid household QR code' });
      return;
    }

    // Check eligibility with station wilaya for location restriction
    const eligibility = await quotaService.checkGasBottleEligibility(qrData.id, station?.wilaya);

    res.json({
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
    const message = error instanceof Error ? error.message : 'Verification failed';
    res.status(400).json({ error: message });
  }
}

export async function recordTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get manager's station with wilaya info
    const stationManager = await prisma.stationManager.findFirst({
      where: { userId: req.user.userId, isActive: true },
      include: { station: true },
    });

    if (!stationManager && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'You are not assigned to any station' });
      return;
    }

    const station = stationManager?.station;
    const { householdId, quantity, status, exchangeType, denialReason } = req.body;
    const stationId = station?.id || req.body.stationId;

    if (!stationId) {
      res.status(400).json({ error: 'Station ID required' });
      return;
    }

    if (status === 'APPROVED') {
      // Verify eligibility with wilaya check before approving
      const eligibility = await quotaService.checkGasBottleEligibility(householdId, station?.wilaya);
      if (!eligibility.eligible) {
        res.status(400).json({
          error: 'Cannot approve - household not eligible',
          reason: eligibility.reason,
          status: eligibility.status,
        });
        return;
      }

      // Check quantity doesn't exceed remaining quota
      const remainingQuota = eligibility.maxBottlesAllowed - eligibility.bottlesInPeriod;
      if (quantity > remainingQuota) {
        res.status(400).json({
          error: `Cannot exceed remaining quota of ${remainingQuota} bottle(s)`,
        });
        return;
      }
    }

    const transaction = await quotaService.recordGasBottleTransaction(
      householdId,
      stationId,
      req.user.userId,
      status,
      quantity,
      exchangeType || 'NEW',
      denialReason
    );

    res.json({
      message: status === 'APPROVED' ? 'Transaction approved' : 'Transaction denied',
      transaction: {
        id: transaction.id,
        householdId: transaction.householdId,
        householdName: transaction.household.fullName,
        quantity: transaction.quantity,
        exchangeType: transaction.exchangeType,
        status: transaction.status,
        stationName: transaction.station.name,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ error: 'Failed to record transaction' });
  }
}

export async function getGasBottleRules(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const rules = await prisma.gasBottleRule.findMany({
      where: { isActive: true },
      orderBy: { minMemberCount: 'asc' },
    });

    res.json({ rules });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gas bottle rules' });
  }
}

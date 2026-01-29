import { qString } from "../utils/query";
import type { Response } from 'express';
import { body, param } from 'express-validator';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import prisma from '../config/database.js';
import * as qrcodeService from '../services/qrcode.service.js';
import type { VehicleType, FuelType } from '@prisma/client';

export const createVehicleValidation = [
  body('plateNumber')
    .trim()
    .notEmpty()
    .withMessage('Plate number is required')
    .matches(/^\d{5}-\d{3}-\d{2}$/)
    .withMessage('Plate number format should be 00000-000-00'),
  body('vehicleType')
    .isIn(['PRIVATE_CAR', 'TAXI', 'TRUCK', 'MOTORCYCLE', 'BUS', 'GOVERNMENT', 'OTHER'])
    .withMessage('Invalid vehicle type'),
  body('fuelType')
    .isIn(['ESSENCE', 'GASOIL', 'GPL'])
    .withMessage('Invalid fuel type'),
  body('brand').optional().trim(),
  body('model').optional().trim(),
];

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        nationalId: true,
        role: true,
        createdAt: true,
        vehicles: {
          where: { isActive: true },
          select: {
            id: true,
            plateNumber: true,
            vehicleType: true,
            fuelType: true,
            brand: true,
            model: true,
            isVerified: true,
            createdAt: true,
          },
        },
        households: {
          where: { isActive: true },
          select: {
            id: true,
            fullName: true,
            address: true,
            memberCount: true,
            isVerified: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function createVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { plateNumber, vehicleType, fuelType, brand, model } = req.body;

    // Check if plate already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plateNumber },
    });

    if (existingVehicle) {
      res.status(400).json({ error: 'This plate number is already registered' });
      return;
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ownerId: req.user.userId,
        plateNumber,
        vehicleType: vehicleType as VehicleType,
        fuelType: fuelType as FuelType,
        brand,
        model,
        isVerified: false, // Requires admin approval
      },
    });

    // Generate QR code data (stored in QRCode table with expiration)
    const qrContent = await qrcodeService.getOrGenerateVehicleQR(vehicle.id, plateNumber);
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { qrCodeData: qrContent },
    });

    res.status(201).json({
      message: 'Vehicle registered successfully.',
      vehicle: {
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        vehicleType: vehicle.vehicleType,
        fuelType: vehicle.fuelType,
        brand: vehicle.brand,
        model: vehicle.model,
        isVerified: vehicle.isVerified,
      },
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Failed to register vehicle' });
  }
}

export async function getVehicles(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        ownerId: req.user.userId,
        isActive: true,
      },
      select: {
        id: true,
        plateNumber: true,
        vehicleType: true,
        fuelType: true,
        brand: true,
        model: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ vehicles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
}

export async function getVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        ownerId: req.user.userId,
        isActive: true,
      },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            liters: true,
            createdAt: true,
            station: {
              select: { name: true, code: true },
            },
          },
        },
      },
    });

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    res.json({ vehicle });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
}

export async function getVehicleQRCode(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        ownerId: req.user.userId,
        isActive: true,
      },
    });

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Get or generate QR content (regenerates daily at midnight)
    const qrContent = await qrcodeService.getOrGenerateVehicleQR(vehicle.id, vehicle.plateNumber);

    // Update the cached QR data in vehicle record
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { qrCodeData: qrContent },
    });

    const qrDataUrl = await qrcodeService.generateQRCodeDataURL(qrContent);

    // Get expiration info
    const qrRecord = await prisma.qRCode.findFirst({
      where: {
        entityType: 'VEHICLE',
        entityId: vehicle.id,
        isActive: true,
      },
      select: { expiresAt: true },
    });

    res.json({
      qrCode: qrDataUrl,
      expiresAt: qrRecord?.expiresAt,
      vehicle: {
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        vehicleType: vehicle.vehicleType,
      },
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}

export async function deleteVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        ownerId: req.user.userId,
      },
    });

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Soft delete
    await prisma.vehicle.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Vehicle removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
}

export async function getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const page = parseInt(qString(req.query.page) ?? "1");
    const limit = parseInt(qString(req.query.limit) ?? "20");
    const skip = (page - 1) * limit;

    const vehicles = await prisma.vehicle.findMany({
      where: { ownerId: req.user.userId },
      select: { id: true },
    });

    const vehicleIds = vehicles.map((v) => v.id);

    const [transactions, total] = await Promise.all([
      prisma.fuelTransaction.findMany({
        where: { vehicleId: { in: vehicleIds } },
        include: {
          vehicle: {
            select: { plateNumber: true, vehicleType: true },
          },
          station: {
            select: { name: true, code: true, wilaya: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.fuelTransaction.count({
        where: { vehicleId: { in: vehicleIds } },
      }),
    ]);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}

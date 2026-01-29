import { qString } from "../utils/query";
import type { Response } from 'express';
import { body, param, query } from 'express-validator';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import prisma from '../config/database.js';

export const createStationValidation = [
  body('name').trim().notEmpty().withMessage('Station name is required'),
  body('code').trim().notEmpty().withMessage('Station code is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('wilaya').trim().notEmpty().withMessage('Wilaya is required'),
  body('commune').trim().notEmpty().withMessage('Commune is required'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
];

export const addManagerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

export async function listStations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(qString(req.query.page) ?? "1");
    const limit = parseInt(qString(req.query.limit) ?? "20");
    const skip = (page - 1) * limit;
    const search = qString(req.query.search);
    const wilaya = qString(req.query.wilaya);

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(wilaya && { wilaya }),
    };

    const [stations, total] = await Promise.all([
      prisma.station.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          wilaya: true,
          commune: true,
          latitude: true,
          longitude: true,
          isActive: true,
          _count: {
            select: {
              managers: true,
              fuelTransactions: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.station.count({ where }),
    ]);

    res.json({
      stations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
}

export async function createStation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, code, address, wilaya, commune, latitude, longitude } = req.body;

    // Check if code already exists
    const existing = await prisma.station.findUnique({ where: { code } });
    if (existing) {
      res.status(400).json({ error: 'Station code already exists' });
      return;
    }

    const station = await prisma.station.create({
      data: {
        name,
        code,
        address,
        wilaya,
        commune,
        latitude,
        longitude,
      },
    });

    res.status(201).json({ message: 'Station created successfully', station });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create station' });
  }
}

export async function getStation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const station = await prisma.station.findUnique({
      where: { id },
      include: {
        managers: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
        _count: {
          select: {
            fuelTransactions: true,
            gasTransactions: true,
          },
        },
      },
    });

    if (!station) {
      res.status(404).json({ error: 'Station not found' });
      return;
    }

    res.json({ station });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch station' });
  }
}

export async function updateStation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, address, wilaya, commune, latitude, longitude, isActive } = req.body;

    const station = await prisma.station.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(wilaya && { wilaya }),
        ...(commune && { commune }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ message: 'Station updated successfully', station });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update station' });
  }
}

export async function addManager(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id: stationId } = req.params;
    const { email } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found with this email' });
      return;
    }

    // Check if already a manager
    const existing = await prisma.stationManager.findUnique({
      where: { userId_stationId: { userId: user.id, stationId } },
    });

    if (existing) {
      if (existing.isActive) {
        res.status(400).json({ error: 'User is already a manager of this station' });
        return;
      }
      // Reactivate
      await prisma.stationManager.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    } else {
      await prisma.stationManager.create({
        data: { userId: user.id, stationId },
      });
    }

    // Update user role if needed
    if (user.role === 'CITIZEN') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'STATION_MANAGER' },
      });
    }

    res.json({ message: 'Manager added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add manager' });
  }
}

export async function removeManager(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id: stationId, managerId } = req.params;

    await prisma.stationManager.updateMany({
      where: { userId: managerId, stationId },
      data: { isActive: false },
    });

    res.json({ message: 'Manager removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove manager' });
  }
}

export async function getMyStation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const stationManager = await prisma.stationManager.findFirst({
      where: {
        userId: req.user.userId,
        isActive: true,
      },
      include: {
        station: {
          include: {
            _count: {
              select: {
                fuelTransactions: true,
                gasTransactions: true,
              },
            },
          },
        },
      },
    });

    if (!stationManager) {
      res.status(404).json({ error: 'You are not assigned to any station' });
      return;
    }

    res.json({ station: stationManager.station });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch station' });
  }
}

export async function getStationTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get user's station
    const stationManager = await prisma.stationManager.findFirst({
      where: { userId: req.user.userId, isActive: true },
    });

    if (!stationManager && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const stationId = req.params.id || stationManager?.stationId;
    if (!stationId) {
      res.status(400).json({ error: 'Station ID required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    // For today's transactions by default
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = {
      stationId,
      createdAt: { gte: today },
      ...(status && { status: status as 'APPROVED' | 'DENIED' | 'PENDING' }),
    };

    const [transactions, total] = await Promise.all([
      prisma.fuelTransaction.findMany({
        where,
        include: {
          vehicle: {
            select: {
              plateNumber: true,
              vehicleType: true,
              fuelType: true,
              owner: {
                select: { fullName: true, phone: true },
              },
            },
          },
          processedBy: {
            select: { fullName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.fuelTransaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}

import { qString } from "../utils/query";
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as analyticsService from '../services/analytics.service.js';
import prisma from '../config/database.js';

export async function getOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const stats = await analyticsService.getOverviewStats();
    res.json({ stats });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch overview stats' });
  }
}

export async function getStationStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const stats = await analyticsService.getStationStats(startDate, endDate);
    res.json({ stats });
  } catch (error) {
    console.error('Station stats error:', error);
    res.status(500).json({ error: 'Failed to fetch station stats' });
  }
}

export async function getDailyStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = await analyticsService.getDailyStats(days);
    res.json({ stats });
  } catch (error) {
    console.error('Daily stats error:', error);
    res.status(500).json({ error: 'Failed to fetch daily stats' });
  }
}

export async function getFraudAttempts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const stationId = req.query.stationId as string;

    const attempts = await analyticsService.getFraudAttempts(limit, stationId);
    res.json({ attempts });
  } catch (error) {
    console.error('Fraud attempts error:', error);
    res.status(500).json({ error: 'Failed to fetch fraud attempts' });
  }
}

export async function getVehicleDistribution(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [byType, byFuel] = await Promise.all([
      analyticsService.getVehicleTypeDistribution(),
      analyticsService.getFuelTypeDistribution(),
    ]);

    res.json({ byType, byFuel });
  } catch (error) {
    console.error('Vehicle distribution error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle distribution' });
  }
}

export async function getFuelRules(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const rules = await prisma.fuelRule.findMany({
      orderBy: { vehicleType: 'asc' },
    });
    res.json({ rules });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fuel rules' });
  }
}

export async function updateFuelRule(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { maxFillsPerPeriod, periodHours, maxLitersPerFill, isActive, exceptions } = req.body;

    const rule = await prisma.fuelRule.update({
      where: { id },
      data: {
        ...(maxFillsPerPeriod !== undefined && { maxFillsPerPeriod }),
        ...(periodHours !== undefined && { periodHours }),
        ...(maxLitersPerFill !== undefined && { maxLitersPerFill }),
        ...(isActive !== undefined && { isActive }),
        ...(exceptions !== undefined && { exceptions }),
      },
    });

    res.json({ message: 'Rule updated successfully', rule });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update fuel rule' });
  }
}

export async function listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const role = req.query.role as string;
    const search = req.query.search as string;

    const where = {
      ...(role && { role: role as 'SUPER_ADMIN' | 'STATION_MANAGER' | 'CITIZEN' }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { fullName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              vehicles: true,
              households: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(role && { role }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
}

export async function verifyVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { isVerified },
      select: {
        id: true,
        plateNumber: true,
        isVerified: true,
        owner: {
          select: { email: true, fullName: true },
        },
      },
    });

    res.json({ message: 'Vehicle verification status updated', vehicle });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
}

export async function updateVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      plateNumber,
      vehicleType,
      fuelType,
      brand,
      model,
      isVerified,
      isActive,
      customMaxLitersPerFill,
      customMaxFillsPerPeriod,
      customPeriodHours,
      customLimitReason
    } = req.body;

    // Check if plate number is being changed and if it's already taken
    if (plateNumber) {
      const existingVehicle = await prisma.vehicle.findFirst({
        where: {
          plateNumber,
          NOT: { id },
        },
      });
      if (existingVehicle) {
        res.status(400).json({ error: 'This plate number is already registered' });
        return;
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(plateNumber !== undefined && { plateNumber }),
        ...(vehicleType !== undefined && { vehicleType }),
        ...(fuelType !== undefined && { fuelType }),
        ...(brand !== undefined && { brand }),
        ...(model !== undefined && { model }),
        ...(isVerified !== undefined && { isVerified }),
        ...(isActive !== undefined && { isActive }),
        ...(customMaxLitersPerFill !== undefined && { customMaxLitersPerFill }),
        ...(customMaxFillsPerPeriod !== undefined && { customMaxFillsPerPeriod }),
        ...(customPeriodHours !== undefined && { customPeriodHours }),
        ...(customLimitReason !== undefined && { customLimitReason }),
      },
      include: {
        owner: {
          select: { id: true, email: true, fullName: true, phone: true },
        },
      },
    });

    res.json({ message: 'Vehicle updated successfully', vehicle });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
}

export async function getVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, email: true, fullName: true, phone: true },
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
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

    // Get applicable fuel rule
    const fuelRule = await prisma.fuelRule.findFirst({
      where: {
        vehicleType: vehicle.vehicleType,
        isActive: true,
      },
    });

    res.json({ vehicle, fuelRule });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
}

export async function verifyHousehold(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const household = await prisma.household.update({
      where: { id },
      data: { isVerified },
      select: {
        id: true,
        fullName: true,
        isVerified: true,
        owner: {
          select: { email: true, fullName: true },
        },
      },
    });

    res.json({ message: 'Household verification status updated', household });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update household' });
  }
}

export async function getPendingVerifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [vehicles, households] = await Promise.all([
      prisma.vehicle.findMany({
        where: { isVerified: false, isActive: true },
        include: {
          owner: {
            select: { email: true, fullName: true, phone: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      }),
      prisma.household.findMany({
        where: { isVerified: false, isActive: true },
        include: {
          owner: {
            select: { email: true, fullName: true, phone: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      }),
    ]);

    res.json({ vehicles, households });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending verifications' });
  }
}

export async function listVehicles(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const vehicleType = req.query.vehicleType as string;
    const isVerified = req.query.isVerified as string;

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { plateNumber: { contains: search, mode: 'insensitive' as const } },
          { owner: { fullName: { contains: search, mode: 'insensitive' as const } } },
        ],
      }),
      ...(vehicleType && { vehicleType: vehicleType as any }),
      ...(isVerified !== undefined && { isVerified: isVerified === 'true' }),
    };

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          owner: {
            select: { id: true, email: true, fullName: true, phone: true },
          },
          _count: {
            select: { transactions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.vehicle.count({ where }),
    ]);

    res.json({
      vehicles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
}

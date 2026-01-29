import prisma from '../config/database.js';
import { addDays } from '../utils/helpers.js';

export interface OverviewStats {
  totalStations: number;
  totalVehicles: number;
  totalHouseholds: number;
  todayTransactions: number;
  todayApproved: number;
  todayDenied: number;
  weeklyTransactions: number;
  weeklyFraudAttempts: number;
}

export interface StationStats {
  stationId: string;
  stationName: string;
  stationCode: string;
  totalTransactions: number;
  approvedCount: number;
  deniedCount: number;
  totalLiters: number;
}

export interface DailyStats {
  date: string;
  approved: number;
  denied: number;
  totalLiters: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = addDays(today, -7);

  const [
    totalStations,
    totalVehicles,
    totalHouseholds,
    todayFuelTransactions,
    weeklyFuelTransactions,
  ] = await Promise.all([
    prisma.station.count({ where: { isActive: true } }),
    prisma.vehicle.count({ where: { isActive: true } }),
    prisma.household.count({ where: { isActive: true } }),
    prisma.fuelTransaction.findMany({
      where: { createdAt: { gte: today } },
      select: { status: true },
    }),
    prisma.fuelTransaction.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { status: true },
    }),
  ]);

  const todayApproved = todayFuelTransactions.filter((t) => t.status === 'APPROVED').length;
  const todayDenied = todayFuelTransactions.filter((t) => t.status === 'DENIED').length;
  const weeklyFraudAttempts = weeklyFuelTransactions.filter((t) => t.status === 'DENIED').length;

  return {
    totalStations,
    totalVehicles,
    totalHouseholds,
    todayTransactions: todayFuelTransactions.length,
    todayApproved,
    todayDenied,
    weeklyTransactions: weeklyFuelTransactions.length,
    weeklyFraudAttempts,
  };
}

export async function getStationStats(
  startDate?: Date,
  endDate?: Date
): Promise<StationStats[]> {
  const dateFilter = {
    ...(startDate && { gte: startDate }),
    ...(endDate && { lte: endDate }),
  };

  const stations = await prisma.station.findMany({
    where: { isActive: true },
    include: {
      fuelTransactions: {
        where: startDate || endDate ? { createdAt: dateFilter } : undefined,
        select: {
          status: true,
          liters: true,
        },
      },
    },
  });

  return stations.map((station) => {
    const approved = station.fuelTransactions.filter((t) => t.status === 'APPROVED');
    const denied = station.fuelTransactions.filter((t) => t.status === 'DENIED');
    const totalLiters = approved.reduce((sum, t) => sum + (t.liters || 0), 0);

    return {
      stationId: station.id,
      stationName: station.name,
      stationCode: station.code,
      totalTransactions: station.fuelTransactions.length,
      approvedCount: approved.length,
      deniedCount: denied.length,
      totalLiters,
    };
  });
}

export async function getDailyStats(days: number = 30): Promise<DailyStats[]> {
  const startDate = addDays(new Date(), -days);

  const transactions = await prisma.fuelTransaction.findMany({
    where: { createdAt: { gte: startDate } },
    select: {
      status: true,
      liters: true,
      createdAt: true,
    },
  });

  // Group by date
  const statsByDate = new Map<string, DailyStats>();

  transactions.forEach((t) => {
    const dateKey = t.createdAt.toISOString().split('T')[0];

    if (!statsByDate.has(dateKey)) {
      statsByDate.set(dateKey, {
        date: dateKey,
        approved: 0,
        denied: 0,
        totalLiters: 0,
      });
    }

    const stats = statsByDate.get(dateKey)!;
    if (t.status === 'APPROVED') {
      stats.approved++;
      stats.totalLiters += t.liters || 0;
    } else if (t.status === 'DENIED') {
      stats.denied++;
    }
  });

  // Sort by date
  return Array.from(statsByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getFraudAttempts(
  limit: number = 50,
  stationId?: string
) {
  return prisma.fuelTransaction.findMany({
    where: {
      status: 'DENIED',
      ...(stationId && { stationId }),
    },
    include: {
      vehicle: {
        include: { owner: { select: { fullName: true, phone: true } } },
      },
      station: { select: { name: true, code: true } },
      processedBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getVehicleTypeDistribution() {
  const vehicles = await prisma.vehicle.groupBy({
    by: ['vehicleType'],
    _count: true,
    where: { isActive: true },
  });

  return vehicles.map((v) => ({
    vehicleType: v.vehicleType,
    count: v._count,
  }));
}

export async function getFuelTypeDistribution() {
  const vehicles = await prisma.vehicle.groupBy({
    by: ['fuelType'],
    _count: true,
    where: { isActive: true },
  });

  return vehicles.map((v) => ({
    fuelType: v.fuelType,
    count: v._count,
  }));
}

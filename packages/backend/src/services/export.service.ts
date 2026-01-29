import prisma from '../config/database.js';

interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  stationId?: string;
  status?: 'APPROVED' | 'DENIED';
}

export async function exportFuelTransactionsCSV(options: ExportOptions): Promise<string> {
  const { startDate, endDate, stationId, status } = options;

  const where = {
    ...(stationId && { stationId }),
    ...(status && { status }),
    ...((startDate || endDate) && {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
  };

  const transactions = await prisma.fuelTransaction.findMany({
    where,
    include: {
      vehicle: {
        select: {
          plateNumber: true,
          vehicleType: true,
          fuelType: true,
          owner: { select: { fullName: true, nationalId: true } },
        },
      },
      station: { select: { name: true, code: true, wilaya: true } },
      processedBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Build CSV
  const headers = [
    'Date',
    'Time',
    'Station Code',
    'Station Name',
    'Wilaya',
    'Plate Number',
    'Vehicle Type',
    'Fuel Type',
    'Owner Name',
    'Liters',
    'Status',
    'Denial Reason',
    'Processed By',
  ];

  const rows = transactions.map((tx) => [
    new Date(tx.createdAt).toLocaleDateString(),
    new Date(tx.createdAt).toLocaleTimeString(),
    tx.station.code,
    tx.station.name,
    tx.station.wilaya,
    tx.vehicle.plateNumber,
    tx.vehicle.vehicleType,
    tx.vehicle.fuelType,
    tx.vehicle.owner?.fullName || '',
    tx.liters?.toString() || '',
    tx.status,
    tx.denialReason || '',
    tx.processedBy.fullName,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csv;
}

export async function exportGasBottleTransactionsCSV(options: ExportOptions): Promise<string> {
  const { startDate, endDate, stationId, status } = options;

  const where = {
    ...(stationId && { stationId }),
    ...(status && { status }),
    ...((startDate || endDate) && {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
  };

  const transactions = await prisma.gasBottleTransaction.findMany({
    where,
    include: {
      household: {
        select: {
          nationalId: true,
          fullName: true,
          wilaya: true,
          commune: true,
          memberCount: true,
        },
      },
      station: { select: { name: true, code: true, wilaya: true } },
      processedBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'Date',
    'Time',
    'Station Code',
    'Station Name',
    'Household Name',
    'National ID',
    'Wilaya',
    'Commune',
    'Members',
    'Quantity',
    'Exchange Type',
    'Status',
    'Denial Reason',
    'Processed By',
  ];

  const rows = transactions.map((tx) => [
    new Date(tx.createdAt).toLocaleDateString(),
    new Date(tx.createdAt).toLocaleTimeString(),
    tx.station.code,
    tx.station.name,
    tx.household.fullName,
    tx.household.nationalId,
    tx.household.wilaya,
    tx.household.commune,
    tx.household.memberCount.toString(),
    tx.quantity.toString(),
    tx.exchangeType,
    tx.status,
    tx.denialReason || '',
    tx.processedBy.fullName,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csv;
}

export async function exportStationStatsCSV(options: ExportOptions): Promise<string> {
  const { startDate, endDate } = options;

  const dateFilter = {
    ...((startDate || endDate) && {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
  };

  const stations = await prisma.station.findMany({
    where: { isActive: true },
    include: {
      fuelTransactions: {
        where: dateFilter,
        select: { status: true, liters: true },
      },
      gasTransactions: {
        where: dateFilter,
        select: { status: true, quantity: true },
      },
      _count: {
        select: { managers: true },
      },
    },
  });

  const headers = [
    'Station Code',
    'Station Name',
    'Wilaya',
    'Commune',
    'Managers',
    'Total Fuel Transactions',
    'Approved Fuel',
    'Denied Fuel',
    'Total Liters Dispensed',
    'Total Gas Transactions',
    'Approved Gas',
    'Denied Gas',
    'Total Bottles',
  ];

  const rows = stations.map((station) => {
    const fuelApproved = station.fuelTransactions.filter((t) => t.status === 'APPROVED');
    const fuelDenied = station.fuelTransactions.filter((t) => t.status === 'DENIED');
    const totalLiters = fuelApproved.reduce((sum, t) => sum + (t.liters || 0), 0);
    const gasApproved = station.gasTransactions.filter((t) => t.status === 'APPROVED');
    const gasDenied = station.gasTransactions.filter((t) => t.status === 'DENIED');
    const totalBottles = gasApproved.reduce((sum, t) => sum + t.quantity, 0);

    return [
      station.code,
      station.name,
      station.wilaya,
      station.commune,
      station._count.managers.toString(),
      station.fuelTransactions.length.toString(),
      fuelApproved.length.toString(),
      fuelDenied.length.toString(),
      totalLiters.toFixed(2),
      station.gasTransactions.length.toString(),
      gasApproved.length.toString(),
      gasDenied.length.toString(),
      totalBottles.toString(),
    ];
  });

  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csv;
}

export async function exportBlacklistCSV(): Promise<string> {
  const entries = await prisma.blacklist.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'National ID',
    'Plate Number',
    'Reason',
    'Severity',
    'Notes',
    'Created At',
    'Expires At',
  ];

  const rows = entries.map((entry) => [
    entry.nationalId || '',
    entry.plateNumber || '',
    entry.reason,
    entry.severity,
    entry.notes || '',
    new Date(entry.createdAt).toLocaleString(),
    entry.expiresAt ? new Date(entry.expiresAt).toLocaleString() : 'Permanent',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csv;
}

export async function exportFraudAttemptsCSV(days: number = 30): Promise<string> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const attempts = await prisma.fuelTransaction.findMany({
    where: {
      status: 'DENIED',
      createdAt: { gte: startDate },
    },
    include: {
      vehicle: {
        select: {
          plateNumber: true,
          vehicleType: true,
          owner: { select: { fullName: true, nationalId: true, phone: true } },
        },
      },
      station: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'Date',
    'Time',
    'Station',
    'Plate Number',
    'Vehicle Type',
    'Owner Name',
    'Owner National ID',
    'Owner Phone',
    'Denial Reason',
  ];

  const rows = attempts.map((tx) => [
    new Date(tx.createdAt).toLocaleDateString(),
    new Date(tx.createdAt).toLocaleTimeString(),
    `${tx.station.code} - ${tx.station.name}`,
    tx.vehicle.plateNumber,
    tx.vehicle.vehicleType,
    tx.vehicle.owner?.fullName || '',
    tx.vehicle.owner?.nationalId || '',
    tx.vehicle.owner?.phone || '',
    tx.denialReason || 'Quota exceeded',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csv;
}

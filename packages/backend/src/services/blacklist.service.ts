import prisma from '../config/database.js';

export type BlacklistSeverity = 'WARNING' | 'BLOCKED';

export interface BlacklistEntry {
  id: string;
  nationalId: string | null;
  plateNumber: string | null;
  reason: string;
  severity: string;
  notes: string | null;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface BlacklistCheckResult {
  isBlacklisted: boolean;
  severity?: BlacklistSeverity;
  reason?: string;
  entry?: BlacklistEntry;
}

export async function checkBlacklist(
  nationalId?: string,
  plateNumber?: string
): Promise<BlacklistCheckResult> {
  if (!nationalId && !plateNumber) {
    return { isBlacklisted: false };
  }

  const now = new Date();

  const entry = await prisma.blacklist.findFirst({
    where: {
      isActive: true,
      AND: [
        {
          OR: [
            ...(nationalId ? [{ nationalId }] : []),
            ...(plateNumber ? [{ plateNumber }] : []),
          ],
        },
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
      ],
    },
  });

  if (!entry) {
    return { isBlacklisted: false };
  }

  return {
    isBlacklisted: true,
    severity: entry.severity as BlacklistSeverity,
    reason: entry.reason,
    entry: entry as BlacklistEntry,
  };
}

export async function addToBlacklist(data: {
  nationalId?: string;
  plateNumber?: string;
  reason: string;
  severity?: BlacklistSeverity;
  notes?: string;
  addedById?: string;
  expiresAt?: Date;
}) {
  const { nationalId, plateNumber, reason, severity = 'WARNING', notes, addedById, expiresAt } = data;

  if (!nationalId && !plateNumber) {
    throw new Error('Either nationalId or plateNumber is required');
  }

  // Check if already blacklisted
  const existing = await prisma.blacklist.findFirst({
    where: {
      isActive: true,
      OR: [
        ...(nationalId ? [{ nationalId }] : []),
        ...(plateNumber ? [{ plateNumber }] : []),
      ],
    },
  });

  if (existing) {
    // Update existing entry
    return prisma.blacklist.update({
      where: { id: existing.id },
      data: {
        reason,
        severity,
        notes,
        expiresAt,
      },
    });
  }

  return prisma.blacklist.create({
    data: {
      nationalId,
      plateNumber,
      reason,
      severity,
      notes,
      addedById,
      expiresAt,
    },
  });
}

export async function removeFromBlacklist(id: string) {
  return prisma.blacklist.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function getBlacklistEntries(options: {
  search?: string;
  severity?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  const { search, severity, isActive = true, page = 1, limit = 20 } = options;

  const where = {
    isActive,
    ...(severity && { severity }),
    ...(search && {
      OR: [
        { nationalId: { contains: search, mode: 'insensitive' as const } },
        { plateNumber: { contains: search, mode: 'insensitive' as const } },
        { reason: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [entries, total] = await Promise.all([
    prisma.blacklist.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blacklist.count({ where }),
  ]);

  return {
    entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function flagUser(userId: string, reason: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isFlagged: true,
      flagReason: reason,
    },
  });
}

export async function unflagUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isFlagged: false,
      flagReason: null,
    },
  });
}

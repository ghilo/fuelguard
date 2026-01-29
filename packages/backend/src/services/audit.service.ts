import prisma from '../config/database.js';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'SCAN_QR'
  | 'APPROVE_FUEL'
  | 'DENY_FUEL'
  | 'APPROVE_GAS'
  | 'DENY_GAS'
  | 'CREATE_VEHICLE'
  | 'DELETE_VEHICLE'
  | 'CREATE_HOUSEHOLD'
  | 'VERIFY_VEHICLE'
  | 'VERIFY_HOUSEHOLD'
  | 'CREATE_STATION'
  | 'UPDATE_STATION'
  | 'ADD_BLACKLIST'
  | 'REMOVE_BLACKLIST'
  | 'UPDATE_RULE'
  | 'GENERATE_QR'
  | 'EXPORT_REPORT';

export type EntityType =
  | 'USER'
  | 'VEHICLE'
  | 'HOUSEHOLD'
  | 'STATION'
  | 'TRANSACTION'
  | 'BLACKLIST'
  | 'RULE';

interface AuditLogParams {
  userId?: string;
  action: AuditAction;
  entityType?: EntityType;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    // Don't throw errors for audit logging failures
    console.error('Audit log error:', error);
  }
}

export async function getAuditLogs(options: {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const {
    userId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = options;

  const where = {
    ...(userId && { userId }),
    ...(action && { action }),
    ...(entityType && { entityType }),
    ...(entityId && { entityId }),
    ...((startDate || endDate) && {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserActivity(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return prisma.auditLog.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

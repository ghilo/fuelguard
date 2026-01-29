import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as exportService from '../services/export.service.js';
import * as auditService from '../services/audit.service.js';

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
}

export async function exportFuelTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { startDate, endDate, stationId, status } = req.query;

    const csv = await exportService.exportFuelTransactionsCSV({
      startDate: parseDate(startDate as string),
      endDate: parseDate(endDate as string),
      stationId: stationId as string,
      status: status as 'APPROVED' | 'DENIED',
    });

    await auditService.logAudit({
      userId: req.user.userId,
      action: 'EXPORT',
      entityType: 'FUEL_TRANSACTION',
      details: { startDate, endDate, stationId, status },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=fuel-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export fuel transactions' });
  }
}

export async function exportGasBottleTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { startDate, endDate, stationId, status } = req.query;

    const csv = await exportService.exportGasBottleTransactionsCSV({
      startDate: parseDate(startDate as string),
      endDate: parseDate(endDate as string),
      stationId: stationId as string,
      status: status as 'APPROVED' | 'DENIED',
    });

    await auditService.logAudit({
      userId: req.user.userId,
      action: 'EXPORT',
      entityType: 'GAS_BOTTLE_TRANSACTION',
      details: { startDate, endDate, stationId, status },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=gas-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export gas bottle transactions' });
  }
}

export async function exportStationStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { startDate, endDate } = req.query;

    const csv = await exportService.exportStationStatsCSV({
      startDate: parseDate(startDate as string),
      endDate: parseDate(endDate as string),
    });

    await auditService.logAudit({
      userId: req.user.userId,
      action: 'EXPORT',
      entityType: 'STATION',
      details: { startDate, endDate },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=station-stats-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export station stats' });
  }
}

export async function exportBlacklist(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const csv = await exportService.exportBlacklistCSV();

    await auditService.logAudit({
      userId: req.user.userId,
      action: 'EXPORT',
      entityType: 'BLACKLIST',
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=blacklist-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export blacklist' });
  }
}

export async function exportFraudAttempts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const days = parseInt(req.query.days as string) || 30;

    const csv = await exportService.exportFraudAttemptsCSV(days);

    await auditService.logAudit({
      userId: req.user.userId,
      action: 'EXPORT',
      entityType: 'FRAUD_ATTEMPT',
      details: { days },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=fraud-attempts-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export fraud attempts' });
  }
}

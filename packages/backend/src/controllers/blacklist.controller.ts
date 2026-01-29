import { qString } from "../utils/query";
import type { Response } from 'express';
import { body, query } from 'express-validator';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as blacklistService from '../services/blacklist.service.js';
import * as auditService from '../services/audit.service.js';

export const addBlacklistValidation = [
  body('nationalId').optional().isString(),
  body('plateNumber').optional().isString(),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('severity').optional().isIn(['WARNING', 'BLOCKED']),
  body('notes').optional().isString(),
  body('expiresAt').optional().isISO8601(),
];

export async function addToBlacklist(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { nationalId, plateNumber, reason, severity, notes, expiresAt } = req.body;

    if (!nationalId && !plateNumber) {
      res.status(400).json({ error: 'Either nationalId or plateNumber is required' });
      return;
    }

    const entry = await blacklistService.addToBlacklist({
      nationalId,
      plateNumber,
      reason,
      severity,
      notes,
      addedById: req.user.userId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    // Log audit
    await auditService.logAudit({
      userId: req.user.userId,
      action: 'ADD_BLACKLIST',
      entityType: 'BLACKLIST',
      entityId: entry.id,
      details: { nationalId, plateNumber, reason, severity },
    });

    res.status(201).json({
      message: 'Added to blacklist successfully',
      entry,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add to blacklist';
    res.status(400).json({ error: message });
  }
}

export async function removeFromBlacklist(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const id = req.params.id as string;

    await blacklistService.removeFromBlacklist(id);

    // Log audit
    await auditService.logAudit({
      userId: req.user.userId,
      action: 'REMOVE_BLACKLIST',
      entityType: 'BLACKLIST',
      entityId: id,
    });

    res.json({ message: 'Removed from blacklist successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from blacklist' });
  }
}

export async function getBlacklist(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(qString(req.query.page) ?? "1");
    const limit = parseInt(qString(req.query.limit) ?? "20");

    const search = qString(req.query.search);
    const severity = qString(req.query.severity);

    const isActive = qString(req.query.isActive) !== "false";

    const result = await blacklistService.getBlacklistEntries({
      search,
      severity,
      isActive,
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blacklist' });
  }
}

export async function checkBlacklist(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const nationalId = qString(req.query.nationalId);
    const plateNumber = qString(req.query.plateNumber);

    const result = await blacklistService.checkBlacklist(
      nationalId,
      plateNumber
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check blacklist' });
  }
}

export async function flagUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const id = req.params.id as string;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ error: 'Reason is required' });
      return;
    }

    const user = await blacklistService.flagUser(id, reason);

    await auditService.logAudit({
      userId: req.user.userId,
      action: 'ADD_BLACKLIST',
      entityType: 'USER',
      entityId: id,
      details: { reason, type: 'flag' },
    });

    res.json({ message: 'User flagged successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to flag user' });
  }
}

export async function unflagUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const id = req.params.id as string;

    const user = await blacklistService.unflagUser(id);

    await auditService.logAudit({
      userId: req.user.userId,
      action: 'REMOVE_BLACKLIST',
      entityType: 'USER',
      entityId: id,
      details: { type: 'unflag' },
    });

    res.json({ message: 'User unflagged successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unflag user' });
  }
}

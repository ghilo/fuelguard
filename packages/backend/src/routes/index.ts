import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole, requireAdmin, requireStationManager } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  authLimiter,
  registerLimiter,
  scanLimiter,
  adminLimiter,
  exportLimiter,
} from '../middleware/rate-limit.middleware.js';

// Controllers
import * as authController from '../controllers/auth.controller.js';
import * as citizenController from '../controllers/citizen.controller.js';
import * as stationController from '../controllers/station.controller.js';
import * as verificationController from '../controllers/verification.controller.js';
import * as gasBottleController from '../controllers/gas-bottle.controller.js';
import * as analyticsController from '../controllers/analytics.controller.js';
import * as blacklistController from '../controllers/blacklist.controller.js';
import * as exportController from '../controllers/export.controller.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== AUTH ROUTES ====================
router.post(
  '/auth/register',
  registerLimiter,
  validate(authController.registerValidation),
  authController.register
);
router.post(
  '/auth/login',
  authLimiter,
  validate(authController.loginValidation),
  authController.login
);
router.post('/auth/refresh', authLimiter, authController.refresh);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticate, authController.me);

// ==================== CITIZEN ROUTES ====================
router.get(
  '/citizens/me',
  authenticate,
  requireRole('CITIZEN', 'SUPER_ADMIN'),
  citizenController.getProfile
);
router.post(
  '/citizens/vehicles',
  authenticate,
  requireRole('CITIZEN', 'SUPER_ADMIN'),
  validate(citizenController.createVehicleValidation),
  citizenController.createVehicle
);
router.get(
  '/citizens/vehicles',
  authenticate,
  requireRole('CITIZEN', 'SUPER_ADMIN'),
  citizenController.getVehicles
);
router.get(
  '/citizens/vehicles/:id',
  authenticate,
  requireRole('CITIZEN', 'SUPER_ADMIN'),
  citizenController.getVehicle
);
router.get(
  '/citizens/vehicles/:id/qrcode',
  authenticate,
  requireRole('CITIZEN', 'SUPER_ADMIN'),
  citizenController.getVehicleQRCode
);
router.delete(
  '/citizens/vehicles/:id',
  authenticate,
  requireRole('CITIZEN', 'SUPER_ADMIN'),
  citizenController.deleteVehicle
);
router.get(
  '/citizens/transactions',
  authenticate,
  requireRole('CITIZEN', 'SUPER_ADMIN'),
  citizenController.getTransactions
);

// ==================== STATION ROUTES ====================
router.get(
  '/stations',
  authenticate,
  requireAdmin,
  stationController.listStations
);
router.post(
  '/stations',
  authenticate,
  requireAdmin,
  validate(stationController.createStationValidation),
  stationController.createStation
);
router.get(
  '/stations/my',
  authenticate,
  requireStationManager,
  stationController.getMyStation
);
router.get(
  '/stations/:id',
  authenticate,
  requireRole('SUPER_ADMIN', 'STATION_MANAGER'),
  stationController.getStation
);
router.put(
  '/stations/:id',
  authenticate,
  requireAdmin,
  stationController.updateStation
);
router.post(
  '/stations/:id/managers',
  authenticate,
  requireAdmin,
  validate(stationController.addManagerValidation),
  stationController.addManager
);
router.delete(
  '/stations/:id/managers/:managerId',
  authenticate,
  requireAdmin,
  stationController.removeManager
);
router.get(
  '/stations/:id/transactions',
  authenticate,
  requireRole('SUPER_ADMIN', 'STATION_MANAGER'),
  stationController.getStationTransactions
);

// ==================== VERIFICATION ROUTES ====================
router.post(
  '/verify/scan',
  scanLimiter,
  authenticate,
  requireStationManager,
  validate(verificationController.scanValidation),
  verificationController.scanQR
);
router.post(
  '/verify/approve',
  scanLimiter,
  authenticate,
  requireStationManager,
  validate(verificationController.approveValidation),
  verificationController.approveTransaction
);
router.post(
  '/verify/deny',
  scanLimiter,
  authenticate,
  requireStationManager,
  validate(verificationController.denyValidation),
  verificationController.denyTransaction
);
router.post(
  '/verify/manual',
  scanLimiter,
  authenticate,
  requireStationManager,
  validate(verificationController.manualLookupValidation),
  verificationController.manualLookup
);

// ==================== GAS BOTTLE ROUTES ====================
router.post(
  '/gas-bottles/households',
  authenticate,
  requireRole('CITIZEN', 'SUPER_ADMIN'),
  validate(gasBottleController.createHouseholdValidation),
  gasBottleController.createHousehold
);
router.get(
  '/gas-bottles/households',
  authenticate,
  requireRole('CITIZEN', 'SUPER_ADMIN'),
  gasBottleController.getHouseholds
);
router.get(
  '/gas-bottles/households/:id/qrcode',
  authenticate,
  requireRole('CITIZEN', 'SUPER_ADMIN'),
  gasBottleController.getHouseholdQRCode
);
router.post(
  '/gas-bottles/verify',
  authenticate,
  requireStationManager,
  validate(gasBottleController.verifyHouseholdValidation),
  gasBottleController.verifyHousehold
);
router.post(
  '/gas-bottles/transaction',
  authenticate,
  requireStationManager,
  validate(gasBottleController.transactionValidation),
  gasBottleController.recordTransaction
);
router.get(
  '/gas-bottles/rules',
  authenticate,
  gasBottleController.getGasBottleRules
);

// ==================== ADMIN ROUTES ====================
router.get(
  '/admin/analytics/overview',
  authenticate,
  requireAdmin,
  analyticsController.getOverview
);
router.get(
  '/admin/analytics/stations',
  authenticate,
  requireAdmin,
  analyticsController.getStationStats
);
router.get(
  '/admin/analytics/daily',
  authenticate,
  requireAdmin,
  analyticsController.getDailyStats
);
router.get(
  '/admin/analytics/fraud',
  authenticate,
  requireAdmin,
  analyticsController.getFraudAttempts
);
router.get(
  '/admin/analytics/vehicles',
  authenticate,
  requireAdmin,
  analyticsController.getVehicleDistribution
);
router.get(
  '/admin/rules/fuel',
  authenticate,
  requireAdmin,
  analyticsController.getFuelRules
);
router.put(
  '/admin/rules/fuel/:id',
  authenticate,
  requireAdmin,
  analyticsController.updateFuelRule
);
router.get(
  '/admin/users',
  authenticate,
  requireAdmin,
  analyticsController.listUsers
);
router.put(
  '/admin/users/:id',
  authenticate,
  requireAdmin,
  analyticsController.updateUser
);
router.get(
  '/admin/verifications/pending',
  authenticate,
  requireAdmin,
  analyticsController.getPendingVerifications
);
router.get(
  '/admin/vehicles',
  authenticate,
  requireAdmin,
  analyticsController.listVehicles
);
router.get(
  '/admin/vehicles/:id',
  authenticate,
  requireAdmin,
  analyticsController.getVehicle
);
router.put(
  '/admin/vehicles/:id',
  authenticate,
  requireAdmin,
  analyticsController.updateVehicle
);
router.put(
  '/admin/vehicles/:id/verify',
  authenticate,
  requireAdmin,
  analyticsController.verifyVehicle
);
router.put(
  '/admin/households/:id/verify',
  authenticate,
  requireAdmin,
  analyticsController.verifyHousehold
);

// ==================== BLACKLIST ROUTES ====================
router.post(
  '/admin/blacklist',
  authenticate,
  requireAdmin,
  validate(blacklistController.addBlacklistValidation),
  blacklistController.addToBlacklist
);
router.delete(
  '/admin/blacklist/:id',
  authenticate,
  requireAdmin,
  blacklistController.removeFromBlacklist
);
router.get(
  '/admin/blacklist',
  authenticate,
  requireAdmin,
  blacklistController.getBlacklist
);
router.get(
  '/admin/blacklist/check',
  authenticate,
  requireRole('SUPER_ADMIN', 'STATION_MANAGER'),
  blacklistController.checkBlacklist
);
router.post(
  '/admin/users/:id/flag',
  authenticate,
  requireAdmin,
  blacklistController.flagUser
);
router.delete(
  '/admin/users/:id/flag',
  authenticate,
  requireAdmin,
  blacklistController.unflagUser
);

// ==================== EXPORT ROUTES ====================
router.get(
  '/admin/export/fuel-transactions',
  exportLimiter,
  authenticate,
  requireAdmin,
  exportController.exportFuelTransactions
);
router.get(
  '/admin/export/gas-transactions',
  exportLimiter,
  authenticate,
  requireAdmin,
  exportController.exportGasBottleTransactions
);
router.get(
  '/admin/export/stations',
  exportLimiter,
  authenticate,
  requireAdmin,
  exportController.exportStationStats
);
router.get(
  '/admin/export/blacklist',
  exportLimiter,
  authenticate,
  requireAdmin,
  exportController.exportBlacklist
);
router.get(
  '/admin/export/fraud',
  exportLimiter,
  authenticate,
  requireAdmin,
  exportController.exportFraudAttempts
);

export default router;

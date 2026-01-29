import QRCode from 'qrcode';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { generateHmacSignature, verifyHmacSignature } from '../utils/helpers.js';
import config from '../config/index.js';

// QR Code expires at midnight (daily regeneration)
const QR_EXPIRATION_HOURS = 24;

export interface VehicleQRData {
  type: 'vehicle';
  id: string;
  plate: string;
  timestamp: number;
  hash: string;
  signature: string;
}

export interface HouseholdQRData {
  type: 'household';
  id: string;
  nationalId: string;
  timestamp: number;
  hash: string;
  signature: string;
}

export type QRData = VehicleQRData | HouseholdQRData;

function getExpirationDate(): Date {
  const now = new Date();
  // Expire at midnight
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + 1);
  expiry.setHours(0, 0, 0, 0);
  return expiry;
}

function generateCodeHash(entityType: string, entityId: string, timestamp: number): string {
  const data = `${entityType}:${entityId}:${timestamp}:${config.qr.secret}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

export async function generateVehicleQRContent(vehicleId: string, plateNumber: string): Promise<string> {
  const timestamp = Date.now();
  const hash = generateCodeHash('vehicle', vehicleId, timestamp);
  const dataToSign = `vehicle:${vehicleId}:${plateNumber}:${timestamp}:${hash}`;
  const signature = generateHmacSignature(dataToSign);

  const qrData: VehicleQRData = {
    type: 'vehicle',
    id: vehicleId,
    plate: plateNumber,
    timestamp,
    hash,
    signature,
  };

  const content = JSON.stringify(qrData);

  // Store in database with expiration
  const expiresAt = getExpirationDate();
  const codeHash = generateHmacSignature(content);

  // Deactivate old QR codes for this vehicle
  await prisma.qRCode.updateMany({
    where: { entityType: 'VEHICLE', entityId: vehicleId, isActive: true },
    data: { isActive: false },
  });

  // Create new QR code record
  await prisma.qRCode.create({
    data: {
      entityType: 'VEHICLE',
      entityId: vehicleId,
      codeHash,
      codeData: content,
      expiresAt,
    },
  });

  return content;
}

export async function generateHouseholdQRContent(householdId: string, nationalId: string): Promise<string> {
  const timestamp = Date.now();
  const hashedNationalId = generateHmacSignature(nationalId).substring(0, 16);
  const hash = generateCodeHash('household', householdId, timestamp);
  const dataToSign = `household:${householdId}:${hashedNationalId}:${timestamp}:${hash}`;
  const signature = generateHmacSignature(dataToSign);

  const qrData: HouseholdQRData = {
    type: 'household',
    id: householdId,
    nationalId: hashedNationalId,
    timestamp,
    hash,
    signature,
  };

  const content = JSON.stringify(qrData);

  // Store in database with expiration
  const expiresAt = getExpirationDate();
  const codeHash = generateHmacSignature(content);

  // Deactivate old QR codes for this household
  await prisma.qRCode.updateMany({
    where: { entityType: 'HOUSEHOLD', entityId: householdId, isActive: true },
    data: { isActive: false },
  });

  // Create new QR code record
  await prisma.qRCode.create({
    data: {
      entityType: 'HOUSEHOLD',
      entityId: householdId,
      codeHash,
      codeData: content,
      expiresAt,
    },
  });

  return content;
}

export function parseQRContent(content: string): QRData | null {
  try {
    const data = JSON.parse(content) as QRData;

    if (!data.type || !data.id || !data.signature) {
      return null;
    }

    if (data.type !== 'vehicle' && data.type !== 'household') {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function verifyVehicleQRSignature(data: VehicleQRData): boolean {
  const dataToSign = `vehicle:${data.id}:${data.plate}:${data.timestamp}:${data.hash}`;
  return verifyHmacSignature(dataToSign, data.signature);
}

export function verifyHouseholdQRSignature(data: HouseholdQRData): boolean {
  const dataToSign = `household:${data.id}:${data.nationalId}:${data.timestamp}:${data.hash}`;
  return verifyHmacSignature(dataToSign, data.signature);
}

export function verifyQRData(data: QRData): boolean {
  if (data.type === 'vehicle') {
    return verifyVehicleQRSignature(data);
  }
  return verifyHouseholdQRSignature(data);
}

export async function validateQRCode(content: string): Promise<{
  valid: boolean;
  expired: boolean;
  data: QRData | null;
  error?: string;
}> {
  const data = parseQRContent(content);

  if (!data) {
    return { valid: false, expired: false, data: null, error: 'Invalid QR code format' };
  }

  // Verify signature
  if (!verifyQRData(data)) {
    return { valid: false, expired: false, data, error: 'Invalid QR code signature - possible tampering' };
  }

  // Check if QR code exists and is not expired
  const codeHash = generateHmacSignature(content);
  const qrRecord = await prisma.qRCode.findUnique({
    where: { codeHash },
  });

  if (!qrRecord) {
    return { valid: false, expired: false, data, error: 'QR code not registered in system' };
  }

  if (!qrRecord.isActive) {
    return { valid: false, expired: true, data, error: 'QR code has been deactivated' };
  }

  if (qrRecord.expiresAt < new Date()) {
    return { valid: false, expired: true, data, error: 'QR code has expired - please regenerate' };
  }

  return { valid: true, expired: false, data };
}

export async function getOrGenerateVehicleQR(vehicleId: string, plateNumber: string): Promise<string> {
  // Check for existing valid QR
  const existing = await prisma.qRCode.findFirst({
    where: {
      entityType: 'VEHICLE',
      entityId: vehicleId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
  });

  if (existing) {
    return existing.codeData;
  }

  // Generate new QR
  return generateVehicleQRContent(vehicleId, plateNumber);
}

export async function getOrGenerateHouseholdQR(householdId: string, nationalId: string): Promise<string> {
  // Check for existing valid QR
  const existing = await prisma.qRCode.findFirst({
    where: {
      entityType: 'HOUSEHOLD',
      entityId: householdId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
  });

  if (existing) {
    return existing.codeData;
  }

  // Generate new QR
  return generateHouseholdQRContent(householdId, nationalId);
}

export async function generateQRCodeDataURL(content: string): Promise<string> {
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

export async function generateQRCodeBuffer(content: string): Promise<Buffer> {
  return QRCode.toBuffer(content, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 300,
    margin: 2,
  });
}

// Cleanup expired QR codes (run periodically)
export async function cleanupExpiredQRCodes(): Promise<number> {
  const result = await prisma.qRCode.updateMany({
    where: {
      expiresAt: { lt: new Date() },
      isActive: true,
    },
    data: { isActive: false },
  });
  return result.count;
}

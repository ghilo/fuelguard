export type UserRole = 'SUPER_ADMIN' | 'STATION_MANAGER' | 'CITIZEN';
export type VehicleType = 'PRIVATE_CAR' | 'TAXI' | 'TRUCK' | 'MOTORCYCLE' | 'BUS' | 'GOVERNMENT' | 'OTHER';
export type FuelType = 'ESSENCE' | 'GASOIL' | 'GPL';
export type TransactionStatus = 'APPROVED' | 'DENIED' | 'PENDING';
export type EligibilityStatus = 'APPROVED' | 'DENIED' | 'WARNING';
export type BlacklistSeverity = 'WARNING' | 'BLOCKED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  nationalId?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: VehicleType;
  fuelType: FuelType;
  brand?: string;
  model?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  owner?: {
    fullName: string;
    phone?: string;
    isFlagged?: boolean;
    flagReason?: string;
  };
}

export interface Household {
  id: string;
  nationalId: string;
  fullName: string;
  address: string;
  wilaya: string;
  commune: string;
  memberCount: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Station {
  id: string;
  name: string;
  code: string;
  address: string;
  wilaya: string;
  commune: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  _count?: {
    managers: number;
    fuelTransactions: number;
  };
}

export interface FuelTransaction {
  id: string;
  vehicleId: string;
  stationId: string;
  processedById: string;
  liters?: number;
  status: TransactionStatus;
  denialReason?: string;
  createdAt: string;
  completedAt?: string;
  vehicle?: Vehicle;
  station?: {
    name: string;
    code: string;
  };
  processedBy?: {
    fullName: string;
  };
}

export interface FuelRule {
  id: string;
  vehicleType: VehicleType;
  fuelType?: FuelType;
  maxFillsPerPeriod: number;
  periodHours: number;
  maxLitersPerFill: number;
  isActive: boolean;
}

export interface GasBottleRule {
  id: string;
  name: string;
  maxBottlesPerPeriod: number;
  periodDays: number;
  minMemberCount: number;
  maxMemberCount?: number;
  bottleSize: number;
  isActive: boolean;
}

export interface BlacklistInfo {
  isBlacklisted: boolean;
  severity?: BlacklistSeverity;
  reason?: string;
}

export interface VerificationResult {
  type: 'vehicle' | 'household';
  status: EligibilityStatus;
  eligible: boolean;
  reason?: string;
  nextEligibleAt?: string;
  hoursUntilNextFill?: number;
  daysUntilNextPurchase?: number;
  lastFillDate?: string;
  lastFillLiters?: number;
  lastPurchaseDate?: string;
  vehicle?: Vehicle;
  household?: Household & {
    owner?: {
      fullName: string;
      isFlagged?: boolean;
      flagReason?: string;
    };
  };
  quota: {
    fillsInPeriod?: number;
    maxFillsAllowed?: number;
    maxLitersAllowed?: number;
    periodHours?: number;
    bottlesInPeriod?: number;
    maxBottlesAllowed?: number;
    periodDays?: number;
  };
  blacklistInfo?: BlacklistInfo;
}

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

export interface DailyStats {
  date: string;
  approved: number;
  denied: number;
  totalLiters: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

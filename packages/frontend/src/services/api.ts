import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, updateTokens, logout } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          updateTokens(data.accessToken, data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          logout();
          window.location.href = '/login';
        }
      } else {
        logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    nationalId?: string;
  }) => api.post('/auth/register', data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  me: () => api.get('/auth/me'),
};

// Citizen API
export const citizenApi = {
  getProfile: () => api.get('/citizens/me'),

  getVehicles: () => api.get('/citizens/vehicles'),

  createVehicle: (data: {
    plateNumber: string;
    vehicleType: string;
    fuelType: string;
    brand?: string;
    model?: string;
  }) => api.post('/citizens/vehicles', data),

  getVehicle: (id: string) => api.get(`/citizens/vehicles/${id}`),

  getVehicleQRCode: (id: string) => api.get(`/citizens/vehicles/${id}/qrcode`),

  deleteVehicle: (id: string) => api.delete(`/citizens/vehicles/${id}`),

  getTransactions: (page = 1, limit = 20) =>
    api.get('/citizens/transactions', { params: { page, limit } }),

  // Households
  getHouseholds: () => api.get('/gas-bottles/households'),

  createHousehold: (data: {
    nationalId: string;
    fullName: string;
    address: string;
    wilaya: string;
    commune: string;
    memberCount: number;
  }) => api.post('/gas-bottles/households', data),

  getHouseholdQRCode: (id: string) => api.get(`/gas-bottles/households/${id}/qrcode`),
};

// Station API
export const stationApi = {
  getMyStation: () => api.get('/stations/my'),

  getTransactions: (stationId?: string, page = 1, status?: string) =>
    api.get(stationId ? `/stations/${stationId}/transactions` : '/stations/my/transactions', {
      params: { page, status },
    }),

  // Verification
  scanQR: (qrContent: string) => api.post('/verify/scan', { qrContent }),

  approveTransaction: (vehicleId: string, liters: number) =>
    api.post('/verify/approve', { vehicleId, liters }),

  denyTransaction: (vehicleId: string, reason: string) =>
    api.post('/verify/deny', { vehicleId, reason }),

  manualLookup: (plateNumber: string) =>
    api.post('/verify/manual', { plateNumber }),

  // Gas bottles
  verifyHousehold: (qrContent: string) =>
    api.post('/gas-bottles/verify', { qrContent }),

  recordGasTransaction: (householdId: string, quantity: number, status: 'APPROVED' | 'DENIED', denialReason?: string) =>
    api.post('/gas-bottles/transaction', { householdId, quantity, status, denialReason }),
};

// Admin API
export const adminApi = {
  // Stations
  listStations: (page = 1, search?: string, wilaya?: string) =>
    api.get('/stations', { params: { page, search, wilaya } }),

  createStation: (data: {
    name: string;
    code: string;
    address: string;
    wilaya: string;
    commune: string;
    latitude?: number;
    longitude?: number;
  }) => api.post('/stations', data),

  getStation: (id: string) => api.get(`/stations/${id}`),

  updateStation: (id: string, data: Partial<{
    name: string;
    address: string;
    wilaya: string;
    commune: string;
    isActive: boolean;
  }>) => api.put(`/stations/${id}`, data),

  addManager: (stationId: string, email: string) =>
    api.post(`/stations/${stationId}/managers`, { email }),

  removeManager: (stationId: string, managerId: string) =>
    api.delete(`/stations/${stationId}/managers/${managerId}`),

  // Analytics
  getOverview: () => api.get('/admin/analytics/overview'),

  getStationStats: (startDate?: string, endDate?: string) =>
    api.get('/admin/analytics/stations', { params: { startDate, endDate } }),

  getDailyStats: (days = 30) =>
    api.get('/admin/analytics/daily', { params: { days } }),

  getFraudAttempts: (limit = 50, stationId?: string) =>
    api.get('/admin/analytics/fraud', { params: { limit, stationId } }),

  getVehicleDistribution: () => api.get('/admin/analytics/vehicles'),

  // Rules
  getFuelRules: () => api.get('/admin/rules/fuel'),

  updateFuelRule: (id: string, data: Partial<{
    maxFillsPerPeriod: number;
    periodHours: number;
    maxLitersPerFill: number;
    isActive: boolean;
  }>) => api.put(`/admin/rules/fuel/${id}`, data),

  getGasBottleRules: () => api.get('/gas-bottles/rules'),

  // Users
  listUsers: (page = 1, role?: string, search?: string) =>
    api.get('/admin/users', { params: { page, role, search } }),

  updateUser: (id: string, data: { isActive?: boolean; role?: string }) =>
    api.put(`/admin/users/${id}`, data),

  // Vehicles
  listVehicles: (page = 1, search?: string, vehicleType?: string, isVerified?: string) =>
    api.get('/admin/vehicles', { params: { page, search, vehicleType, isVerified } }),

  getVehicle: (id: string) => api.get(`/admin/vehicles/${id}`),

  updateVehicle: (id: string, data: {
    isVerified?: boolean;
    isActive?: boolean;
    customMaxLitersPerFill?: number | null;
    customMaxFillsPerPeriod?: number | null;
    customPeriodHours?: number | null;
    customLimitReason?: string | null;
  }) => api.put(`/admin/vehicles/${id}`, data),

  // Verifications
  getPendingVerifications: () => api.get('/admin/verifications/pending'),

  verifyVehicle: (id: string, isVerified: boolean) =>
    api.put(`/admin/vehicles/${id}/verify`, { isVerified }),

  verifyHousehold: (id: string, isVerified: boolean) =>
    api.put(`/admin/households/${id}/verify`, { isVerified }),
};

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import OfflineIndicator from '@/components/ui/OfflineIndicator';

// Layouts
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Public Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// Citizen Pages
import CitizenDashboardPage from '@/pages/citizen/DashboardPage';
import VehiclesPage from '@/pages/citizen/VehiclesPage';
import NewVehiclePage from '@/pages/citizen/NewVehiclePage';
import HistoryPage from '@/pages/citizen/HistoryPage';

// Station Pages
import StationDashboardPage from '@/pages/station/DashboardPage';
import ScanPage from '@/pages/station/ScanPage';
import ManualLookupPage from '@/pages/station/ManualLookupPage';
import TransactionsPage from '@/pages/station/TransactionsPage';

// Admin Pages
import AdminDashboardPage from '@/pages/admin/DashboardPage';
import StationsPage from '@/pages/admin/StationsPage';
import RulesPage from '@/pages/admin/RulesPage';
import VerificationsPage from '@/pages/admin/VerificationsPage';
import UsersPage from '@/pages/admin/UsersPage';
import AdminVehiclesPage from '@/pages/admin/VehiclesPage';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <>
      <OfflineIndicator />
      <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={getDefaultPath(user?.role)} replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to={getDefaultPath(user?.role)} replace />
            ) : (
              <RegisterPage />
            )
          }
        />
      </Route>

      {/* Citizen Routes */}
      <Route element={<DashboardLayout allowedRoles={['CITIZEN']} />}>
        <Route path="/citizen/dashboard" element={<CitizenDashboardPage />} />
        <Route path="/citizen/vehicles" element={<VehiclesPage />} />
        <Route path="/citizen/vehicles/new" element={<NewVehiclePage />} />
        <Route path="/citizen/history" element={<HistoryPage />} />
        <Route path="/citizen/gas-bottles" element={<div className="text-gray-500">Gas bottles management coming soon</div>} />
      </Route>

      {/* Station Manager Routes */}
      <Route element={<DashboardLayout allowedRoles={['STATION_MANAGER', 'SUPER_ADMIN']} />}>
        <Route path="/station/dashboard" element={<StationDashboardPage />} />
        <Route path="/station/scan" element={<ScanPage />} />
        <Route path="/station/manual" element={<ManualLookupPage />} />
        <Route path="/station/transactions" element={<TransactionsPage />} />
        <Route path="/station/gas-bottles" element={<div className="text-gray-500">Gas bottles verification coming soon</div>} />
      </Route>

      {/* Admin Routes */}
      <Route element={<DashboardLayout allowedRoles={['SUPER_ADMIN']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/stations" element={<StationsPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/vehicles" element={<AdminVehiclesPage />} />
        <Route path="/admin/rules" element={<RulesPage />} />
        <Route path="/admin/verifications" element={<VerificationsPage />} />
        <Route path="/admin/analytics" element={<div className="text-gray-500">Detailed analytics coming soon</div>} />
      </Route>

      {/* Catch all - redirect to appropriate dashboard or landing */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultPath(user?.role)} replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
    </>
  );
}

function getDefaultPath(role?: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'STATION_MANAGER':
      return '/station/dashboard';
    case 'CITIZEN':
      return '/citizen/dashboard';
    default:
      return '/';
  }
}

export default App;

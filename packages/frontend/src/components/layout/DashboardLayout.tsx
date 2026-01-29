import { Outlet, Navigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuthStore } from '@/stores/authStore';

interface DashboardLayoutProps {
  allowedRoles?: string[];
}

export default function DashboardLayout({ allowedRoles }: DashboardLayoutProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'SUPER_ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      case 'STATION_MANAGER':
        return <Navigate to="/station/dashboard" replace />;
      case 'CITIZEN':
        return <Navigate to="/citizen/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      {/* Mobile: no left margin, Desktop: sidebar margin */}
      <main className="pt-16 p-4 sm:p-6 lg:ms-64 safe-area-inset">
        <Outlet />
      </main>
    </div>
  );
}

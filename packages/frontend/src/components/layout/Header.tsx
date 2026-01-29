import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/api';
import Button from '../ui/Button';
import LanguageSwitcher from '../ui/LanguageSwitcher';

export default function Header() {
  const { user, refreshToken, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore errors on logout
      }
    }
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Administrator';
      case 'STATION_MANAGER':
        return 'Station Manager';
      case 'CITIZEN':
        return 'Citizen';
      default:
        return role;
    }
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN':
        return '/admin/dashboard';
      case 'STATION_MANAGER':
        return '/station/dashboard';
      case 'CITIZEN':
        return '/citizen/dashboard';
      default:
        return '/';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40 h-16">
      <div className="flex items-center justify-between h-full px-6">
        <Link to={isAuthenticated ? getDashboardPath() : '/'} className="flex items-center">
          <img src="/logo.png" alt="BenZinouna" className="h-10 object-contain" />
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 sm:me-2" />
                <span className="hidden sm:inline">{t('auth.logout')}</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">{t('auth.login')}</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">{t('auth.register')}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

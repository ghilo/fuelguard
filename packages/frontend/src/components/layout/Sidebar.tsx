import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import {
  Home,
  Car,
  QrCode,
  History,
  Users,
  Building2,
  BarChart3,
  Shield,
  Fuel,
  Cylinder,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  labelKey: string;
  to: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  // Citizen
  { labelKey: 'nav.dashboard', to: '/citizen/dashboard', icon: Home, roles: ['CITIZEN'] },
  { labelKey: 'nav.vehicles', to: '/citizen/vehicles', icon: Car, roles: ['CITIZEN'] },
  { labelKey: 'gas.bottles', to: '/citizen/gas-bottles', icon: Cylinder, roles: ['CITIZEN'] },
  { labelKey: 'nav.transactions', to: '/citizen/history', icon: History, roles: ['CITIZEN'] },

  // Station Manager
  { labelKey: 'nav.dashboard', to: '/station/dashboard', icon: Home, roles: ['STATION_MANAGER'] },
  { labelKey: 'nav.scan', to: '/station/scan', icon: QrCode, roles: ['STATION_MANAGER'] },
  { labelKey: 'station.manualEntry', to: '/station/manual', icon: Car, roles: ['STATION_MANAGER'] },
  { labelKey: 'gas.bottles', to: '/station/gas-bottles', icon: Cylinder, roles: ['STATION_MANAGER'] },
  { labelKey: 'nav.transactions', to: '/station/transactions', icon: History, roles: ['STATION_MANAGER'] },

  // Admin
  { labelKey: 'nav.dashboard', to: '/admin/dashboard', icon: Home, roles: ['SUPER_ADMIN'] },
  { labelKey: 'nav.stations', to: '/admin/stations', icon: Building2, roles: ['SUPER_ADMIN'] },
  { labelKey: 'nav.users', to: '/admin/users', icon: Users, roles: ['SUPER_ADMIN'] },
  { labelKey: 'admin.allVehicles', to: '/admin/vehicles', icon: Car, roles: ['SUPER_ADMIN'] },
  { labelKey: 'nav.rules', to: '/admin/rules', icon: Fuel, roles: ['SUPER_ADMIN'] },
  { labelKey: 'admin.pendingVerifications', to: '/admin/verifications', icon: Shield, roles: ['SUPER_ADMIN'] },
  { labelKey: 'nav.blacklist', to: '/admin/blacklist', icon: Shield, roles: ['SUPER_ADMIN'] },
  { labelKey: 'nav.analytics', to: '/admin/analytics', icon: BarChart3, roles: ['SUPER_ADMIN'] },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const filteredItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 end-4 z-50 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'w-64 bg-white border-e border-gray-200 min-h-screen fixed top-16 z-40 transition-transform duration-300',
          'lg:translate-x-0 lg:start-0',
          isOpen ? 'translate-x-0 start-0' : '-translate-x-full start-0 rtl:translate-x-full'
        )}
      >
        <nav className="p-4 space-y-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

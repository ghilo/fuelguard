import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, Plus, QrCode, History, Cylinder, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, Button, Badge, PageLoader } from '@/components/ui';
import { citizenApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { Vehicle, Household, FuelTransaction } from '@/types';

export default function CitizenDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['citizen-profile'],
    queryFn: () => citizenApi.getProfile(),
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['citizen-transactions'],
    queryFn: () => citizenApi.getTransactions(1, 5),
  });

  if (isLoading) return <PageLoader />;

  const vehicles: Vehicle[] = profileData?.data?.user?.vehicles || [];
  const households: Household[] = profileData?.data?.user?.households || [];
  const transactions: FuelTransaction[] = transactionsData?.data?.transactions || [];

  const getVehicleTypeLabel = (type: string) => {
    return t(`citizen.vehicleTypes.${type}`) || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('auth.welcomeBack')}, {user?.fullName}!</h1>
        <p className="text-gray-500">{t('citizen.dashboardDesc')}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <Car className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
            <p className="text-sm text-gray-500">{t('nav.vehicles')}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-success-50 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {vehicles.filter((v) => v.isVerified).length}
            </p>
            <p className="text-sm text-gray-500">{t('common.verified')}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center">
            <Cylinder className="w-6 h-6 text-warning-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{households.length}</p>
            <p className="text-sm text-gray-500">{t('gas.household')}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <History className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
            <p className="text-sm text-gray-500">{t('citizen.recentTransactions')}</p>
          </div>
        </Card>
      </div>

      {/* Vehicles */}
      <Card>
        <CardHeader
          title={t('citizen.myVehicles')}
          subtitle={t('citizen.manageVehicles')}
          action={
            <Link to="/citizen/vehicles/new">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {t('citizen.addVehicle')}
              </Button>
            </Link>
          }
        />

        {vehicles.length === 0 ? (
          <div className="text-center py-8">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('citizen.noVehicles')}</p>
            <Link to="/citizen/vehicles/new">
              <Button variant="primary" size="sm" className="mt-4">
                {t('citizen.addFirstVehicle')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.slice(0, 3).map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border">
                    <Car className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{vehicle.plateNumber}</p>
                    <p className="text-sm text-gray-500">
                      {getVehicleTypeLabel(vehicle.vehicleType)} - {t(`citizen.fuelTypes.${vehicle.fuelType}`)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={vehicle.isVerified ? 'success' : 'warning'}>
                    {vehicle.isVerified ? t('common.verified') : t('common.pending')}
                  </Badge>
                  {vehicle.isVerified && (
                    <Link to={`/citizen/vehicles/${vehicle.id}/qr`}>
                      <Button variant="ghost" size="sm">
                        <QrCode className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {vehicles.length > 3 && (
              <Link
                to="/citizen/vehicles"
                className="block text-center text-primary-600 text-sm font-medium hover:text-primary-700"
              >
                {t('citizen.viewAll')} ({vehicles.length})
              </Link>
            )}
          </div>
        )}
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader
          title={t('citizen.recentTransactions')}
          subtitle={t('citizen.viewFillHistory')}
          action={
            <Link to="/citizen/history">
              <Button variant="ghost" size="sm">{t('citizen.viewAll')}</Button>
            </Link>
          }
        />

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('citizen.noTransactions')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {tx.status === 'APPROVED' ? (
                    <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-danger-50 rounded-lg flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-danger-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx.vehicle?.plateNumber || t('errors.vehicleNotFound')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tx.station?.name || t('citizen.station')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {tx.status === 'APPROVED' && tx.liters && (
                    <p className="font-semibold text-gray-900">{tx.liters}L</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QrCode, Car, CheckCircle, XCircle, Clock, Fuel, Cylinder } from 'lucide-react';
import { Card, CardHeader, Button, PageLoader } from '@/components/ui';
import { stationApi } from '@/services/api';
import type { Station, FuelTransaction } from '@/types';

export default function StationDashboardPage() {
  const { t } = useTranslation();

  const { data: stationData, isLoading: stationLoading } = useQuery({
    queryKey: ['my-station'],
    queryFn: () => stationApi.getMyStation(),
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['station-transactions'],
    queryFn: () => stationApi.getTransactions(undefined, 1),
    enabled: !!stationData?.data?.station,
  });

  if (stationLoading) return <PageLoader />;

  const station: Station | null = stationData?.data?.station || null;
  const transactions: FuelTransaction[] = transactionsData?.data?.transactions || [];

  if (!station) {
    return (
      <Card className="text-center py-12">
        <Fuel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('station.myStation')}</h3>
        <p className="text-gray-500">{t('errors.unauthorized')}</p>
      </Card>
    );
  }

  const todayStats = {
    total: transactions.length,
    approved: transactions.filter((t) => t.status === 'APPROVED').length,
    denied: transactions.filter((t) => t.status === 'DENIED').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{station.name}</h1>
        <p className="text-gray-500">{station.address}, {station.commune}, {station.wilaya}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/station/scan">
          <Card className="hover:border-primary-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                <QrCode className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('station.scanTitle')}</h3>
                <p className="text-sm text-gray-500">{t('station.scanSubtitle')}</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/station/manual">
          <Card className="hover:border-primary-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                <Car className="w-7 h-7 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('nav.manualLookup')}</h3>
                <p className="text-sm text-gray-500">{t('station.lookupByPlate')}</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/station/gas-bottles">
          <Card className="hover:border-warning-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-warning-50 rounded-xl flex items-center justify-center">
                <Cylinder className="w-7 h-7 text-warning-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('gas.bottles')}</h3>
                <p className="text-sm text-gray-500">{t('gas.household')}</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/station/transactions">
          <Card className="hover:border-gray-400 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                <Clock className="w-7 h-7 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('station.transactionsToday')}</h3>
                <p className="text-sm text-gray-500">{t('station.recentActivity')}</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Fuel className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{todayStats.total}</p>
            <p className="text-sm text-gray-500">{t('station.transactionsToday')}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-success-50 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-success-600">{todayStats.approved}</p>
            <p className="text-sm text-gray-500">{t('common.approved')}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-danger-50 rounded-lg flex items-center justify-center">
            <XCircle className="w-6 h-6 text-danger-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-danger-600">{todayStats.denied}</p>
            <p className="text-sm text-gray-500">{t('common.denied')}</p>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader
          title={t('citizen.recentTransactions')}
          subtitle={t('station.recentActivity')}
          action={
            <Link to="/station/transactions">
              <Button variant="ghost" size="sm">{t('citizen.viewAll')}</Button>
            </Link>
          }
        />

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('station.noRecentActivity')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
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
                    <p className="font-medium text-gray-900">{tx.vehicle?.plateNumber}</p>
                    <p className="text-sm text-gray-500">
                      {tx.vehicle?.owner?.fullName || t('errors.notFound')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {tx.status === 'APPROVED' && tx.liters && (
                    <p className="font-semibold text-gray-900">{tx.liters}L</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleTimeString()}
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

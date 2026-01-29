import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { History, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, Badge, PageLoader, Button } from '@/components/ui';
import { citizenApi } from '@/services/api';
import type { FuelTransaction, Pagination } from '@/types';

export default function HistoryPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['citizen-transactions', page],
    queryFn: () => citizenApi.getTransactions(page, 10),
  });

  if (isLoading) return <PageLoader />;

  const transactions: FuelTransaction[] = data?.data?.transactions || [];
  const pagination: Pagination = data?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const getVehicleTypeLabel = (type: string) => {
    return t(`citizen.vehicleTypes.${type}`) || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('citizen.transactionHistory')}</h1>
        <p className="text-gray-500">{t('citizen.viewFillHistory')}</p>
      </div>

      <Card>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('citizen.noTransactions')}</h3>
            <p className="text-gray-500">{t('citizen.noTransactionsDesc')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">{t('common.status')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">{t('citizen.vehicle')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">{t('citizen.station')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">{t('citizen.liters')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">{t('common.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Badge variant={tx.status === 'APPROVED' ? 'success' : 'danger'}>
                          {tx.status === 'APPROVED' ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {t('common.approved')}
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              {t('common.denied')}
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{tx.vehicle?.plateNumber}</p>
                          <p className="text-sm text-gray-500">
                            {tx.vehicle?.vehicleType && getVehicleTypeLabel(tx.vehicle.vehicleType)}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-gray-900">{tx.station?.name || t('errors.notFound')}</p>
                          <p className="text-sm text-gray-500">{tx.station?.code}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {tx.status === 'APPROVED' && tx.liters ? (
                          <span className="font-semibold text-gray-900">{tx.liters}L</span>
                        ) : tx.status === 'DENIED' ? (
                          <span className="text-sm text-gray-500">{tx.denialReason || t('errors.quotaExceeded')}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-gray-500">
                  {t('common.showing')} {(pagination.page - 1) * pagination.limit + 1} - {' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} {t('common.of')}{' '}
                  {pagination.total} {t('common.results')}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

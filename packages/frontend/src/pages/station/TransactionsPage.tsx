import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, CheckCircle, XCircle, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Card, CardHeader, Badge, PageLoader, Button, Select } from '@/components/ui';
import { stationApi } from '@/services/api';
import type { FuelTransaction, Pagination } from '@/types';

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['station-transactions', page, statusFilter],
    queryFn: () => stationApi.getTransactions(undefined, page, statusFilter || undefined),
  });

  if (isLoading) return <PageLoader />;

  const transactions: FuelTransaction[] = data?.data?.transactions || [];
  const pagination: Pagination = data?.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PRIVATE_CAR: 'Private Car',
      TAXI: 'Taxi',
      TRUCK: 'Truck',
      MOTORCYCLE: 'Motorcycle',
      BUS: 'Bus',
      GOVERNMENT: 'Government',
      OTHER: 'Other',
    };
    return labels[type] || type;
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'DENIED', label: 'Denied' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's Transactions</h1>
          <p className="text-gray-500">View all fuel transactions for today</p>
        </div>
        <div className="w-48">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Card>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions</h3>
            <p className="text-gray-500">No transactions found for the selected filter</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Vehicle</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Owner</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Liters</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Processed By</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">
                        {new Date(tx.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={tx.status === 'APPROVED' ? 'success' : 'danger'}>
                          {tx.status === 'APPROVED' ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Denied
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {tx.vehicle?.plateNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {tx.vehicle?.owner?.fullName || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {tx.vehicle?.vehicleType && getVehicleTypeLabel(tx.vehicle.vehicleType)}
                      </td>
                      <td className="py-3 px-4">
                        {tx.status === 'APPROVED' && tx.liters ? (
                          <span className="font-semibold text-gray-900">{tx.liters}L</span>
                        ) : tx.status === 'DENIED' ? (
                          <span className="text-sm text-danger-600">{tx.denialReason || 'N/A'}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {tx.processedBy?.fullName || '-'}
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
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} transactions
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

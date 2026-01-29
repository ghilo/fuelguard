import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Car, Home, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardHeader, Button, Badge, PageLoader } from '@/components/ui';
import { adminApi } from '@/services/api';
import type { Vehicle, Household } from '@/types';

export default function VerificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-verifications'],
    queryFn: () => adminApi.getPendingVerifications(),
  });

  const verifyVehicleMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      adminApi.verifyVehicle(id, isVerified),
    onSuccess: () => {
      toast.success('Vehicle verification updated');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-verifications'] });
    },
    onError: () => {
      toast.error('Failed to update verification');
    },
  });

  const verifyHouseholdMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      adminApi.verifyHousehold(id, isVerified),
    onSuccess: () => {
      toast.success('Household verification updated');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-verifications'] });
    },
    onError: () => {
      toast.error('Failed to update verification');
    },
  });

  if (isLoading) return <PageLoader />;

  const vehicles: (Vehicle & { owner?: { email: string; fullName: string; phone?: string } })[] = data?.data?.vehicles || [];
  const households: (Household & { owner?: { email: string; fullName: string; phone?: string } })[] = data?.data?.households || [];

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Verifications</h1>
        <p className="text-gray-500">Review and verify vehicle and household registrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center">
            <Car className="w-6 h-6 text-warning-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
            <p className="text-sm text-gray-500">Vehicles Pending</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center">
            <Home className="w-6 h-6 text-warning-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{households.length}</p>
            <p className="text-sm text-gray-500">Households Pending</p>
          </div>
        </Card>
      </div>

      {/* Pending Vehicles */}
      <Card>
        <CardHeader title="Pending Vehicles" subtitle={`${vehicles.length} vehicles awaiting verification`} />

        {vehicles.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-success-300 mx-auto mb-3" />
            <p className="text-gray-500">No pending vehicle verifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border">
                    <Car className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{vehicle.plateNumber}</p>
                    <p className="text-sm text-gray-500">
                      {getVehicleTypeLabel(vehicle.vehicleType)} - {vehicle.fuelType}
                    </p>
                    <p className="text-xs text-gray-400">
                      Owner: {vehicle.owner?.fullName} ({vehicle.owner?.email})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => verifyVehicleMutation.mutate({ id: vehicle.id, isVerified: true })}
                    isLoading={verifyVehicleMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => verifyVehicleMutation.mutate({ id: vehicle.id, isVerified: false })}
                    isLoading={verifyVehicleMutation.isPending}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pending Households */}
      <Card>
        <CardHeader title="Pending Households" subtitle={`${households.length} households awaiting verification`} />

        {households.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-success-300 mx-auto mb-3" />
            <p className="text-gray-500">No pending household verifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {households.map((household) => (
              <div
                key={household.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border">
                    <Home className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{household.fullName}</p>
                    <p className="text-sm text-gray-500">
                      {household.memberCount} members - {household.commune}, {household.wilaya}
                    </p>
                    <p className="text-xs text-gray-400">
                      Registered by: {household.owner?.fullName} ({household.owner?.email})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => verifyHouseholdMutation.mutate({ id: household.id, isVerified: true })}
                    isLoading={verifyHouseholdMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => verifyHouseholdMutation.mutate({ id: household.id, isVerified: false })}
                    isLoading={verifyHouseholdMutation.isPending}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

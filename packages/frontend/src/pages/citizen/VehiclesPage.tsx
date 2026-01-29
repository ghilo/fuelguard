import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, Plus, QrCode, Trash2, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, Button, Badge, PageLoader, Modal } from '@/components/ui';
import { citizenApi } from '@/services/api';
import type { Vehicle } from '@/types';
import { useState } from 'react';

export default function VehiclesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; vehicleId: string | null; qrCode: string | null }>({
    isOpen: false,
    vehicleId: null,
    qrCode: null,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['citizen-vehicles'],
    queryFn: () => citizenApi.getVehicles(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => citizenApi.deleteVehicle(id),
    onSuccess: () => {
      toast.success(t('citizen.vehicleDeleted'));
      queryClient.invalidateQueries({ queryKey: ['citizen-vehicles'] });
      setDeleteId(null);
    },
    onError: () => {
      toast.error(t('errors.failedToSave'));
    },
  });

  const handleShowQR = async (vehicleId: string) => {
    try {
      const response = await citizenApi.getVehicleQRCode(vehicleId);
      setQrModal({ isOpen: true, vehicleId, qrCode: response.data.qrCode });
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('errors.failedToLoad'));
    }
  };

  if (isLoading) return <PageLoader />;

  const vehicles: Vehicle[] = data?.data?.vehicles || [];

  const getVehicleTypeLabel = (type: string) => {
    return t(`citizen.vehicleTypes.${type}`) || type;
  };

  const getFuelTypeLabel = (type: string) => {
    return t(`citizen.fuelTypes.${type}`) || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('citizen.myVehicles')}</h1>
          <p className="text-gray-500">{t('citizen.manageVehicles')}</p>
        </div>
        <Link to="/citizen/vehicles/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t('citizen.addVehicle')}
          </Button>
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <Card className="text-center py-12">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('citizen.noVehicles')}</h3>
          <p className="text-gray-500 mb-6">{t('citizen.noVehiclesDesc')}</p>
          <Link to="/citizen/vehicles/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('citizen.addVehicle')}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Car className="w-6 h-6 text-primary-600" />
                </div>
                <Badge variant={vehicle.isVerified ? 'success' : 'warning'}>
                  {vehicle.isVerified ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {t('common.verified')}
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      {t('common.pending')}
                    </>
                  )}
                </Badge>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{vehicle.plateNumber}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {vehicle.brand} {vehicle.model}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('citizen.vehicleType')}:</span>
                  <span className="font-medium">{getVehicleTypeLabel(vehicle.vehicleType)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('citizen.fuelType')}:</span>
                  <span className="font-medium">{getFuelTypeLabel(vehicle.fuelType)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {vehicle.isVerified ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleShowQR(vehicle.id)}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    {t('citizen.viewQR')}
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" className="flex-1" disabled>
                    {t('citizen.verification.pendingApproval')}
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteId(vehicle.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <Modal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ isOpen: false, vehicleId: null, qrCode: null })}
        title={t('citizen.qrCode')}
        size="sm"
      >
        {qrModal.qrCode && (
          <div className="text-center">
            <img
              src={qrModal.qrCode}
              alt="Vehicle QR Code"
              className="mx-auto mb-4 rounded-lg"
            />
            <p className="text-sm text-gray-500">
              {t('citizen.showAtStation')}
            </p>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('common.delete')}
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          {t('common.confirm')}?
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setDeleteId(null)}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
          >
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

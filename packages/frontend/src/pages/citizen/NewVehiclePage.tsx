import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Car, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, Button, Input, Select } from '@/components/ui';
import { citizenApi } from '@/services/api';

interface VehicleForm {
  plateNumber: string;
  vehicleType: string;
  fuelType: string;
  brand: string;
  model: string;
}

export default function NewVehiclePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<VehicleForm>();

  const vehicleTypes = [
    { value: 'PRIVATE_CAR', label: t('citizen.vehicleTypes.PRIVATE_CAR') },
    { value: 'TAXI', label: t('citizen.vehicleTypes.TAXI') },
    { value: 'TRUCK', label: t('citizen.vehicleTypes.TRUCK') },
    { value: 'MOTORCYCLE', label: t('citizen.vehicleTypes.MOTORCYCLE') },
    { value: 'BUS', label: t('citizen.vehicleTypes.BUS') },
    { value: 'GOVERNMENT', label: t('citizen.vehicleTypes.GOVERNMENT') },
    { value: 'OTHER', label: t('citizen.vehicleTypes.OTHER') },
  ];

  const fuelTypes = [
    { value: 'ESSENCE', label: t('citizen.fuelTypes.ESSENCE') },
    { value: 'GASOIL', label: t('citizen.fuelTypes.GASOIL') },
    { value: 'GPL', label: t('citizen.fuelTypes.GPL') },
  ];

  const mutation = useMutation({
    mutationFn: (data: VehicleForm) => citizenApi.createVehicle(data),
    onSuccess: () => {
      toast.success(t('citizen.vehicleRegistered'));
      queryClient.invalidateQueries({ queryKey: ['citizen-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['citizen-profile'] });
      navigate('/citizen/vehicles');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('errors.failedToSave'));
    },
  });

  const onSubmit = (data: VehicleForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate('/citizen/vehicles')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('common.back')}
      </Button>

      <Card>
        <CardHeader
          title={t('citizen.registerNewVehicle')}
          subtitle={t('citizen.registerVehicleDesc')}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Car className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-primary-900">{t('citizen.vehicleRegistration')}</h4>
                <p className="text-sm text-primary-700 mt-1">
                  {t('citizen.registerVehicleDesc')}
                </p>
              </div>
            </div>
          </div>

          <Input
            label={t('citizen.plateNumber')}
            placeholder={t('citizen.plateFormat')}
            error={errors.plateNumber?.message}
            {...register('plateNumber', {
              required: t('auth.required'),
              pattern: {
                value: /^\d{5}-\d{3}-\d{2}$/,
                message: t('citizen.plateFormat'),
              },
            })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('citizen.vehicleType')}
              options={vehicleTypes}
              error={errors.vehicleType?.message}
              {...register('vehicleType', {
                required: t('auth.required'),
              })}
            />

            <Select
              label={t('citizen.fuelType')}
              options={fuelTypes}
              error={errors.fuelType?.message}
              {...register('fuelType', {
                required: t('auth.required'),
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`${t('citizen.brand')} (${t('common.optional')})`}
              placeholder="Renault, Peugeot..."
              {...register('brand')}
            />

            <Input
              label={`${t('citizen.model')} (${t('common.optional')})`}
              placeholder="Symbol, 208..."
              {...register('model')}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => navigate('/citizen/vehicles')}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={mutation.isPending}
            >
              {t('citizen.addVehicle')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

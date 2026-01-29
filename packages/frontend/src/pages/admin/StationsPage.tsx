import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Building2, Plus, Search, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, Button, Input, Badge, PageLoader, Modal, Select } from '@/components/ui';
import { adminApi } from '@/services/api';
import type { Station, Pagination } from '@/types';

interface StationForm {
  name: string;
  code: string;
  address: string;
  wilaya: string;
  commune: string;
}

const wilayas = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Bejaia', 'Biskra', 'Bechar',
  'Blida', 'Bouira', 'Tamanrasset', 'Tebessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
  'Djelfa', 'Jijel', 'Setif', 'Saida', 'Skikda', 'Sidi Bel Abbes', 'Annaba', 'Guelma',
  'Constantine', 'Medea', 'Mostaganem', 'MSila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
  'Illizi', 'Bordj Bou Arreridj', 'Boumerdes', 'El Tarf', 'Tindouf', 'Tissemsilt',
  'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Ain Defla', 'Naama', 'Ain Temouchent',
  'Ghardaia', 'Relizane',
].map(w => ({ value: w, label: w }));

export default function StationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StationForm>();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stations', page, search],
    queryFn: () => adminApi.listStations(page, search || undefined),
  });

  const createMutation = useMutation({
    mutationFn: (data: StationForm) => adminApi.createStation(data),
    onSuccess: () => {
      toast.success('Station created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-stations'] });
      setShowCreateModal(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create station');
    },
  });

  if (isLoading) return <PageLoader />;

  const stations: Station[] = data?.data?.stations || [];
  const pagination: Pagination = data?.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const onSubmit = (data: StationForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stations</h1>
          <p className="text-gray-500">Manage fuel stations</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Station
        </Button>
      </div>

      {/* Search */}
      <Card padding="sm">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Stations Grid */}
      {stations.length === 0 ? (
        <Card className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stations found</h3>
          <p className="text-gray-500">Add your first station to get started</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map((station) => (
              <Card key={station.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary-600" />
                  </div>
                  <Badge variant={station.isActive ? 'success' : 'gray'}>
                    {station.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <h3 className="font-bold text-gray-900 mb-1">{station.name}</h3>
                <p className="text-sm text-gray-500 mb-4">Code: {station.code}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{station.commune}, {station.wilaya}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{station._count?.managers || 0} managers</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                  <span className="text-gray-500">Transactions</span>
                  <span className="font-semibold">{station._count?.fuelTransactions || 0}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} stations
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

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Station"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Station Name"
            placeholder="e.g., Station Naftal Alger Centre"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />

          <Input
            label="Station Code"
            placeholder="e.g., ALG-001"
            error={errors.code?.message}
            {...register('code', { required: 'Code is required' })}
          />

          <Input
            label="Address"
            placeholder="Full address"
            error={errors.address?.message}
            {...register('address', { required: 'Address is required' })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Wilaya"
              options={wilayas}
              error={errors.wilaya?.message}
              {...register('wilaya', { required: 'Wilaya is required' })}
            />

            <Input
              label="Commune"
              placeholder="e.g., Alger Centre"
              error={errors.commune?.message}
              {...register('commune', { required: 'Commune is required' })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={createMutation.isPending}
            >
              Create Station
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

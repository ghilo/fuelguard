import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, Search, CheckCircle, XCircle, Clock, User, Fuel, Edit, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, Button, Input, Badge, PageLoader, Modal } from '@/components/ui';
import { adminApi } from '@/services/api';

interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: string;
  fuelType: string;
  brand: string | null;
  model: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  customMaxLitersPerFill: number | null;
  customMaxFillsPerPeriod: number | null;
  customPeriodHours: number | null;
  customLimitReason: string | null;
  owner: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
  };
  _count: {
    transactions: number;
  };
}

interface EditModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isLoading: boolean;
  defaultRule: { maxLitersPerFill: number; maxFillsPerPeriod: number; periodHours: number } | null;
}

function EditVehicleModal({ vehicle, isOpen, onClose, onSave, isLoading, defaultRule }: EditModalProps) {
  const [formData, setFormData] = useState({
    plateNumber: '',
    vehicleType: '',
    fuelType: '',
    brand: '',
    model: '',
    customMaxLitersPerFill: '',
    customMaxFillsPerPeriod: '',
    customPeriodHours: '',
    customLimitReason: '',
    isVerified: true,
    isActive: true,
  });

  // Update form when vehicle changes
  useEffect(() => {
    if (vehicle) {
      setFormData({
        plateNumber: vehicle.plateNumber || '',
        vehicleType: vehicle.vehicleType || '',
        fuelType: vehicle.fuelType || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        customMaxLitersPerFill: vehicle.customMaxLitersPerFill?.toString() || '',
        customMaxFillsPerPeriod: vehicle.customMaxFillsPerPeriod?.toString() || '',
        customPeriodHours: vehicle.customPeriodHours?.toString() || '',
        customLimitReason: vehicle.customLimitReason || '',
        isVerified: vehicle.isVerified,
        isActive: vehicle.isActive,
      });
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      plateNumber: formData.plateNumber,
      vehicleType: formData.vehicleType,
      fuelType: formData.fuelType,
      brand: formData.brand || null,
      model: formData.model || null,
      customMaxLitersPerFill: formData.customMaxLitersPerFill ? parseFloat(formData.customMaxLitersPerFill) : null,
      customMaxFillsPerPeriod: formData.customMaxFillsPerPeriod ? parseInt(formData.customMaxFillsPerPeriod) : null,
      customPeriodHours: formData.customPeriodHours ? parseInt(formData.customPeriodHours) : null,
      customLimitReason: formData.customLimitReason || null,
      isVerified: formData.isVerified,
      isActive: formData.isActive,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Vehicle" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Owner Info (read-only) */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Owner Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="ml-2 font-medium">{vehicle.owner.fullName}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 font-medium">{vehicle.owner.email}</span>
            </div>
          </div>
        </div>

        {/* Editable Vehicle Info */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Vehicle Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Plate Number"
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
              placeholder="00000-000-00"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                required
              >
                <option value="PRIVATE_CAR">Private Car</option>
                <option value="TAXI">Taxi</option>
                <option value="TRUCK">Truck</option>
                <option value="MOTORCYCLE">Motorcycle</option>
                <option value="BUS">Bus</option>
                <option value="GOVERNMENT">Government</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                required
              >
                <option value="ESSENCE">Gasoline (Essence)</option>
                <option value="GASOIL">Diesel (Gasoil)</option>
                <option value="GPL">LPG (GPL)</option>
              </select>
            </div>
            <Input
              label="Brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="e.g., Renault, Peugeot..."
            />
            <Input
              label="Model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g., Clio, 208..."
            />
          </div>
        </div>

        {/* Default Rules Info */}
        {defaultRule && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Default Rules (for {vehicle.vehicleType})</h4>
            <div className="grid grid-cols-3 gap-4 text-sm text-blue-800">
              <div>
                <span className="text-blue-600">Max Liters:</span>
                <span className="ml-2 font-medium">{defaultRule.maxLitersPerFill}L</span>
              </div>
              <div>
                <span className="text-blue-600">Max Fills:</span>
                <span className="ml-2 font-medium">{defaultRule.maxFillsPerPeriod}</span>
              </div>
              <div>
                <span className="text-blue-600">Period:</span>
                <span className="ml-2 font-medium">{defaultRule.periodHours}h</span>
              </div>
            </div>
          </div>
        )}

        {/* Custom Limits */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Custom Fuel Limits (leave empty to use default)</h4>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Max Liters per Fill"
              type="number"
              step="0.1"
              value={formData.customMaxLitersPerFill}
              onChange={(e) => setFormData({ ...formData, customMaxLitersPerFill: e.target.value })}
              placeholder={defaultRule?.maxLitersPerFill.toString() || ''}
            />
            <Input
              label="Max Fills per Period"
              type="number"
              value={formData.customMaxFillsPerPeriod}
              onChange={(e) => setFormData({ ...formData, customMaxFillsPerPeriod: e.target.value })}
              placeholder={defaultRule?.maxFillsPerPeriod.toString() || ''}
            />
            <Input
              label="Period (hours)"
              type="number"
              value={formData.customPeriodHours}
              onChange={(e) => setFormData({ ...formData, customPeriodHours: e.target.value })}
              placeholder={defaultRule?.periodHours.toString() || ''}
            />
          </div>
        </div>

        {/* Reason for custom limit */}
        <Input
          label="Reason for Custom Limit"
          value={formData.customLimitReason}
          onChange={(e) => setFormData({ ...formData, customLimitReason: e.target.value })}
          placeholder="e.g., Medical needs, Business exception, Special permit..."
        />

        {/* Status toggles */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isVerified}
              onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm font-medium">Verified</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function VehiclesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [defaultRule, setDefaultRule] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vehicles', page, search, vehicleTypeFilter, verifiedFilter],
    queryFn: () =>
      adminApi.listVehicles(
        page,
        search || undefined,
        vehicleTypeFilter || undefined,
        verifiedFilter || undefined
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.updateVehicle(id, data),
    onSuccess: () => {
      toast.success('Vehicle updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      setEditVehicle(null);
    },
    onError: () => {
      toast.error('Failed to update vehicle');
    },
  });

  const handleEdit = async (vehicle: Vehicle) => {
    try {
      const response = await adminApi.getVehicle(vehicle.id);
      setEditVehicle(response.data.vehicle);
      setDefaultRule(response.data.fuelRule);
    } catch {
      toast.error('Failed to load vehicle details');
    }
  };

  if (isLoading) return <PageLoader />;

  const vehicles: Vehicle[] = data?.data?.vehicles || [];
  const pagination = data?.data?.pagination || { page: 1, totalPages: 1, total: 0 };

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

  const getFuelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ESSENCE: 'Petrol',
      GASOIL: 'Diesel',
      GPL: 'LPG',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vehicles Management</h1>
        <p className="text-gray-500">View and manage all registered vehicles</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by plate number or owner..."
              className="pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            value={vehicleTypeFilter}
            onChange={(e) => {
              setVehicleTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            <option value="PRIVATE_CAR">Private Car</option>
            <option value="TAXI">Taxi</option>
            <option value="TRUCK">Truck</option>
            <option value="MOTORCYCLE">Motorcycle</option>
            <option value="BUS">Bus</option>
            <option value="GOVERNMENT">Government</option>
            <option value="OTHER">Other</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="true">Verified</option>
            <option value="false">Pending</option>
          </select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <Car className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            <p className="text-sm text-gray-500">Total Vehicles</p>
          </div>
        </Card>
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader title="All Vehicles" subtitle={`${pagination.total} vehicles found`} />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Vehicle</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Owner</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Limits</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{vehicle.plateNumber}</p>
                      <p className="text-sm text-gray-500">
                        {vehicle.brand} {vehicle.model}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium">{getVehicleTypeLabel(vehicle.vehicleType)}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Fuel className="w-3 h-3" />
                        {getFuelTypeLabel(vehicle.fuelType)}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{vehicle.owner.fullName}</p>
                        <p className="text-xs text-gray-500">{vehicle.owner.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {vehicle.customMaxLitersPerFill ? (
                      <div>
                        <Badge variant="warning">
                          <Settings className="w-3 h-3 mr-1" />
                          Custom
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {vehicle.customMaxLitersPerFill}L max
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Default</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {vehicle.isVerified ? (
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(vehicle)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {vehicles.length === 0 && (
          <div className="text-center py-8 text-gray-500">No vehicles found</div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <EditVehicleModal
        vehicle={editVehicle}
        isOpen={!!editVehicle}
        onClose={() => setEditVehicle(null)}
        onSave={(data) => editVehicle && updateMutation.mutate({ id: editVehicle.id, data })}
        isLoading={updateMutation.isPending}
        defaultRule={defaultRule}
      />
    </div>
  );
}

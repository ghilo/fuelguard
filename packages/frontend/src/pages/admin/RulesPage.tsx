import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Fuel, Clock, Droplets, Edit, Check, X } from 'lucide-react';
import { Card, CardHeader, Button, Input, Badge, PageLoader, Modal } from '@/components/ui';
import { adminApi } from '@/services/api';
import type { FuelRule } from '@/types';

export default function RulesPage() {
  const [editingRule, setEditingRule] = useState<FuelRule | null>(null);
  const [formData, setFormData] = useState({ maxFillsPerPeriod: 0, periodHours: 0, maxLitersPerFill: 0 });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-fuel-rules'],
    queryFn: () => adminApi.getFuelRules(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateFuelRule(id, data),
    onSuccess: () => {
      toast.success('Rule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-fuel-rules'] });
      setEditingRule(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update rule');
    },
  });

  if (isLoading) return <PageLoader />;

  const rules: FuelRule[] = data?.data?.rules || [];

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PRIVATE_CAR: 'Private Car',
      TAXI: 'Taxi',
      TRUCK: 'Truck',
      MOTORCYCLE: 'Motorcycle',
      BUS: 'Bus',
      GOVERNMENT: 'Government Vehicle',
      OTHER: 'Other',
    };
    return labels[type] || type;
  };

  const getVehicleTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      PRIVATE_CAR: '🚗',
      TAXI: '🚕',
      TRUCK: '🚛',
      MOTORCYCLE: '🏍️',
      BUS: '🚌',
      GOVERNMENT: '🚔',
      OTHER: '🚙',
    };
    return icons[type] || '🚗';
  };

  const handleEdit = (rule: FuelRule) => {
    setEditingRule(rule);
    setFormData({
      maxFillsPerPeriod: rule.maxFillsPerPeriod,
      periodHours: rule.periodHours,
      maxLitersPerFill: rule.maxLitersPerFill,
    });
  };

  const handleSave = () => {
    if (!editingRule) return;
    updateMutation.mutate({ id: editingRule.id, data: formData });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fuel Rules</h1>
        <p className="text-gray-500">Configure fuel quota rules for each vehicle type</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getVehicleTypeIcon(rule.vehicleType)}</span>
                <div>
                  <h3 className="font-bold text-gray-900">{getVehicleTypeLabel(rule.vehicleType)}</h3>
                  <Badge variant={rule.isActive ? 'success' : 'gray'}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                <Edit className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Max fills per period</span>
                </div>
                <span className="font-semibold">{rule.maxFillsPerPeriod}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Period</span>
                </div>
                <span className="font-semibold">{rule.periodHours} hours</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-primary-600" />
                  <span className="text-sm text-primary-700">Max liters per fill</span>
                </div>
                <span className="font-bold text-primary-700">{rule.maxLitersPerFill}L</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingRule}
        onClose={() => setEditingRule(null)}
        title={`Edit ${editingRule && getVehicleTypeLabel(editingRule.vehicleType)} Rules`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Max Fills Per Period"
            type="number"
            value={formData.maxFillsPerPeriod}
            onChange={(e) => setFormData({ ...formData, maxFillsPerPeriod: parseInt(e.target.value) })}
            min={1}
          />

          <Input
            label="Period (Hours)"
            type="number"
            value={formData.periodHours}
            onChange={(e) => setFormData({ ...formData, periodHours: parseInt(e.target.value) })}
            min={1}
          />

          <Input
            label="Max Liters Per Fill"
            type="number"
            value={formData.maxLitersPerFill}
            onChange={(e) => setFormData({ ...formData, maxLitersPerFill: parseFloat(e.target.value) })}
            min={1}
            step={0.5}
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setEditingRule(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

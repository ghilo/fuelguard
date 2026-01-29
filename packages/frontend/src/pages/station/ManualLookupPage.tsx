import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Search, CheckCircle, XCircle, Car, Clock, Fuel, User } from 'lucide-react';
import { Card, CardHeader, Button, Input, Modal } from '@/components/ui';
import { stationApi } from '@/services/api';
import type { VerificationResult } from '@/types';

interface SearchForm {
  plateNumber: string;
}

export default function ManualLookupPage() {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [liters, setLiters] = useState('');
  const [denyReason, setDenyReason] = useState('');
  const [showDenyModal, setShowDenyModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SearchForm>();

  const searchMutation = useMutation({
    mutationFn: (plateNumber: string) => stationApi.manualLookup(plateNumber),
    onSuccess: (response) => {
      setResult(response.data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Vehicle not found');
      setResult(null);
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ vehicleId, liters }: { vehicleId: string; liters: number }) =>
      stationApi.approveTransaction(vehicleId, liters),
    onSuccess: () => {
      toast.success('Transaction approved!');
      resetSearch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve');
    },
  });

  const denyMutation = useMutation({
    mutationFn: ({ vehicleId, reason }: { vehicleId: string; reason: string }) =>
      stationApi.denyTransaction(vehicleId, reason),
    onSuccess: () => {
      toast.success('Transaction denied');
      resetSearch();
      setShowDenyModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to deny');
    },
  });

  const onSubmit = (data: SearchForm) => {
    searchMutation.mutate(data.plateNumber);
  };

  const resetSearch = () => {
    setResult(null);
    setLiters('');
    setDenyReason('');
    reset();
  };

  const handleApprove = () => {
    if (!result?.vehicle || !liters) return;
    const litersNum = parseFloat(liters);
    if (isNaN(litersNum) || litersNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (result.quota?.maxLitersAllowed && litersNum > result.quota.maxLitersAllowed) {
      toast.error(`Cannot exceed ${result.quota.maxLitersAllowed}L`);
      return;
    }
    approveMutation.mutate({ vehicleId: result.vehicle.id, liters: litersNum });
  };

  const handleDeny = () => {
    if (!result?.vehicle || !denyReason) return;
    denyMutation.mutate({ vehicleId: result.vehicle.id, reason: denyReason });
  };

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manual Lookup</h1>
        <p className="text-gray-500">Search for a vehicle by plate number</p>
      </div>

      {/* Search Form */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Enter plate number (e.g., 00123-123-16)"
              error={errors.plateNumber?.message}
              {...register('plateNumber', {
                required: 'Plate number is required',
              })}
            />
          </div>
          <Button type="submit" isLoading={searchMutation.isPending}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </form>
      </Card>

      {result && result.type === 'vehicle' && (
        <div className="space-y-4">
          {/* Eligibility Status */}
          <Card className={result.eligible ? 'border-success-500 bg-success-50' : 'border-danger-500 bg-danger-50'}>
            <div className="flex items-center gap-4">
              {result.eligible ? (
                <div className="w-14 h-14 bg-success-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success-600" />
                </div>
              ) : (
                <div className="w-14 h-14 bg-danger-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-danger-600" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {result.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                </h3>
                {!result.eligible && (
                  <p className="text-danger-700">{result.reason}</p>
                )}
                {result.nextEligibleAt && (
                  <p className="text-sm text-gray-600">
                    Next eligible: {new Date(result.nextEligibleAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Vehicle Info */}
          <Card>
            <CardHeader title="Vehicle Information" />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Car className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Plate Number</p>
                  <p className="font-bold text-lg">{result.vehicle?.plateNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  <p className="font-medium">{result.vehicle?.owner?.fullName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Fuel className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Vehicle Type</p>
                  <p className="font-medium">{result.vehicle && getVehicleTypeLabel(result.vehicle.vehicleType)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Quota Status</p>
                  <p className="font-medium">
                    {result.quota?.fillsInPeriod}/{result.quota?.maxFillsAllowed} fills
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quota Info */}
          <Card>
            <CardHeader title="Quota Limits" />
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <div>
                <p className="text-sm text-primary-700">Maximum Liters Allowed</p>
                <p className="text-3xl font-bold text-primary-900">{result.quota?.maxLitersAllowed}L</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-700">Period</p>
                <p className="font-medium text-primary-900">{result.quota?.periodHours} hours</p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          {result.eligible && (
            <Card>
              <CardHeader title="Process Transaction" />
              <div className="space-y-4">
                <Input
                  label={`Enter Liters (max ${result.quota?.maxLitersAllowed}L)`}
                  type="number"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  placeholder="e.g., 30"
                  min="0.1"
                  max={result.quota?.maxLitersAllowed}
                  step="0.1"
                />
                <div className="flex gap-3">
                  <Button
                    variant="success"
                    className="flex-1"
                    onClick={handleApprove}
                    isLoading={approveMutation.isPending}
                    disabled={!liters}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => setShowDenyModal(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Deny
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {!result.eligible && (
            <Card>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    setDenyReason(result.reason || 'Quota exceeded');
                    if (result.vehicle) {
                      denyMutation.mutate({
                        vehicleId: result.vehicle.id,
                        reason: result.reason || 'Quota exceeded',
                      });
                    }
                  }}
                  isLoading={denyMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Record Denial
                </Button>
                <Button variant="secondary" className="flex-1" onClick={resetSearch}>
                  New Search
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Deny Modal */}
      <Modal
        isOpen={showDenyModal}
        onClose={() => setShowDenyModal(false)}
        title="Deny Transaction"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Reason for Denial"
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            placeholder="Enter reason..."
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowDenyModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDeny}
              isLoading={denyMutation.isPending}
              disabled={!denyReason}
            >
              Deny
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { QrCode, CheckCircle, XCircle, AlertTriangle, Car, Clock, Fuel } from 'lucide-react';
import { Card, CardHeader, Button, Input, Modal } from '@/components/ui';
import { stationApi } from '@/services/api';
import type { VerificationResult } from '@/types';

export default function ScanPage() {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<VerificationResult | null>(null);
  const [liters, setLiters] = useState('');
  const [denyReason, setDenyReason] = useState('');
  const [showDenyModal, setShowDenyModal] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const scanMutation = useMutation({
    mutationFn: (qrContent: string) => stationApi.scanQR(qrContent),
    onSuccess: (response) => {
      setScanResult(response.data);
      setIsScanning(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('errors.invalidQrCode'));
      if (scannerRef.current && !scannerRef.current.isScanning) {
        scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => scanMutation.mutate(decodedText),
          () => {}
        ).catch(() => {});
      }
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ vehicleId, liters }: { vehicleId: string; liters: number }) =>
      stationApi.approveTransaction(vehicleId, liters),
    onSuccess: () => {
      toast.success(t('station.transaction.approved'));
      resetScan();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('errors.failedToSave'));
    },
  });

  const denyMutation = useMutation({
    mutationFn: ({ vehicleId, reason }: { vehicleId: string; reason: string }) =>
      stationApi.denyTransaction(vehicleId, reason),
    onSuccess: () => {
      toast.success(t('station.transaction.denied'));
      resetScan();
      setShowDenyModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('errors.failedToSave'));
    },
  });

  useEffect(() => {
    if (isScanning) {
      scannerRef.current = new Html5Qrcode('qr-reader');

      scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          scanMutation.mutate(decodedText);
          if (scannerRef.current) {
            scannerRef.current.stop().catch(() => {});
          }
        },
        () => {}
      ).catch((err) => {
        console.error('Scanner error:', err);
        toast.error(t('errors.serverError'));
        setIsScanning(false);
      });
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isScanning]);

  const resetScan = () => {
    setScanResult(null);
    setLiters('');
    setDenyReason('');
    setIsScanning(false);
  };

  const handleApprove = () => {
    if (!scanResult?.vehicle || !liters) return;
    const litersNum = parseFloat(liters);
    if (isNaN(litersNum) || litersNum <= 0) {
      toast.error(t('errors.validationError'));
      return;
    }
    if (scanResult.quota?.maxLitersAllowed && litersNum > scanResult.quota.maxLitersAllowed) {
      toast.error(`${t('station.quota.maxLiters')}: ${scanResult.quota.maxLitersAllowed}L`);
      return;
    }
    approveMutation.mutate({ vehicleId: scanResult.vehicle.id, liters: litersNum });
  };

  const handleDeny = () => {
    if (!scanResult?.vehicle || !denyReason) return;
    denyMutation.mutate({ vehicleId: scanResult.vehicle.id, reason: denyReason });
  };

  const getVehicleTypeLabel = (type: string) => {
    return t(`citizen.vehicleTypes.${type}`) || type;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('station.scanTitle')}</h1>
        <p className="text-gray-500">{t('station.scanSubtitle')}</p>
      </div>

      {!scanResult && !isScanning && (
        <Card className="text-center py-12">
          <QrCode className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('station.scanTitle')}</h3>
          <p className="text-gray-500 mb-6">{t('station.scanSubtitle')}</p>
          <Button onClick={() => setIsScanning(true)} size="lg">
            <QrCode className="w-5 h-5 mr-2" />
            {t('station.startScan')}
          </Button>
        </Card>
      )}

      {isScanning && !scanResult && (
        <Card>
          <CardHeader title={t('common.loading')} subtitle={t('station.scanSubtitle')} />
          <div id="qr-reader" className="w-full" style={{ minHeight: '300px' }}></div>
          <div className="mt-4 text-center">
            <Button variant="secondary" onClick={() => {
              if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(() => {});
              }
              setIsScanning(false);
            }}>
              {t('common.cancel')}
            </Button>
          </div>
        </Card>
      )}

      {scanResult && scanResult.type === 'vehicle' && (
        <div className="space-y-4">
          {/* Eligibility Status */}
          <Card className={
            scanResult.status === 'APPROVED' ? 'border-success-500 bg-success-50' :
            scanResult.status === 'WARNING' ? 'border-warning-500 bg-warning-50' :
            'border-danger-500 bg-danger-50'
          }>
            <div className="flex items-center gap-4">
              {scanResult.status === 'APPROVED' && (
                <div className="w-14 h-14 bg-success-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success-600" />
                </div>
              )}
              {scanResult.status === 'WARNING' && (
                <div className="w-14 h-14 bg-warning-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-warning-600" />
                </div>
              )}
              {scanResult.status === 'DENIED' && (
                <div className="w-14 h-14 bg-danger-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-danger-600" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {scanResult.status === 'APPROVED' && t('station.eligibility.approved')}
                  {scanResult.status === 'WARNING' && t('station.eligibility.warning')}
                  {scanResult.status === 'DENIED' && t('station.eligibility.denied')}
                </h3>
                {scanResult.reason && (
                  <p className={
                    scanResult.status === 'APPROVED' ? 'text-success-700' :
                    scanResult.status === 'WARNING' ? 'text-warning-700' :
                    'text-danger-700'
                  }>{scanResult.reason}</p>
                )}
                {scanResult.nextEligibleAt && (
                  <p className="text-sm text-gray-600">
                    {t('station.quota.nextEligible')}: {new Date(scanResult.nextEligibleAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Warning/Blacklist Info */}
          {(scanResult.blacklistInfo?.isBlacklisted || scanResult.vehicle?.owner?.isFlagged) && (
            <Card className="border-warning-500 bg-warning-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-warning-800">{t('common.warning')}</h4>
                  {scanResult.blacklistInfo?.isBlacklisted && (
                    <p className="text-sm text-warning-700">
                      {scanResult.blacklistInfo.reason} ({scanResult.blacklistInfo.severity})
                    </p>
                  )}
                  {scanResult.vehicle?.owner?.isFlagged && (
                    <p className="text-sm text-warning-700">
                      {scanResult.vehicle.owner.flagReason}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Vehicle Info */}
          <Card>
            <CardHeader title={t('station.vehicleInfo')} />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Car className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">{t('citizen.plateNumber')}</p>
                  <p className="font-bold text-lg">{scanResult.vehicle?.plateNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Fuel className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">{t('citizen.vehicleType')}</p>
                  <p className="font-medium">{scanResult.vehicle && getVehicleTypeLabel(scanResult.vehicle.vehicleType)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Fuel className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">{t('citizen.fuelType')}</p>
                  <p className="font-medium">{scanResult.vehicle && t(`citizen.fuelTypes.${scanResult.vehicle.fuelType}`)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">{t('station.quota.fillsUsed')}</p>
                  <p className="font-medium">
                    {scanResult.quota?.fillsInPeriod}/{scanResult.quota?.maxFillsAllowed}
                  </p>
                </div>
              </div>
            </div>
            {scanResult.vehicle?.owner && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{t('admin.owner')}</p>
                <p className="font-medium">{scanResult.vehicle.owner.fullName}</p>
              </div>
            )}
            {scanResult.lastFillDate && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">{t('citizen.lastFill')}</p>
                <p className="font-medium text-blue-800">
                  {new Date(scanResult.lastFillDate).toLocaleString()}
                  {scanResult.lastFillLiters && ` - ${scanResult.lastFillLiters}L`}
                </p>
              </div>
            )}
          </Card>

          {/* Quota Info */}
          <Card>
            <CardHeader title={t('station.quota.quotaInfo')} />
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <div>
                <p className="text-sm text-primary-700">{t('station.quota.maxLiters')}</p>
                <p className="text-3xl font-bold text-primary-900">{scanResult.quota?.maxLitersAllowed}L</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-700">{t('station.quota.period')}</p>
                <p className="font-medium text-primary-900">{scanResult.quota?.periodHours}h</p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          {scanResult.eligible && (
            <Card>
              <CardHeader
                title={t('station.transaction.record')}
                subtitle={scanResult.status === 'WARNING' ? t('station.eligibility.warning') : undefined}
              />
              <div className="space-y-4">
                <Input
                  label={`${t('station.transaction.enterLiters')} (max ${scanResult.quota?.maxLitersAllowed}L)`}
                  type="number"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  placeholder="30"
                  min="0.1"
                  max={scanResult.quota?.maxLitersAllowed}
                  step="0.1"
                />
                <div className="flex gap-3">
                  <Button
                    variant={scanResult.status === 'WARNING' ? 'warning' : 'success'}
                    className="flex-1"
                    onClick={handleApprove}
                    isLoading={approveMutation.isPending}
                    disabled={!liters}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('station.transaction.approve')}
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => setShowDenyModal(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {t('station.transaction.deny')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {!scanResult.eligible && (
            <Card>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    setDenyReason(scanResult.reason || t('errors.quotaExceeded'));
                    if (scanResult.vehicle) {
                      denyMutation.mutate({
                        vehicleId: scanResult.vehicle.id,
                        reason: scanResult.reason || t('errors.quotaExceeded'),
                      });
                    }
                  }}
                  isLoading={denyMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('station.transaction.deny')}
                </Button>
                <Button variant="secondary" className="flex-1" onClick={resetScan}>
                  {t('station.startScan')}
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
        title={t('station.transaction.deny')}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label={t('station.transaction.denyReason')}
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            placeholder={t('station.transaction.reasonForDenial')}
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowDenyModal(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDeny}
              isLoading={denyMutation.isPending}
              disabled={!denyReason}
            >
              {t('station.transaction.deny')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

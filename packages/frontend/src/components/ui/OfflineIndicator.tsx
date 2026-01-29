import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';
import useOnlineStatus from '@/hooks/useOnlineStatus';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div className="offline-banner flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4" />
      <span>{t('errors.networkError')}</span>
    </div>
  );
}

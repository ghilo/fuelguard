import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, QrCode, BarChart3, Car } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

export default function LandingPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN':
        return '/admin/dashboard';
      case 'STATION_MANAGER':
        return '/station/dashboard';
      case 'CITIZEN':
        return '/citizen/dashboard';
      default:
        return '/login';
    }
  };

  const quotaRules = [
    { type: t('landing.privateCar'), emoji: '🚗', fills: `1 ${t('landing.fillPer')} 72${t('landing.hours')}`, liters: `50L ${t('landing.max')}` },
    { type: t('landing.taxi'), emoji: '🚕', fills: `2 ${t('landing.fillsPer')} 24${t('landing.hours')}`, liters: `40L ${t('landing.each')}` },
    { type: t('landing.truck'), emoji: '🚛', fills: `1 ${t('landing.fillPer')} 48${t('landing.hours')}`, liters: `200L ${t('landing.max')}` },
    { type: t('landing.motorcycle'), emoji: '🏍️', fills: `1 ${t('landing.fillPer')} 72${t('landing.hours')}`, liters: `15L ${t('landing.max')}` },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(to bottom right, #016C2C, #014d1f)' }} className="text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <img src="/logo.png" alt="BenZinouna" className="w-24 h-24 object-contain mx-auto mb-8" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {t('landing.title')}
          </h1>
          <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-2xl mx-auto">
            {t('landing.subtitle')}
          </p>
          <p className="text-lg text-green-200 mb-10 max-w-xl mx-auto">
            {t('landing.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to={getDashboardPath()}>
                <Button size="lg" className="bg-white text-green-800 hover:bg-green-50 font-semibold">
                  {t('nav.goToDashboard')}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="text-green-800 font-semibold" style={{ backgroundColor: '#F77B01', color: 'white' }}>
                    {t('landing.registerAsCitizen')}
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white/20 font-semibold">
                    {t('auth.signIn')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {t('landing.howItWorks')}
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            {t('landing.completeSolution')}
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: '#016C2C20' }}>
                <Car className="w-7 h-7" style={{ color: '#016C2C' }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.registerVehicle')}</h3>
              <p className="text-gray-600">
                {t('landing.registerVehicleDesc')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: '#F77B0120' }}>
                <QrCode className="w-7 h-7" style={{ color: '#F77B01' }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.qrVerification')}</h3>
              <p className="text-gray-600">
                {t('landing.qrVerificationDesc')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: '#016C2C20' }}>
                <Shield className="w-7 h-7" style={{ color: '#016C2C' }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.fraudPrevention')}</h3>
              <p className="text-gray-600">
                {t('landing.fraudPreventionDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quota Rules Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {t('landing.fuelQuotaRules')}
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            {t('landing.fairDistribution')}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quotaRules.map((rule) => (
              <div key={rule.type} className="bg-white p-6 rounded-xl border border-gray-200 text-center">
                <span className="text-4xl mb-4 block">{rule.emoji}</span>
                <h3 className="font-bold text-gray-900 mb-2">{rule.type}</h3>
                <p className="text-sm text-gray-600">{rule.fills}</p>
                <p className="text-lg font-semibold" style={{ color: '#016C2C' }}>{rule.liters}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Station Managers */}
      <section className="py-20 px-4" style={{ backgroundColor: '#016C2C10' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t('landing.forStationManagers')}
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <QrCode className="w-6 h-6 mt-0.5" style={{ color: '#016C2C' }} />
                  <div>
                    <h4 className="font-semibold text-gray-900">{t('landing.quickQrScanning')}</h4>
                    <p className="text-gray-600">{t('landing.quickQrScanningDesc')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-6 h-6 mt-0.5" style={{ color: '#F77B01' }} />
                  <div>
                    <h4 className="font-semibold text-gray-900">{t('landing.instantVerification')}</h4>
                    <p className="text-gray-600">{t('landing.instantVerificationDesc')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <BarChart3 className="w-6 h-6 mt-0.5" style={{ color: '#016C2C' }} />
                  <div>
                    <h4 className="font-semibold text-gray-900">{t('landing.transactionHistory')}</h4>
                    <p className="text-gray-600">{t('landing.transactionHistoryDesc')}</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <QrCode className="w-20 h-20 text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="BenZinouna" className="h-12 object-contain" />
          </div>
          <p className="text-sm">
            {t('landing.footer')}
          </p>
          <p className="text-xs mt-4">
            {t('landing.builtFor')}
          </p>
        </div>
      </footer>
    </div>
  );
}

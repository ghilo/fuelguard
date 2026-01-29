import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail, Lock } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data.email, data.password);
      const { user, accessToken, refreshToken } = response.data;

      setAuth(user, accessToken, refreshToken);
      toast.success(t('auth.loginSuccess'));

      // Redirect based on role
      switch (user.role) {
        case 'SUPER_ADMIN':
          navigate('/admin/dashboard');
          break;
        case 'STATION_MANAGER':
          navigate('/station/dashboard');
          break;
        case 'CITIZEN':
          navigate('/citizen/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('auth.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="BenZinouna" className="w-32 h-32 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.welcomeBack')}</h1>
          <p className="text-gray-500 mt-1">{t('auth.signInToAccount')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
            <Input
              label={t('auth.email')}
              type="email"
              className="pl-10"
              placeholder={t('auth.enterEmail')}
              error={errors.email?.message}
              {...register('email', {
                required: t('auth.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('auth.invalidEmail'),
                },
              })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
            <Input
              label={t('auth.password')}
              type="password"
              className="pl-10"
              placeholder={t('auth.enterPassword')}
              error={errors.password?.message}
              {...register('password', {
                required: t('auth.passwordRequired'),
                minLength: {
                  value: 6,
                  message: t('auth.passwordMinLength'),
                },
              })}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            {t('auth.signIn')}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            {t('auth.registerHere')}
          </Link>
        </p>
      </Card>
    </div>
  );
}

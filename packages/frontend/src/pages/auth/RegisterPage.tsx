import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Phone, CreditCard } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone?: string;
  nationalId?: string;
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        nationalId: data.nationalId,
      });

      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(t('auth.registerSuccess'));
      navigate('/citizen/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('auth.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="BenZinouna" className="w-32 h-32 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.createAccount')}</h1>
          <p className="text-gray-500 mt-1">{t('auth.registerForAccess')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
            <Input
              label={t('auth.fullName')}
              className="pl-10"
              placeholder={t('auth.enterFullName')}
              error={errors.fullName?.message}
              {...register('fullName', {
                required: t('auth.fullNameRequired'),
              })}
            />
          </div>

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
            <Phone className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
            <Input
              label={t('auth.phoneOptional')}
              className="pl-10"
              placeholder="+213 555 123 456"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="relative">
            <CreditCard className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
            <Input
              label={t('auth.nationalIdOptional')}
              className="pl-10"
              placeholder={t('auth.yourNationalId')}
              error={errors.nationalId?.message}
              {...register('nationalId')}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
            <Input
              label={t('auth.password')}
              type="password"
              className="pl-10"
              placeholder={t('auth.createPassword')}
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

          <div className="relative">
            <Lock className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
            <Input
              label={t('auth.confirmPassword')}
              type="password"
              className="pl-10"
              placeholder={t('auth.confirmYourPassword')}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: t('auth.confirmPasswordRequired'),
                validate: (value) =>
                  value === password || t('auth.passwordsDoNotMatch'),
              })}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            {t('auth.createAccount')}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            {t('auth.signInHere')}
          </Link>
        </p>
      </Card>
    </div>
  );
}

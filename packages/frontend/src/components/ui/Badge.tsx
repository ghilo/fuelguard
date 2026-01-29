import { clsx } from 'clsx';
import type { CSSProperties } from 'react';

export interface BadgeProps {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'gray';
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function Badge({ variant = 'primary', children, className, style }: BadgeProps) {
  const variants = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    danger: 'bg-danger-50 text-danger-600',
    warning: 'bg-warning-50 text-warning-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      style={style}
    >
      {children}
    </span>
  );
}

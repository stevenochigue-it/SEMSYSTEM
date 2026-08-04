import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'secondary' | 'emerald';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'secondary', className = '' }) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors';

  const variants = {
    success: 'bg-green-100 text-green-800 border border-green-200/50',
    danger: 'bg-red-100 text-red-800 border border-red-200/50',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200/50',
    info: 'bg-blue-100 text-blue-800 border border-blue-200/50',
    secondary: 'bg-slate-100 text-slate-800 border border-slate-200/50',
    emerald: 'bg-emerald-100 text-emerald-800 border border-emerald-200/50',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

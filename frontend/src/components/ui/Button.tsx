import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-sans font-medium transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary:
      'bg-primary font-semibold hover:bg-primaryHover shadow-[0_1px_12px_var(--theme-accent-glow)] hover:shadow-[0_2px_16px_var(--theme-accent-glow)] transition-all',
    secondary:
      'bg-[#12161E] text-zinc-100 border border-white/[0.08] hover:bg-[#181E29] hover:border-white/[0.14] hover:text-white',
    outline:
      'bg-transparent text-zinc-300 border border-white/[0.12] hover:border-white/[0.24] hover:bg-white/[0.04] hover:text-white',
    ghost:
      'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]',
    danger:
      'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30',
  };

  return (
    <button
      className={`${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      style={{
        color: variant === 'primary' ? 'var(--theme-contrast-text, #000000)' : undefined,
        ...props.style,
      }}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

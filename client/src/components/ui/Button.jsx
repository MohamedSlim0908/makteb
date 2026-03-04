import { forwardRef } from 'react';

const variants = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500 shadow-sm hover:shadow-md dark:bg-primary-500 dark:hover:bg-primary-400',
  secondary:
    'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
  outline:
    'border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-primary-500 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800',
  ghost:
    'text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-sm hover:shadow-md',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export const Button = forwardRef(
  ({ variant = 'primary', size = 'md', isLoading, className = '', children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-150
        active:scale-[0.97]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        dark:focus-visible:ring-offset-gray-900
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
);

Button.displayName = 'Button';

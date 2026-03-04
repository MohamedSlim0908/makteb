import { forwardRef } from 'react';

export const Input = forwardRef(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-3 py-2 rounded-lg text-sm
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          border transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0
          dark:focus:ring-primary-400
          ${error
            ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
);

Input.displayName = 'Input';

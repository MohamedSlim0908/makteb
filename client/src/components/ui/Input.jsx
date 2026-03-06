import { forwardRef } from 'react';

export const Input = forwardRef(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-3 py-2 rounded-lg text-sm
          bg-white text-gray-900 placeholder-gray-400
          border transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0
          ${error
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-gray-400 focus:border-gray-900'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
);

Input.displayName = 'Input';

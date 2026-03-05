import { forwardRef } from 'react';

const variants = {
  default: 'bg-white border border-gray-200 shadow-card',
  elevated: 'bg-white border border-gray-200 shadow-card hover:shadow-card-hover transition-shadow duration-300',
  interactive: 'bg-white border border-gray-200 shadow-card hover:shadow-card-hover hover:border-gray-300 transition-all duration-300 cursor-pointer',
  flat: 'bg-white border border-gray-200',
};

export const Card = forwardRef(({ variant = 'default', className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-xl ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </div>
));

Card.displayName = 'Card';

export function CardHeader({ className = '', children }) {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ className = '', children }) {
  return (
    <div className={`px-6 py-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children }) {
  return (
    <div className={`px-6 py-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

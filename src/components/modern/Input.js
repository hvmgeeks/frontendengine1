import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  size = 'md',
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'w-full text-gray-900 bg-white border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder-gray-400';
  
  const variants = {
    default: 'border-gray-200 focus:ring-primary-500 focus:border-transparent',
    error: 'border-error-300 focus:ring-error-500 focus:border-transparent',
    success: 'border-success-300 focus:ring-success-500 focus:border-transparent',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  const inputVariant = error ? 'error' : variant;
  const inputClasses = `${baseClasses} ${variants[inputVariant]} ${sizes[size]} ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''} ${className}`;
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {React.cloneElement(icon, {
              className: `${iconSizes[size]} text-gray-400`
            })}
          </div>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {React.cloneElement(icon, {
              className: `${iconSizes[size]} text-gray-400`
            })}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-error-600">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

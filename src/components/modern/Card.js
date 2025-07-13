import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-xl border transition-all duration-300';
  
  const variants = {
    default: 'shadow-soft border-gray-100 hover:shadow-medium',
    glass: 'bg-white/80 backdrop-blur-sm border-white/20 shadow-soft',
    elevated: 'shadow-medium border-gray-100 hover:shadow-large',
    flat: 'border-gray-200 hover:border-gray-300',
    gradient: 'bg-gradient-to-br from-white to-blue-50 border-blue-100 shadow-soft hover:shadow-medium',
  };
  
  const interactiveClasses = interactive 
    ? 'cursor-pointer hover:shadow-large hover:-translate-y-1 transform' 
    : '';
  
  const cardClasses = `${baseClasses} ${variants[variant]} ${interactiveClasses} ${className}`;
  
  const cardProps = {
    className: cardClasses,
    onClick: interactive ? onClick : undefined,
    ...props
  };
  
  if (interactive) {
    return (
      <motion.div
        {...cardProps}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }
  
  return (
    <div {...cardProps}>
      {children}
    </div>
  );
};

// Card sub-components
Card.Header = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 border-b border-gray-100 ${className}`} {...props}>
    {children}
  </div>
);

Card.Body = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 ${className}`} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 border-t border-gray-100 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;

import React from 'react';
import { motion } from 'framer-motion';

const Loading = ({ 
  size = 'md', 
  variant = 'spinner', 
  text = '', 
  fullScreen = false,
  className = '' 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const Spinner = () => (
    <div className={`${sizes[size]} ${className}`}>
      <div className="animate-spin rounded-full border-2 border-gray-200 border-t-primary-600 h-full w-full"></div>
    </div>
  );

  const Dots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-primary-600 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );

  const Pulse = () => (
    <motion.div
      className={`bg-primary-600 rounded-full ${sizes[size]}`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
      }}
    />
  );

  const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <Dots />;
      case 'pulse':
        return <Pulse />;
      case 'skeleton':
        return <Skeleton className={className} />;
      default:
        return <Spinner />;
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {renderLoader()}
      {text && (
        <p className="text-gray-600 text-sm font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton components for different layouts
Loading.Skeleton = {
  Text: ({ lines = 3, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  ),
  
  Card: ({ className = '' }) => (
    <div className={`p-6 ${className}`}>
      <Skeleton className="h-6 w-1/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  ),
  
  Avatar: ({ size = 'md', className = '' }) => {
    const avatarSizes = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
      xl: 'w-20 h-20',
    };
    return <Skeleton className={`${avatarSizes[size]} rounded-full ${className}`} />;
  },
  
  Button: ({ className = '' }) => (
    <Skeleton className={`h-10 w-24 rounded-lg ${className}`} />
  ),
};

export default Loading;

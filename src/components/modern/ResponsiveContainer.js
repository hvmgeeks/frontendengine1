import React from 'react';
import { motion } from 'framer-motion';

const ResponsiveContainer = ({ 
  children, 
  className = '', 
  maxWidth = '7xl',
  padding = 'responsive',
  ...props 
}) => {
  const maxWidths = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
  };

  const paddings = {
    'none': '',
    'sm': 'px-4',
    'md': 'px-6',
    'lg': 'px-8',
    'responsive': 'px-4 sm:px-6 lg:px-8',
  };

  return (
    <div 
      className={`${maxWidths[maxWidth]} mx-auto ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Responsive Grid Component
export const ResponsiveGrid = ({ 
  children, 
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 6,
  className = '',
  ...props 
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const gaps = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  const responsiveClasses = [
    cols.xs && gridCols[cols.xs],
    cols.sm && `sm:${gridCols[cols.sm]}`,
    cols.md && `md:${gridCols[cols.md]}`,
    cols.lg && `lg:${gridCols[cols.lg]}`,
    cols.xl && `xl:${gridCols[cols.xl]}`,
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={`grid ${responsiveClasses} ${gaps[gap]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Responsive Text Component
export const ResponsiveText = ({ 
  children, 
  size = { xs: 'sm', sm: 'base', md: 'lg' },
  weight = 'normal',
  className = '',
  ...props 
}) => {
  const textSizes = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  const fontWeights = {
    'light': 'font-light',
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold',
  };

  const responsiveClasses = [
    size.xs && textSizes[size.xs],
    size.sm && `sm:${textSizes[size.sm]}`,
    size.md && `md:${textSizes[size.md]}`,
    size.lg && `lg:${textSizes[size.lg]}`,
    size.xl && `xl:${textSizes[size.xl]}`,
  ].filter(Boolean).join(' ');

  return (
    <span 
      className={`${responsiveClasses} ${fontWeights[weight]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// Mobile-First Responsive Component
export const MobileFirst = ({ children, className = '' }) => {
  return (
    <div className={`block lg:hidden ${className}`}>
      {children}
    </div>
  );
};

// Desktop-First Responsive Component
export const DesktopFirst = ({ children, className = '' }) => {
  return (
    <div className={`hidden lg:block ${className}`}>
      {children}
    </div>
  );
};

// Responsive Stack Component
export const ResponsiveStack = ({ 
  children, 
  direction = { xs: 'col', md: 'row' },
  spacing = 4,
  align = 'start',
  justify = 'start',
  className = '',
  ...props 
}) => {
  const directions = {
    'row': 'flex-row',
    'col': 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse',
  };

  const spacings = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  const alignments = {
    'start': 'items-start',
    'center': 'items-center',
    'end': 'items-end',
    'stretch': 'items-stretch',
  };

  const justifications = {
    'start': 'justify-start',
    'center': 'justify-center',
    'end': 'justify-end',
    'between': 'justify-between',
    'around': 'justify-around',
    'evenly': 'justify-evenly',
  };

  const responsiveClasses = [
    direction.xs && directions[direction.xs],
    direction.sm && `sm:${directions[direction.sm]}`,
    direction.md && `md:${directions[direction.md]}`,
    direction.lg && `lg:${directions[direction.lg]}`,
    direction.xl && `xl:${directions[direction.xl]}`,
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={`flex ${responsiveClasses} ${spacings[spacing]} ${alignments[align]} ${justifications[justify]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Responsive Show/Hide Component
export const ResponsiveShow = ({ 
  children, 
  breakpoint = 'md',
  direction = 'up',
  className = '' 
}) => {
  const breakpoints = {
    'sm': direction === 'up' ? 'sm:block' : 'sm:hidden',
    'md': direction === 'up' ? 'md:block' : 'md:hidden',
    'lg': direction === 'up' ? 'lg:block' : 'lg:hidden',
    'xl': direction === 'up' ? 'xl:block' : 'xl:hidden',
  };

  const baseClass = direction === 'up' ? 'hidden' : 'block';

  return (
    <div className={`${baseClass} ${breakpoints[breakpoint]} ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;

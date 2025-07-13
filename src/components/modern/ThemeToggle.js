import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TbSun, TbMoon } from 'react-icons/tb';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ className = '', size = 'md' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`
        ${sizes[size]} 
        relative rounded-full p-2 
        bg-gray-200 dark:bg-gray-700 
        hover:bg-gray-300 dark:hover:bg-gray-600 
        transition-all duration-300 
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${className}
      `}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isDarkMode ? (
            <motion.div
              key="sun"
              initial={{ y: -20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 20, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.3 }}
              className="absolute"
            >
              <TbSun className={`${iconSizes[size]} text-yellow-500`} />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ y: -20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 20, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.3 }}
              className="absolute"
            >
              <TbMoon className={`${iconSizes[size]} text-blue-600`} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};

// Advanced Theme Toggle with Switch Design
export const ThemeSwitch = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={toggleTheme}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full 
        transition-colors duration-300 focus:outline-none focus:ring-2 
        focus:ring-primary-500 focus:ring-offset-2
        ${isDarkMode ? 'bg-primary-600' : 'bg-gray-200'}
        ${className}
      `}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.span
        layout
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-lg 
          transition-transform duration-300 flex items-center justify-center
          ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}
        `}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isDarkMode ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          {isDarkMode ? (
            <TbMoon className="w-2.5 h-2.5 text-primary-600" />
          ) : (
            <TbSun className="w-2.5 h-2.5 text-yellow-500" />
          )}
        </motion.div>
      </motion.span>
    </motion.button>
  );
};

// Theme Toggle with Label
export const ThemeToggleWithLabel = ({ className = '', showLabel = true }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
      <ThemeSwitch />
    </div>
  );
};

export default ThemeToggle;

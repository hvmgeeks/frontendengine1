import React from 'react';
import { motion } from 'framer-motion';

const AdminCard = ({ 
  children, 
  title, 
  subtitle, 
  actions, 
  className = '', 
  noPadding = false,
  loading = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {/* Card Header */}
      {(title || actions) && (
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {title && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-800">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-sm text-slate-600 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            
            {actions && (
              <div className="flex flex-wrap gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className={noPadding ? '' : 'p-4 sm:p-6'}>
        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
};

export default AdminCard;

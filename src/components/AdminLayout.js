import React from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import AdminTopNavigation from './AdminTopNavigation';

const AdminLayout = ({ children, title, subtitle, actions, showHeader = true }) => {
  const { user } = useSelector((state) => state.user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Top Navigation */}
      <AdminTopNavigation />

      {/* Admin Content Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Page Header - Optional */}
        {showHeader && (title || subtitle || actions) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  {title && (
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent mb-2">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
                      {subtitle}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {actions && (
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLayout;

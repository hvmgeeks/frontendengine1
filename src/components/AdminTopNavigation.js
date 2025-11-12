import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { MdVerified } from 'react-icons/md';
import '../styles/admin-navigation.css';
import {
  TbArrowLeft,
  TbUsers,
  TbBook,
  TbFileText,
  TbChartBar,
  TbRobot,
  TbBell,
  TbSettings,
  TbDashboard,
  TbLogout,
  TbHome,
  TbUser,
  TbStar,
  TbMessageCircle
} from 'react-icons/tb';

const AdminTopNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.user);

  const adminMenuItems = [
    {
      title: 'Dashboard',
      icon: TbDashboard,
      path: '/admin/dashboard',
      color: 'text-blue-500'
    },
    {
      title: 'Users',
      icon: TbUsers,
      path: '/admin/users',
      color: 'text-green-500'
    },
    {
      title: 'Exams',
      icon: TbFileText,
      path: '/admin/exams',
      color: 'text-purple-500'
    },
    {
      title: 'Study Materials',
      icon: TbBook,
      path: '/admin/study-materials',
      color: 'text-orange-500'
    },
    {
      title: 'Forum',
      icon: TbMessageCircle,
      path: '/admin/forum',
      color: 'text-pink-500'
    },
    {
      title: 'Reports',
      icon: TbChartBar,
      path: '/admin/reports',
      color: 'text-indigo-500'
    },
    {
      title: 'Notifications',
      icon: TbBell,
      path: '/admin/notifications',
      color: 'text-yellow-500'
    }
  ];

  const getCurrentPageInfo = () => {
    const currentPath = location.pathname;
    const currentItem = adminMenuItems.find(item => currentPath.startsWith(item.path));
    return currentItem || { title: 'Admin Panel', icon: TbDashboard };
  };

  const isActivePath = (path) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Clear remembered credentials on explicit logout
      localStorage.removeItem('rememberedUser');
      localStorage.removeItem('brainwave_remember_me');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const currentPage = getCurrentPageInfo();
  const isDashboard = location.pathname === '/admin/dashboard';

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Back button and current page */}
          <div className="flex items-center space-x-4">
            {!isDashboard && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
              >
                <TbArrowLeft className="w-5 h-5 text-slate-600" />
              </motion.button>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <currentPage.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{currentPage.title}</h1>
                <p className="text-xs text-slate-500">BrainWave Admin</p>
              </div>
            </div>
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <TbUser className="w-4 h-4 text-white" />
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end space-x-1">
                  <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                  <MdVerified className="w-4 h-4 text-blue-500" title="Verified Admin" />
                </div>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
                title="View Site"
              >
                <TbHome className="w-4 h-4 text-slate-600" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors duration-200"
                title="Logout"
              >
                <TbLogout className="w-4 h-4 text-red-600" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Navigation options below title */}
        <div className="pb-4">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
            {adminMenuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = isActivePath(item.path);

              return (
                <motion.button
                  key={item.path}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${isActive ? 'text-blue-600' : item.color}`} />
                  <span className="hidden sm:inline">{item.title}</span>
                  <span className="sm:hidden text-xs">{item.title.split(' ')[0]}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Mobile scroll indicator */}
          <div className="sm:hidden mt-2 flex justify-center">
            <div className="text-xs text-slate-400">← Swipe to see more options →</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTopNavigation;

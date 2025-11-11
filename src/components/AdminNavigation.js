import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { message } from 'antd';
import {
  TbUsers,
  TbBook,
  TbFileText,
  TbChartBar,
  TbRobot,
  TbBell,
  TbMenu2,
  TbX,
  TbHome,
  TbLogout,
  TbUser,
  TbSettings,
  TbDashboard,
  TbChevronLeft,
  TbChevronRight,
  TbMessageCircle,
  TbStar,
  TbVideo
} from 'react-icons/tb';

const AdminNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const adminMenuItems = [
    {
      title: 'Dashboard',
      icon: TbDashboard,
      path: '/admin/dashboard',
      description: 'Overview and statistics',
      color: 'text-blue-400'
    },
    {
      title: 'Users',
      icon: TbUsers,
      path: '/admin/users',
      description: 'Manage student accounts',
      color: 'text-green-400'
    },
    {
      title: 'Exams',
      icon: TbFileText,
      path: '/admin/exams',
      description: 'Create and manage exams',
      color: 'text-purple-400'
    },
    {
      title: 'Study Materials',
      icon: TbBook,
      path: '/admin/study-materials',
      description: 'Manage learning resources',
      color: 'text-orange-400'
    },
    {
      title: 'Videos',
      icon: TbVideo,
      path: '/admin/videos',
      description: 'Manage video lessons',
      color: 'text-red-400'
    },
    {
      title: 'Video Lessons',
      icon: TbVideo,
      path: '/admin/video-lessons',
      description: 'Approve video comments',
      color: 'text-blue-400'
    },
    {
      title: 'Forum',
      icon: TbMessageCircle,
      path: '/admin/forum',
      description: 'Manage community forum',
      color: 'text-pink-400'
    },
    {
      title: 'Reports',
      icon: TbChartBar,
      path: '/admin/reports',
      description: 'View analytics and reports',
      color: 'text-indigo-400'
    },
    {
      title: 'Notifications',
      icon: TbBell,
      path: '/admin/notifications',
      description: 'Send notifications to users',
      color: 'text-cyan-400'
    },
    {
      title: 'Profile',
      icon: TbUser,
      path: '/admin/profile',
      description: 'Manage admin profile',
      color: 'text-gray-400'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Clear remembered credentials on explicit logout
      localStorage.removeItem('rememberedUser');
      message.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      message.error('Error logging out');
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActivePath = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
        >
          <AnimatePresence mode="wait">
            {isMobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TbX className="w-6 h-6 text-gray-700" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TbMenu2 className="w-6 h-6 text-gray-700" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Desktop Collapse Button */}
      <div className="hidden lg:block fixed top-4 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200"
        >
          {isCollapsed ? (
            <TbChevronRight className="w-5 h-5 text-gray-700" />
          ) : (
            <TbChevronLeft className="w-5 h-5 text-gray-700" />
          )}
        </motion.button>
      </div>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{
          x: isMobile ? (isMobileMenuOpen ? 0 : -300) : 0,
          width: isMobile ? 280 : (isCollapsed ? 80 : 280)
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 text-white z-40 shadow-2xl backdrop-blur-lg border-r border-white/10 ${
          isMobile ? (isMobileMenuOpen ? 'block' : 'hidden') : 'block'
        }`}
        style={{
          width: isMobile ? '280px' : (isCollapsed ? '80px' : '280px')
        }}
      >
        <div className="flex flex-col h-full">
          {/* Modern Admin Header */}
          <div className="p-6 border-b border-white/10">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="mb-6"
                >
                  <div className="flex items-center space-x-3 mb-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">🧠</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                        BrainWave Admin
                      </h1>
                      <p className="text-blue-200 text-sm font-medium">Administrator Panel</p>
                    </div>
                  </div>

                  {/* Admin Profile */}
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <TbUser className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">{user?.name}</p>
                        <p className="text-blue-200 text-xs">Administrator</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed Header */}
            {isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center space-y-4"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">🧠</span>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <TbUser className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-6 py-4 overflow-y-auto">
            <div className="space-y-2">
              {adminMenuItems.map((item, index) => {
                const IconComponent = item.icon;
                const isActive = isActivePath(item.path);

                return (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xl'
                        : 'hover:bg-white/10 text-white hover:shadow-lg'
                    } ${isCollapsed ? 'p-3 justify-center' : 'p-4 space-x-3'}`}
                    title={isCollapsed ? item.title : ''}
                  >
                    {/* Background gradient for active state */}
                    {isActive && (
                      <motion.div
                        layoutId="activeBackground"
                        className="absolute inset-0 bg-gradient-to-r from-white to-blue-50 rounded-xl"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}

                    {/* Icon */}
                    <div className="relative z-10">
                      <IconComponent
                        className={`w-5 h-5 transition-colors duration-300 ${
                          isActive ? 'text-blue-600' : item.color
                        }`}
                      />
                    </div>

                    {/* Text content */}
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="text-left flex-1 relative z-10"
                        >
                          <p className={`font-semibold text-sm transition-colors duration-300 ${
                            isActive ? 'text-slate-900' : 'text-white'
                          }`}>
                            {item.title}
                          </p>
                          <p className={`text-xs transition-colors duration-300 ${
                            isActive ? 'text-slate-600' : 'text-blue-200'
                          }`}>
                            {item.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                  </motion.button>
                );
              })}
            </div>
          </nav>

          {/* Bottom Actions */}
          <div className="p-6 border-t border-white/10 space-y-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation('/profile')}
              className={`w-full flex items-center rounded-lg hover:bg-white/10 transition-all duration-200 group ${
                isCollapsed ? 'p-3 justify-center' : 'p-3 space-x-3'
              }`}
              title={isCollapsed ? 'Profile Settings' : ''}
            >
              <TbUser className="w-5 h-5 text-blue-300 group-hover:text-white transition-colors" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm text-blue-200 group-hover:text-white transition-colors"
                  >
                    Profile Settings
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation('/')}
              className={`w-full flex items-center rounded-lg hover:bg-white/10 transition-all duration-200 group ${
                isCollapsed ? 'p-3 justify-center' : 'p-3 space-x-3'
              }`}
              title={isCollapsed ? 'View Site' : ''}
            >
              <TbHome className="w-5 h-5 text-green-300 group-hover:text-white transition-colors" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm text-blue-200 group-hover:text-white transition-colors"
                  >
                    View Site
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className={`w-full flex items-center rounded-lg hover:bg-red-500/20 transition-all duration-200 group ${
                isCollapsed ? 'p-3 justify-center' : 'p-3 space-x-3'
              }`}
              title={isCollapsed ? 'Logout' : ''}
            >
              <TbLogout className="w-5 h-5 text-red-300 group-hover:text-red-200 transition-colors" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm text-red-200 group-hover:text-red-100 transition-colors"
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminNavigation;

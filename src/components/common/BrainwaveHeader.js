import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import ProfilePicture from './ProfilePicture';
import ModernSidebar from '../ModernSidebar';
import NotificationBell from './NotificationBell';

const BrainwaveHeader = ({ title = "Brainwave" }) => {
  const { user } = useSelector((state) => state.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notification functionality is now handled by NotificationBell component

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 lg:h-20">
            {/* Left section - Menu Button */}
            <div className="flex items-center space-x-2 w-1/4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="group relative"
                style={{
                  padding: window.innerWidth <= 480 ? '8px' : window.innerWidth <= 768 ? '10px' : '12px',
                  width: window.innerWidth <= 480 ? '40px' : window.innerWidth <= 768 ? '44px' : '48px',
                  height: window.innerWidth <= 480 ? '40px' : window.innerWidth <= 768 ? '44px' : '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.9)',
                  border: '3px solid rgba(255, 255, 255, 0.8)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.3), 0 3px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
                title="Open Menu"
              >
                {/* Modern Menu Icon */}
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    width: window.innerWidth <= 480 ? '18px' : window.innerWidth <= 768 ? '20px' : '22px',
                    height: window.innerWidth <= 480 ? '14px' : window.innerWidth <= 768 ? '16px' : '18px'
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: window.innerWidth <= 480 ? '4px' : window.innerWidth <= 768 ? '5px' : '6px',
                      background: '#ffffff',
                      borderRadius: '4px',
                      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.8)',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(255, 255, 255, 0.9)'
                    }}
                  />
                  <div
                    style={{
                      width: '100%',
                      height: window.innerWidth <= 480 ? '4px' : window.innerWidth <= 768 ? '5px' : '6px',
                      background: '#ffffff',
                      borderRadius: '4px',
                      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.8)',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(255, 255, 255, 0.9)'
                    }}
                  />
                  <div
                    style={{
                      width: '100%',
                      height: window.innerWidth <= 480 ? '4px' : window.innerWidth <= 768 ? '5px' : '6px',
                      background: '#ffffff',
                      borderRadius: '4px',
                      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.8)',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(255, 255, 255, 0.9)'
                    }}
                  />
                </div>
              </button>
            </div>

            {/* Center Section - Brainwave Title + Logo */}
            <div className="flex-1 flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative group flex items-center justify-center space-x-2 sm:space-x-3"
                style={{
                  maxWidth: '800px',
                  width: '100%'
                }}
              >
                {/* Amazing Animated Brainwave Text with Logo */}
                <div className="relative brainwave-container flex items-center">
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black tracking-tight relative z-10 select-none flex items-center"
                      style={{
                        fontFamily: "'Inter', 'SF Pro Display', 'Helvetica Neue', sans-serif",
                        letterSpacing: '-0.02em'
                      }}>
                    {/* Brain - with amazing effects */}
                    <motion.span
                      className="relative inline-block"
                      initial={{ opacity: 0, x: -30, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        textShadow: [
                          "0 0 10px rgba(59, 130, 246, 0.5)",
                          "0 0 20px rgba(59, 130, 246, 0.8)",
                          "0 0 10px rgba(59, 130, 246, 0.5)"
                        ]
                      }}
                      transition={{
                        duration: 1,
                        delay: 0.3,
                        textShadow: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                      whileHover={{
                        scale: 1.1,
                        rotate: [0, -2, 2, 0],
                        transition: { duration: 0.3 }
                      }}
                      style={{
                        color: '#1f2937',
                        fontWeight: '900',
                        textShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                      }}
                    >
                      Brain

                      {/* Electric spark */}
                      <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0.5, 1.2, 0.5],
                          backgroundColor: ['#3b82f6', '#60a5fa', '#3b82f6']
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 2
                        }}
                        style={{
                          backgroundColor: '#3b82f6',
                          boxShadow: '0 0 10px #3b82f6'
                        }}
                      />
                    </motion.span>

                    {/* Wave - with flowing effects */}
                    <motion.span
                      className="relative inline-block"
                      initial={{ opacity: 0, x: 30, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        y: [0, -2, 0, 2, 0],
                        textShadow: [
                          "0 0 10px rgba(16, 185, 129, 0.5)",
                          "0 0 20px rgba(16, 185, 129, 0.8)",
                          "0 0 10px rgba(16, 185, 129, 0.5)"
                        ]
                      }}
                      transition={{
                        duration: 1,
                        delay: 0.5,
                        y: {
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        },
                        textShadow: {
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                      whileHover={{
                        scale: 1.1,
                        rotate: [0, 2, -2, 0],
                        transition: { duration: 0.3 }
                      }}
                      style={{
                        color: '#059669',
                        fontWeight: '900',
                        textShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                      }}
                    >
                      wave

                      {/* Wave particle */}
                      <motion.div
                        className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full"
                        animate={{
                          opacity: [0, 1, 0],
                          x: [0, 40, 80],
                          y: [0, -5, 0, 5, 0],
                          backgroundColor: ['#10b981', '#34d399', '#10b981']
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: 1
                        }}
                        style={{
                          backgroundColor: '#10b981',
                          boxShadow: '0 0 8px #10b981'
                        }}
                      />
                    </motion.span>

                    {/* Official Logo - Horizontally next to "wave" */}
                    <div
                      className="rounded-full overflow-hidden border-2 border-white/20 relative inline-block"
                      style={{
                        background: '#f0f0f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        width: window.innerWidth <= 480 ? '24px' : '32px',
                        height: window.innerWidth <= 480 ? '24px' : '32px',
                        marginLeft: '8px',
                        verticalAlign: 'middle'
                      }}
                    >
                      <img
                        src="/favicon.png"
                        alt="Brainwave Logo"
                        className="w-full h-full object-cover"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div
                        className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold"
                        style={{
                          display: 'none',
                          fontSize: '12px'
                        }}
                      >
                        🧠
                      </div>
                    </div>
                  </h1>

                  {/* Glowing underline effect */}
                  <motion.div
                    className="absolute -bottom-1 left-0 h-1 rounded-full"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{
                      width: '100%',
                      opacity: 1,
                      boxShadow: [
                        '0 0 10px rgba(16, 185, 129, 0.5)',
                        '0 0 20px rgba(59, 130, 246, 0.8)',
                        '0 0 10px rgba(16, 185, 129, 0.5)'
                      ]
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 1.2,
                      boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                    style={{
                      background: 'linear-gradient(90deg, #3b82f6, #10b981, #3b82f6)',
                      boxShadow: '0 0 15px rgba(16, 185, 129, 0.6)'
                    }}
                  />
                </div>

                {/* Modern Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-gray-900/5 to-blue-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10 scale-110"></div>
              </motion.div>
            </div>

            {/* Right Section - Notification Bell & User Profile */}
            <div className="flex items-center justify-end space-x-3 w-1/4">
              {/* Notification Bell - Using functional NotificationBell component */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <NotificationBell className="notification-bell-header" />
              </motion.div>

              {user && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex items-center space-x-2 group"
                >
                  {/* Profile Picture with Online Status */}
                  <ProfilePicture
                    user={user}
                    size="sm"
                    showOnlineStatus={true}
                    style={{
                      width: '32px',
                      height: '32px'
                    }}
                  />

                  {/* User Name and Class */}
                  <div className="hidden sm:block text-right">
                    <div className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors duration-300">
                      {(() => {
                        // Show "Administrator" for admin users
                        if (user?.isAdmin) return 'Administrator';

                        if (!user?.class) return 'N/A';
                        switch (user?.level) {
                          case 'primary':
                            return `Class ${user.class}`;
                          case 'primary_kiswahili':
                            return `Darasa la ${user.class}`;
                          case 'secondary':
                            return user.class.toString().startsWith('Form') ? user.class : `Form ${user.class}`;
                          case 'advance':
                            return user.class.toString().startsWith('Form') ? user.class : `Form ${user.class}`;
                          default:
                            return user.class.toString();
                        }
                      })()}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Sidebar */}
      <ModernSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
    </>
  );
};

export default BrainwaveHeader;

// Add styles for notification bell in header
const headerNotificationStyles = `
.notification-bell-header .notification-bell-button {
  padding: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.notification-bell-header .notification-bell-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.notification-bell-header .notification-bell-button svg {
  color: #374151;
  transition: color 0.3s ease;
}

.notification-bell-header .notification-bell-button:hover svg {
  color: #2563eb;
}
`;

// Inject header notification styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('header-notification-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'header-notification-styles';
    styleSheet.textContent = headerNotificationStyles;
    document.head.appendChild(styleSheet);
  }
}

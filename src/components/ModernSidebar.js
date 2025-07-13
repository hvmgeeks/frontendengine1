import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TbMenu2,
  TbX,
  TbHome,
  TbBrain,
  TbBook,
  TbVideo,
  TbRobot,
  TbChartLine,
  TbTrophy,
  TbUser,
  TbMessageCircle,
  TbCreditCard,
  TbLogout,
  TbChevronRight,
  TbStar
} from 'react-icons/tb';

const ModernSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.user);
  const { t, isKiswahili } = useLanguage();

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navigationItems = [
    {
      title: isKiswahili ? 'Kituo' : 'Hub',
      description: isKiswahili ? 'Dashibodi kuu' : 'Main dashboard',
      icon: TbHome,
      path: '/user/hub',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: isKiswahili ? 'Fanya Mtihani' : 'Take Quiz',
      description: isKiswahili ? 'Jaribu maarifa yako' : 'Test your knowledge',
      icon: TbBrain,
      path: '/user/quiz',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: isKiswahili ? 'Vifaa vya Kusoma' : 'Study Materials',
      description: isKiswahili ? 'Vitabu, video na maelezo' : 'Books, videos & notes',
      icon: TbBook,
      path: '/user/study-material',
      color: 'from-green-500 to-green-600'
    },
    {
      title: isKiswahili ? 'Masomo ya Video' : 'Video Lessons',
      description: isKiswahili ? 'Tazama video za kielimu' : 'Watch educational videos',
      icon: TbVideo,
      path: '/user/video-lessons',
      color: 'from-red-500 to-red-600'
    },
    {
      title: isKiswahili ? 'Ujuzi wa Video' : 'Skills',
      description: isKiswahili ? 'Jifunze ujuzi mpya' : 'Learn new skills',
      icon: TbStar,
      path: '/user/skills',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: isKiswahili ? 'Ripoti' : 'Reports',
      description: isKiswahili ? 'Fuatilia maendeleo' : 'Track progress',
      icon: TbChartLine,
      path: '/user/reports',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: isKiswahili ? 'Orodha ya Ushindi' : 'Ranking',
      description: isKiswahili ? 'Ona nafasi yako' : 'See your position',
      icon: TbTrophy,
      path: '/user/ranking',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: isKiswahili ? 'Wasifu' : 'Profile',
      description: isKiswahili ? 'Simamia akaunti' : 'Manage account',
      icon: TbUser,
      path: '/profile',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: isKiswahili ? 'Uanachama' : 'Subscription',
      description: isKiswahili ? 'Simamia mpango wako' : 'Manage your plan',
      icon: TbStar,
      path: '/subscription',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: isKiswahili ? 'Jukwaa' : 'Forum',
      description: isKiswahili ? 'Unganisha na wenzako' : 'Connect with peers',
      icon: TbMessageCircle,
      path: '/forum',
      color: 'from-pink-500 to-pink-600'
    },

    {
      title: isKiswahili ? 'Ondoka' : 'Logout',
      description: isKiswahili ? 'Toka kwenye akaunti' : 'Sign out of account',
      icon: TbLogout,
      path: 'logout',
      color: 'from-red-500 to-red-600'
    }
  ];

  const handleNavigation = (path) => {
    if (path === 'logout') {
      handleLogout();
    } else {
      navigate(path);
    }
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Force page reload to clear all state
    window.location.href = "/";
  };

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Toggle Button - Responsive */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-50 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105"
        style={{
          top: window.innerWidth <= 768 ? '8px' : '16px',
          left: window.innerWidth <= 768 ? '8px' : '16px',
          padding: window.innerWidth <= 768 ? '8px' : '12px'
        }}
        title={isOpen ? "Close Menu" : "Open Menu"}
      >
        {isOpen ? (
          <TbX
            className="text-gray-700"
            style={{
              width: window.innerWidth <= 768 ? '20px' : '24px',
              height: window.innerWidth <= 768 ? '20px' : '24px'
            }}
          />
        ) : (
          <TbMenu2
            className="text-gray-700"
            style={{
              width: window.innerWidth <= 768 ? '20px' : '24px',
              height: window.innerWidth <= 768 ? '20px' : '24px'
            }}
          />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="sidebar-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar - Responsive */}
      {isOpen && (
        <div
          className="sidebar-panel fixed left-0 top-0 h-full bg-white shadow-2xl z-50 flex flex-col"
            style={{
              width: window.innerWidth <= 768 ? '85vw' : window.innerWidth <= 1024 ? '350px' : '380px',
              maxWidth: window.innerWidth <= 768 ? '300px' : '400px'
            }}
          >
            {/* Header - Responsive */}
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white relative"
              style={{
                padding: window.innerWidth <= 768 ? '12px 16px' : '16px 24px'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
                style={{
                  top: window.innerWidth <= 768 ? '8px' : '12px',
                  right: window.innerWidth <= 768 ? '8px' : '12px',
                  padding: window.innerWidth <= 768 ? '6px' : '8px'
                }}
                title="Close Menu"
              >
                <TbX
                  className="text-white"
                  style={{
                    width: window.innerWidth <= 768 ? '16px' : '20px',
                    height: window.innerWidth <= 768 ? '16px' : '20px'
                  }}
                />
              </button>

              <div
                className="text-center"
                style={{
                  paddingRight: window.innerWidth <= 768 ? '32px' : '48px'
                }}
              >
                <h1
                  className="font-bold mb-2"
                  style={{
                    fontSize: window.innerWidth <= 768 ? '18px' : '24px'
                  }}
                >
                  Navigation
                </h1>
                <p
                  className="text-blue-200"
                  style={{
                    fontSize: window.innerWidth <= 768 ? '12px' : '14px'
                  }}
                >
                  Choose your destination
                </p>
              </div>
            </div>

            {/* Navigation - Responsive */}
            <div
              className="flex-1 overflow-y-auto"
              style={{
                padding: window.innerWidth <= 768 ? '12px' : '16px',
                gap: window.innerWidth <= 768 ? '8px' : '12px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {navigationItems.map((item, index) => {
                const IconComponent = item.icon;
                const isActive = item.path !== 'logout' && isActivePath(item.path);
                const isLogout = item.path === 'logout';

                return (
                  <button
                    key={item.path}
                    className="sidebar-nav-item"
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center justify-between rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 border-2 border-blue-200 shadow-md'
                        : isLogout
                        ? 'hover:bg-red-50 border-2 border-transparent'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                    style={{
                      padding: window.innerWidth <= 768 ? '8px 12px' : '12px 16px',
                      marginBottom: window.innerWidth <= 768 ? '6px' : '8px'
                    }}
                  >
                    <div
                      className="flex items-center"
                      style={{
                        gap: window.innerWidth <= 768 ? '8px' : '12px'
                      }}
                    >
                      <div
                        className={`rounded-lg bg-gradient-to-r ${item.color} flex items-center justify-center`}
                        style={{
                          width: window.innerWidth <= 768 ? '32px' : '40px',
                          height: window.innerWidth <= 768 ? '32px' : '40px'
                        }}
                      >
                        <IconComponent
                          className="text-white"
                          style={{
                            width: window.innerWidth <= 768 ? '16px' : '20px',
                            height: window.innerWidth <= 768 ? '16px' : '20px'
                          }}
                        />
                      </div>
                      <div className="text-left flex-1">
                        <p
                          className={`font-medium ${
                            isActive
                              ? 'text-blue-700'
                              : isLogout
                              ? 'text-red-700'
                              : 'text-gray-900'
                          }`}
                          style={{
                            fontSize: window.innerWidth <= 768 ? '14px' : '16px'
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          className={`${
                            isActive
                              ? 'text-blue-600'
                              : isLogout
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                          style={{
                            fontSize: window.innerWidth <= 768 ? '11px' : '14px'
                          }}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <TbChevronRight
                      className={`${
                        isActive
                          ? 'text-blue-600'
                          : isLogout
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}
                      style={{
                        width: window.innerWidth <= 768 ? '16px' : '20px',
                        height: window.innerWidth <= 768 ? '16px' : '20px'
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
    </>
  );
};

export default ModernSidebar;

// Add CSS animations to replace Framer Motion
const sidebarStyles = `
.sidebar-backdrop {
  animation: backdropFadeIn 0.3s ease-out;
}

.sidebar-panel {
  animation: sidebarSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  width: 280px;
}

.sidebar-nav-item {
  animation: navItemSlideIn 0.3s ease-out;
  animation-fill-mode: both;
}

.sidebar-nav-item:nth-child(1) { animation-delay: 0.05s; }
.sidebar-nav-item:nth-child(2) { animation-delay: 0.1s; }
.sidebar-nav-item:nth-child(3) { animation-delay: 0.15s; }
.sidebar-nav-item:nth-child(4) { animation-delay: 0.2s; }
.sidebar-nav-item:nth-child(5) { animation-delay: 0.25s; }
.sidebar-nav-item:nth-child(6) { animation-delay: 0.3s; }
.sidebar-nav-item:nth-child(7) { animation-delay: 0.35s; }
.sidebar-nav-item:nth-child(8) { animation-delay: 0.4s; }

@keyframes backdropFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes sidebarSlideIn {
  from {
    transform: translateX(-400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes navItemSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .sidebar-panel {
    width: 260px;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('sidebar-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'sidebar-styles';
    styleSheet.textContent = sidebarStyles;
    document.head.appendChild(styleSheet);
  }
}

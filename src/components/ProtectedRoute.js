import { message } from "antd";
import React, { useEffect, useState, useRef, startTransition } from "react";
import { getUserInfo } from "../apicalls/users";
import { useDispatch, useSelector } from "react-redux";
import { SetUser } from "../redux/usersSlice.js";
import { useNavigate, useLocation } from "react-router-dom";
import { HideLoading, ShowLoading } from "../redux/loaderSlice";
import { checkPaymentStatus } from "../apicalls/payment.js";
import "./ProtectedRoute.css";
import { SetSubscription } from "../redux/subscriptionSlice.js";
import { setPaymentVerificationNeeded } from "../redux/paymentSlice.js";
import AdminNavigation from "./AdminNavigation";
import ModernSidebar from "./ModernSidebar";

import { TbHome, TbBrandTanzania, TbMenu2, TbX, TbChevronDown, TbLogout, TbUser, TbSettings, TbBell, TbStar } from "react-icons/tb";
import OnlineStatusIndicator from './common/OnlineStatusIndicator';
import NotificationBell from './common/NotificationBell';
import ProfilePicture from './common/ProfilePicture';
import FloatingBrainwaveAI from './FloatingBrainwaveAI';
import { setUserOnline, setUserOffline, sendHeartbeat } from '../apicalls/notifications';


function ProtectedRoute({ children }) {
  const { user } = useSelector((state) => state.user);
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  const intervalRef = useRef(null);
  const heartbeatRef = useRef(null);
  const { subscriptionData } = useSelector((state) => state.subscription);
  const { paymentVerificationNeeded } = useSelector((state) => state.payment);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current page should show floating AI (exclude quiz, results, plans, and profile pages)
  const shouldShowFloatingAI = () => {
    const currentPath = location.pathname;
    const excludedPaths = [
      '/user/quiz',
      '/user/quiz/',
      '/quiz',
      '/quiz/',
      '/results',
      '/results/',
      '/user/results',
      '/user/results/',
      '/user/plans',
      '/user/plans/',
      '/plans',
      '/plans/',
      '/profile',
      '/profile/',
      '/user/profile',
      '/user/profile/'
    ];

    // Check if current path starts with any excluded path or contains quiz/result keywords
    return !excludedPaths.some(path => currentPath.includes(path)) &&
           !currentPath.includes('quiz') &&
           !currentPath.includes('result') &&
           !currentPath.includes('plans') &&
           !currentPath.includes('profile');
  };
  const activeRoute = location.pathname;





  const getUserData = async () => {
    try {
      const response = await getUserInfo();
      if (response.success) {
        dispatch(SetUser(response.data));

        // Store user data in localStorage for consistency
        localStorage.setItem("user", JSON.stringify(response.data));

        // Debug log to help identify admin login issues
        console.log("User data loaded:", {
          name: response.data.name,
          isAdmin: response.data.isAdmin,
          email: response.data.email
        });
      } else {
        message.error(response.message);
        navigate("/login");
      }
    } catch (error) {
      navigate("/login");
      message.error(error.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Check if user data already exists in Redux (from login)
      if (!user) {
        // Try to load user from localStorage first
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log("ProtectedRoute: Loading user from localStorage", { name: userData.name, isAdmin: userData.isAdmin });
            dispatch(SetUser(userData));
          } catch (error) {
            console.log("ProtectedRoute: Error parsing stored user data, fetching from server");
            getUserData();
          }
        } else {
          console.log("ProtectedRoute: No user in Redux or localStorage, fetching from server");
          getUserData();
        }
      } else {
        console.log("ProtectedRoute: User already in Redux", { name: user.name, isAdmin: user.isAdmin });
      }
    } else {
      navigate("/login");
    }
  }, []);



  useEffect(() => {
    // Allow access to profile page, subscription page, and logout for all users
    const allowedRoutes = ['/user/profile', '/profile', '/subscription', '/user/subscription', '/logout'];
    const isAllowedRoute = allowedRoutes.some(route => activeRoute.includes(route));

    // Redirect users with paymentRequired or no subscription to subscription page
    if (isPaymentPending && !isAllowedRoute &&
        (user?.paymentRequired || user?.subscriptionStatus === 'free' || !user?.subscriptionStatus) &&
        !user?.isAdmin) {
      console.log("Redirecting user to subscription page - paymentRequired:", user?.paymentRequired);
      navigate('/subscription'); // Redirect to subscription page to choose plan
    }
  }, [isPaymentPending, activeRoute, navigate, user]);

  const verifyPaymentStatus = async () => {
    try {
      const data = await checkPaymentStatus();
      console.log("Payment Status:", data);
      if (data?.error || data?.paymentStatus !== 'paid') {
        if (subscriptionData !== null) {
          dispatch(SetSubscription(null));
        }
        // Set payment pending if user has paymentRequired or no subscription
        if ((user?.paymentRequired || user?.subscriptionStatus === 'free' || !user?.subscriptionStatus) && !user?.isAdmin) {
          setIsPaymentPending(true);
        } else {
          setIsPaymentPending(false); // User has active subscription, allow access
        }
      }
      else {
        setIsPaymentPending(false);
        dispatch(SetSubscription(data));
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    } catch (error) {
      console.log("Error checking payment status:", error);
      dispatch(SetSubscription(null));
      // Set payment pending if user has paymentRequired or no subscription
      if ((user?.paymentRequired || user?.subscriptionStatus === 'free' || !user?.subscriptionStatus) && !user?.isAdmin) {
        setIsPaymentPending(true);
      } else {
        setIsPaymentPending(false); // User has active subscription, allow access
      }
    }
  };

  useEffect(() => {
    // Verify payment for users with paymentRequired or no subscription
    if (user && !user?.isAdmin && (user?.paymentRequired || user?.subscriptionStatus === 'free' || !user?.subscriptionStatus)) {
      console.log("Effect Running - checking payment for user with paymentRequired:", user?.paymentRequired);

      if (paymentVerificationNeeded) {
        console.log('Inside timer in effect 2....');
        intervalRef.current = setInterval(() => {
          console.log('Timer in action...');
          verifyPaymentStatus();
        }, 15000);
        dispatch(setPaymentVerificationNeeded(false));
      }
    } else {
      // For users with active subscription, ensure they have access
      setIsPaymentPending(false);
    }
  }, [paymentVerificationNeeded, user]);

  useEffect(() => {
    // Verify payment for users with paymentRequired or no subscription
    if (user && !user?.isAdmin && (user?.paymentRequired || user?.subscriptionStatus === 'free' || !user?.subscriptionStatus)) {
      console.log("Effect Running - verifying payment status for user with paymentRequired:", user?.paymentRequired);
      verifyPaymentStatus();
    } else {
      // For users with active subscription, ensure they have access
      setIsPaymentPending(false);
    }
  }, [user, activeRoute]);

  // Online status management
  useEffect(() => {
    if (user && !user.isAdmin) {
      // Set user as online when component mounts
      setUserOnline().catch(console.error);

      // Send heartbeat every 2 minutes
      heartbeatRef.current = setInterval(() => {
        sendHeartbeat().catch(console.error);
      }, 120000); // 2 minutes

      // Set user as offline when component unmounts or page unloads
      const handleBeforeUnload = () => {
        setUserOffline().catch(console.error);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
        }
        window.removeEventListener('beforeunload', handleBeforeUnload);
        setUserOffline().catch(console.error);
      };
    }
  }, [user]);


  const getButtonClass = (title) => {
    // Always allow access to Profile, Subscription/Plans, and Logout
    if (title === "Plans" || title === "Profile" || title === "Logout" || title === "Subscription") {
      return ""; // No class applied
    }

    // Disable buttons for users with paymentRequired or no subscription
    if ((user?.paymentRequired || user?.subscriptionStatus === 'free' || !user?.subscriptionStatus) && !user?.isAdmin) {
      return subscriptionData?.paymentStatus !== "paid" ? "button-disabled" : "";
    }

    // Users with active subscription can access all features
    return "";
  };




  return (
    <div className="layout-modern min-h-screen flex flex-col">
      {/* Modern Sidebar for regular users */}
      {!user?.isAdmin && <ModernSidebar />}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Modern Responsive Header - Show for all users */}
        {(
          <header
            className={`nav-modern safe-header-animation ${
              location.pathname.includes('/write-exam') || location.pathname.includes('/take-quiz/')
                ? 'quiz-header bg-gradient-to-r from-blue-600/98 via-blue-700/95 to-blue-600/98'
                : 'bg-gradient-to-r from-white/98 via-blue-50/95 to-white/98'
            } backdrop-blur-xl border-b border-blue-100/50 sticky top-0 z-30 shadow-lg shadow-blue-100/20`}
            style={{
              minHeight: '48px',
              height: '48px',
              maxHeight: '48px',
              padding: '0'
            }}
          >
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-6xl mx-auto" style={{ padding: '0 1rem', maxWidth: '1200px' }}>
            <div className="flex items-center justify-between" style={{ height: '48px', minHeight: '48px', maxHeight: '48px' }}>
              {/* Left section - Empty for spacing */}
              <div className="flex-1"></div>

              {/* Center Section - Tanzania Flag + Brainwave Title + Logo */}
              <div className="flex justify-center flex-1" style={{ alignItems: 'center', height: '100%' }}>
                <div
                  className="relative group flex items-center space-x-2 sm:space-x-3 safe-center-animation"
                  style={{ alignItems: 'center', gap: '0.5rem', height: 'auto' }}
                >
                  {/* Tanzania Flag - Using actual flag image */}
                  <div
                    className="rounded-md overflow-hidden border-2 border-gray-300 shadow-lg relative"
                    style={{
                      width: '24px',
                      height: '18px',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src="https://flagcdn.com/w40/tz.png"
                      alt="Tanzania Flag"
                      className="w-full h-full object-cover"
                      style={{ objectFit: 'cover' }}
                      onError={(e) => {
                        // Fallback to another flag source if first fails
                        e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Flag_of_Tanzania.svg/32px-Flag_of_Tanzania.svg.png";
                        e.target.onerror = () => {
                          // Final fallback - hide image and show text
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="w-full h-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">TZ</div>';
                        };
                      }}
                    />
                  </div>

                  {/* Amazing Animated Brainwave Text */}
                  <div className="relative brainwave-container">
                    <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight relative z-10 select-none"
                        style={{
                          fontFamily: "'Inter', 'SF Pro Display', 'Helvetica Neue', sans-serif",
                          letterSpacing: '-0.02em',
                          fontSize: '1.1rem',
                          lineHeight: '1.2',
                          margin: '0',
                          padding: '0'
                        }}>
                      {/* Brain - simplified safe animation */}
                      <span
                        className="relative inline-block brain-text"
                        style={{
                          color: '#1f2937',
                          fontWeight: '900',
                          textShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
                          animation: 'brainGlow 3s ease-in-out infinite'
                        }}
                      >
                        Brain

                        {/* Electric spark - CSS animation */}
                        <div
                          className="absolute -top-1 -right-1 w-2 h-2 rounded-full electric-spark"
                          style={{
                            backgroundColor: '#3b82f6',
                            boxShadow: '0 0 10px #3b82f6',
                            animation: 'sparkPulse 2s ease-in-out infinite'
                          }}
                        />
                      </span>

                      {/* Wave - simplified safe animation */}
                      <span
                        className="relative inline-block wave-text"
                        style={{
                          color: '#059669',
                          fontWeight: '900',
                          textShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                          animation: 'waveFlow 3s ease-in-out infinite'
                        }}
                      >
                        wave

                        {/* Wave particle - CSS animation */}
                        <div
                          className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full wave-particle"
                          style={{
                            backgroundColor: '#10b981',
                            boxShadow: '0 0 8px #10b981',
                            animation: 'waveParticle 3s ease-in-out infinite'
                          }}
                        />
                      </span>
                    </h1>

                    {/* Glowing underline effect - CSS animation */}
                    <div
                      className="absolute -bottom-1 left-0 h-1 rounded-full glowing-underline"
                      style={{
                        background: 'linear-gradient(90deg, #3b82f6, #10b981, #3b82f6)',
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.6)',
                        width: '100%',
                        animation: 'underlineGlow 3s ease-in-out infinite'
                      }}
                    />
                  </div>

                  {/* Official Logo - Small like profile */}
                  <div
                    className="rounded-full overflow-hidden border-2 border-white/20 relative"
                    style={{
                      background: '#f0f0f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      width: '24px',
                      height: '24px',
                      flexShrink: 0
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

                  {/* Modern Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-gray-900/5 to-blue-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10 scale-110"></div>
                </div>
              </div>

              {/* Right Section - Notifications + User Profile */}
              <div className="flex items-center justify-end space-x-2 sm:space-x-3 flex-1">
                {/* Notification Bell */}
                {!user?.isAdmin && (
                  <div className="safe-notification-animation">
                    <NotificationBell unreadCount={2} />
                  </div>
                )}

                <div
                  className="flex items-center space-x-2 group safe-profile-animation cursor-pointer"
                  onClick={() => navigate('/profile')}
                  title="Go to Profile"
                >
                  {/* Profile Picture with Online Status */}
                  <ProfilePicture
                    user={{
                      ...user,
                      isOnline: true,
                      lastActivity: new Date().toISOString()
                    }}
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
                      {user?.level === 'primary' ? `Class ${user?.class}` : user?.class}
                    </div>
                  </div>

                  {/* Profile Access Indicator */}
                  <div className="hidden md:block">
                    <TbUser className="text-gray-400 group-hover:text-blue-500 transition-colors duration-300 text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        )}

        {/* Page Content */}
        <main className={`flex-1 overflow-auto ${
          user?.isAdmin
            ? 'bg-gray-100'
            : 'bg-gradient-to-br from-gray-50 to-blue-50'
        } ${user?.isAdmin ? 'p-6' : 'pb-20 sm:pb-0'}`}>
          <div
            className="h-full safe-content-animation"
          >
            {children}
          </div>
        </main>

        {/* Floating Brainwave AI - Show on all pages except quiz and results */}
        {shouldShowFloatingAI() && <FloatingBrainwaveAI />}



      </div>
    </div>
  );
}

export default ProtectedRoute;

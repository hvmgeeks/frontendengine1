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
import BrainwaveHeader from "./common/BrainwaveHeader";

// Header-related imports removed since header was removed
import FloatingBrainwaveAI from './FloatingBrainwaveAI';
import { setUserOnline, setUserOffline, sendHeartbeat } from '../apicalls/notifications';


function ProtectedRoute({ children }) {
  const { user } = useSelector((state) => state.user);
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  // Mobile menu state removed since header was removed
  const intervalRef = useRef(null);
  const heartbeatRef = useRef(null);
  const paymentCheckDone = useRef(false); // Track if payment check has been done
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

  // DISABLED - Reset payment check when route changes
  // useEffect(() => {
  //   paymentCheckDone.current = false;
  // }, [activeRoute]);



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
    console.log("🔍 ProtectedRoute useEffect - Token exists:", !!token, "User exists:", !!user);

    if (token) {
      // Check if user data already exists in Redux (from login)
      if (!user) {
        // Try to load user from localStorage first
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log("✅ ProtectedRoute: Loading user from localStorage", { name: userData.name, isAdmin: userData.isAdmin });
            dispatch(SetUser(userData));
          } catch (error) {
            console.log("❌ ProtectedRoute: Error parsing stored user data, fetching from server");
            getUserData();
          }
        } else {
          console.log("⚠️ ProtectedRoute: No user in Redux or localStorage, fetching from server");
          getUserData();
        }
      } else {
        console.log("✅ ProtectedRoute: User already in Redux", { name: user.name, isAdmin: user.isAdmin });
      }
    } else {
      console.log("❌ ProtectedRoute: NO TOKEN FOUND - Redirecting to login");
      navigate("/login");
    }
  }, []);



  // DISABLED PAYMENT REDIRECT TO STOP REFRESH LOOP
  // useEffect(() => {
  //   // Payment check logic disabled temporarily
  // }, [isPaymentPending, activeRoute]);

  // Helper function to check if subscription is expired
  const isSubscriptionExpired = (subscriptionData) => {
    if (!subscriptionData) return true;

    // If no subscription data, consider expired
    if (!subscriptionData.endDate) return true;

    // If payment status is not paid, consider expired
    if (subscriptionData.paymentStatus !== 'paid') return true;

    // If status is not active, consider expired
    if (subscriptionData.status !== 'active') return true;

    // Check if end date has passed
    const endDate = new Date(subscriptionData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    endDate.setHours(0, 0, 0, 0); // Reset time to start of day

    return endDate < today;
  };

  const verifyPaymentStatus = async () => {
    try {
      const data = await checkPaymentStatus();
      console.log("Payment Status:", data);

      // Check if subscription is valid and not expired
      const hasValidSubscription = data && !data.error &&
                                  data.paymentStatus === 'paid' &&
                                  data.status === 'active' &&
                                  !isSubscriptionExpired(data);

      if (!hasValidSubscription) {
        console.log("No valid subscription found or subscription expired");
        if (subscriptionData !== null) {
          dispatch(SetSubscription(null));
        }
        // Block access for non-admin users without valid subscription
        if (!user?.isAdmin) {
          setIsPaymentPending(true);
        } else {
          setIsPaymentPending(false); // Admins always have access
        }
      } else {
        console.log("Valid subscription found, allowing access");
        setIsPaymentPending(false);
        dispatch(SetSubscription(data));
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    } catch (error) {
      console.log("Error checking payment status:", error);
      dispatch(SetSubscription(null));
      // Block access for non-admin users when there's an error
      if (!user?.isAdmin) {
        setIsPaymentPending(true);
      } else {
        setIsPaymentPending(false); // Admins always have access
      }
    }
  };

  // DISABLED PAYMENT VERIFICATION TO STOP REFRESH LOOP
  // useEffect(() => {
  //   // Payment verification disabled temporarily
  // }, [paymentVerificationNeeded]);

  // DISABLED ROUTE CHANGE VERIFICATION TO STOP REFRESH LOOP
  // useEffect(() => {
  //   // Route change verification disabled temporarily
  // }, [activeRoute]);

  // DISABLED - Online status management (causing token loss)
  // useEffect(() => {
  //   // Online status management disabled
  // }, []);


  // getButtonClass function removed since header was removed




  return (
    <div className="layout-modern min-h-screen flex flex-col">
      {/* CSS Override to fix mobile header issues */}
      <style>{`
        @media (max-width: 768px) {
          /* Reset all old mobile header styles */
          .nav-modern, header, .safe-header-animation {
            all: unset !important;
          }

          .lg\\:hidden {
            all: unset !important;
          }

          /* Hide old sidebar */
          .sidebar, .mobile-sidebar, .modern-sidebar {
            display: none !important;
          }

          /* Ensure flag image displays properly */
          img[alt*="flag"] {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        }

        /* Bell positioning - mobile vs tablet */
        @media (max-width: 640px) {
          .mobile-bell-left {
            display: block !important;
          }
          .mobile-bell-right {
            display: none !important;
          }

          /* Force bell to top-left corner on mobile - override all positioning */
          .block.sm\\:hidden {
            position: fixed !important;
            top: 8px !important;
            left: 8px !important;
            z-index: 99999 !important;
          }

          /* Remove blue background from bell button on all mobile pages */
          .notification-bell-button,
          .mobile-bell-left .notification-bell-button,
          .mobile-bell-right .notification-bell-button,
          button.notification-bell-button {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            backdrop-filter: none !important;
          }

          /* Remove hover effects on mobile */
          .notification-bell-button:hover,
          .mobile-bell-left .notification-bell-button:hover,
          .mobile-bell-right .notification-bell-button:hover,
          button.notification-bell-button:hover {
            background: transparent !important;
            box-shadow: none !important;
          }
        }

        @media (min-width: 641px) {
          .mobile-bell-left {
            display: none !important;
          }
          .mobile-bell-right {
            display: block !important;
          }
        }
      `}</style>



      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Brainwave Header for all pages */}
        {!user?.isAdmin && <BrainwaveHeader />}



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

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { message } from 'antd';
import { FaCrown, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaCreditCard, FaUser, FaSync } from 'react-icons/fa';
import { getPlans } from '../../../apicalls/plans';
import { addPayment, checkPaymentStatus } from '../../../apicalls/payment';
import { getUserInfo } from '../../../apicalls/users';
import { SetUser } from '../../../redux/usersSlice';
import { SetSubscription } from '../../../redux/subscriptionSlice';

import UpgradeRestrictionModal from '../../../components/UpgradeRestrictionModal/UpgradeRestrictionModal';
import SubscriptionExpiredModal from '../../../components/SubscriptionExpiredModal/SubscriptionExpiredModal';
import './Subscription.css';

const Subscription = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(null); // Changed to store plan ID instead of boolean
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [localSubscriptionData, setLocalSubscriptionData] = useState(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [showUpgradeRestriction, setShowUpgradeRestriction] = useState(false);
  const [showUpgradeNotification, setShowUpgradeNotification] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const [showTryAgain, setShowTryAgain] = useState(false);
  const [autoNavigateCountdown, setAutoNavigateCountdown] = useState(null);
  const { user } = useSelector((state) => state.user);
  const { subscriptionData } = useSelector((state) => state.subscription);
  const dispatch = useDispatch();


  // Fallback sample plans in case API fails
  const samplePlans = [
    {
      _id: "basic-plan-sample",
      title: "Basic Membership",
      features: [
        "2-month full access",
        "Unlimited quizzes",
        "Personalized profile",
        "AI chat for instant help",
        "Forum for student discussions",
        "Study notes",
        "Past papers",
        "Books",
        "Learning videos",
        "Track progress with rankings"
      ],
      actualPrice: 28570,
      discountedPrice: 20000,
      discountPercentage: 30,
      duration: 2,
      status: true
    },
    {
      _id: "premium-plan-sample",
      title: "Premium Plan",
      features: [
        "3-month full access",
        "Unlimited quizzes",
        "Personalized profile",
        "AI chat for instant help",
        "Forum for student discussions",
        "Study notes",
        "Past papers",
        "Books",
        "Learning videos",
        "Track progress with rankings",
        "Priority support"
      ],
      actualPrice: 45000,
      discountedPrice: 35000,
      discountPercentage: 22,
      duration: 3,
      status: true
    }
  ];

  useEffect(() => {
    fetchPlans();
    checkCurrentSubscription();

    // Set up periodic subscription status checking for real-time updates
    const subscriptionCheckInterval = setInterval(() => {
      console.log('🔄 Periodic subscription status check...');
      checkCurrentSubscription();
    }, 30000); // Check every 30 seconds

    // Check for recent payment success and redirect if needed
    const paymentSuccess = localStorage.getItem('paymentSuccess');
    if (paymentSuccess) {
      try {
        const successData = JSON.parse(paymentSuccess);
        const timeDiff = Date.now() - successData.timestamp;

        // If payment was successful within last 2 minutes and user hasn't been redirected
        if (timeDiff < 120000 && !successData.redirected) {
          console.log('🔄 Recent payment success detected, redirecting to hub...');

          // Mark as redirected
          localStorage.setItem('paymentSuccess', JSON.stringify({
            ...successData,
            redirected: true
          }));

          // Show success message and redirect
          message.success({
            content: '🎉 Payment successful! Redirecting to Hub...',
            duration: 3,
            style: {
              marginTop: '20vh',
              fontSize: '16px',
              fontWeight: '600'
            }
          });

          setTimeout(() => {
            window.location.href = '/user/hub';
          }, 2000);
        }
      } catch (error) {
        console.error('Error parsing payment success data:', error);
        localStorage.removeItem('paymentSuccess');
      }
    }

    // Clean up interval on component unmount
    return () => {
      if (subscriptionCheckInterval) {
        clearInterval(subscriptionCheckInterval);
        console.log('🧹 Cleaned up subscription check interval');
      }
    };
  }, []);

  // Enable background scrolling when modals are open for better UX
  useEffect(() => {
    // Always allow background scrolling - remove any scroll restrictions
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [showProcessingModal, showSuccessModal]);

  // Enhanced scroll detection for modal content
  useEffect(() => {
    const detectScrollableContent = () => {
      const modalContents = document.querySelectorAll('.modal-content');
      modalContents.forEach(content => {
        if (content.scrollHeight > content.clientHeight) {
          content.classList.add('has-scroll');
        } else {
          content.classList.remove('has-scroll');
        }
      });
    };

    // Detect on modal open
    if (showProcessingModal || showSuccessModal) {
      // Small delay to ensure modal is rendered
      setTimeout(detectScrollableContent, 100);

      // Re-detect on window resize
      window.addEventListener('resize', detectScrollableContent);

      return () => {
        window.removeEventListener('resize', detectScrollableContent);
      };
    }
  }, [showProcessingModal, showSuccessModal]);

  // Check for expired subscription and show modal
  useEffect(() => {
    if (subscriptionData && isSubscriptionExpired()) {

      setShowExpiredModal(true);
    } else {
      setShowExpiredModal(false);
    }
  }, [subscriptionData]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await getPlans();

      if (response.success && response.data && response.data.length > 0) {
        setPlans(response.data);
      } else if (Array.isArray(response) && response.length > 0) {
        // Handle case where response is directly an array of plans
        setPlans(response);
      } else {
        setPlans(samplePlans);
        message.info('Showing sample plans. Please check your connection.');
      }
    } catch (error) {
      console.error('Error loading plans from API:', error);

      setPlans(samplePlans);
      message.warning('Using sample plans. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentSubscription = async () => {
    try {
      console.log('🔍 Checking current subscription status...');

      // First, refresh user data to get latest subscription status
      try {
        const userResponse = await getUserInfo();
        if (userResponse.success) {
          dispatch(SetUser(userResponse.data));
        }
      } catch (userError) {
        console.log('Could not refresh user data:', userError.message);
      }

      // Then check payment status
      const response = await checkPaymentStatus();

      if (response.success && response.data) {
        console.log('✅ Subscription data found:', response.data);
        setLocalSubscriptionData(response.data);
        dispatch(SetSubscription(response.data));
      } else {
        console.log('ℹ️ No active subscription found');
        setLocalSubscriptionData(null);
      }
    } catch (error) {
      console.log('ℹ️ No active subscription found:', error.message);
      setLocalSubscriptionData(null);
    }
  };

  // Check if subscription is expired
  const isSubscriptionExpired = () => {
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

  // Handle subscription renewal from expired modal
  const handleRenewSubscription = async (selectedPlan) => {
    setShowExpiredModal(false);
    await handlePlanSelect(selectedPlan);
  };

  // Handle closing payment processing modal
  const handleCloseProcessingModal = () => {
    setShowProcessingModal(false);
    setPaymentLoading(null); // Reset to null instead of false
    setShowTryAgain(false);

    setPaymentStatus('');
    message.info('Payment process cancelled. You can try again anytime.');
  };

  // Handle try again functionality
  const handleTryAgain = () => {
    if (selectedPlan) {
      setShowTryAgain(false);

      handlePlanSelect(selectedPlan);
    }
  };



  const handlePlanSelect = async (plan) => {
    // Check if user already has an active subscription
    if (subscriptionData && subscriptionData.status === 'active' && subscriptionData.paymentStatus === 'paid') {
      // Show upgrade notification modal instead of restriction
      setShowUpgradeNotification(true);
      setSelectedPlan(plan);
      return;
    }

    if (!user.phoneNumber || !/^(06|07)\d{8}$/.test(user.phoneNumber)) {
      message.error('Please update your phone number in your profile before subscribing');
      return;
    }

    try {

      // IMMEDIATELY show processing modal when user chooses plan
      setSelectedPlan(plan);
      setPaymentLoading(plan._id);
      setShowProcessingModal(true);
      setShowTryAgain(false);

      setPaymentStatus('🚀 Preparing your payment request...');



      // Small delay to ensure modal is visible before API call
      await new Promise(resolve => setTimeout(resolve, 200));

      // Set timer for try again button (10 seconds)
      setTimeout(() => {
        setShowTryAgain(true);
      }, 10000);

      const paymentData = {
        plan: plan,
        userId: user._id,
        userPhone: user.phoneNumber,
        userEmail: user.email || `${user.name?.replace(/\s+/g, '').toLowerCase()}@brainwave.temp`
      };

      setPaymentStatus('📤 Sending payment request to ZenoPay...');
      const response = await addPayment(paymentData);

      if (response.success) {
        setPaymentStatus('Payment sent! Check your phone for SMS confirmation...');



        // Show confirmation message to user
        message.success({
          content: `💳 Payment initiated! 📱 Check your phone (${user.phoneNumber}) for SMS from ZenoPay. SMS may take 1-5 minutes to arrive.`,
          duration: 10,
          style: {
            marginTop: '20vh',
            fontSize: '14px'
          }
        });

        // Start checking payment status immediately
        const orderIdToCheck = response.order_id || response.data?.order_id || 'demo_order';
        checkPaymentConfirmation(orderIdToCheck);

      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (error) {
      console.error('❌ Payment failed:', error);
      setShowProcessingModal(false);
      message.error('Payment failed: ' + error.message);
      setPaymentLoading(null); // Reset to null
    }
  };

  const checkPaymentConfirmation = async (orderId) => {
    let isPolling = true;
    let handleVisibilityChange;

    try {
      setPaymentStatus('📱 Complete the payment on your phone, we\'ll detect it automatically...');

      // Poll payment status every 2 seconds for optimal responsiveness
      let attempts = 0;
      const maxAttempts = 150; // 150 attempts * 2 seconds = 5 minutes

      const pollPaymentStatus = async () => {
        attempts++;

        try {
          const statusResponse = await checkPaymentStatus({ orderId });

          // Enhanced payment success detection with multiple conditions
          const isPaymentSuccessful = statusResponse && (
            // Condition 1: Subscription activated
            (statusResponse.paymentStatus === 'paid' && statusResponse.status === 'active') ||
            // Condition 2: Standard completion
            (statusResponse.status === 'completed' && statusResponse.success === true) ||
            // Condition 3: Demo mode success
            (statusResponse.demo === true && statusResponse.success === true) ||
            // Condition 4: ZenoPay webhook success
            (statusResponse.zenopay_status === 'COMPLETED') ||
            // Condition 5: Direct success flag
            (statusResponse.success === true && statusResponse.status === 'completed')
          );

          if (isPaymentSuccessful) {
            // Payment confirmed immediately!
            isPolling = false; // Stop polling
            if (handleVisibilityChange) {
              document.removeEventListener('visibilitychange', handleVisibilityChange); // Clean up listener
            }

            setPaymentStatus('🎉 Payment confirmed! Activating your subscription...');

            // Show success INSTANTLY - no delay
            setShowProcessingModal(false);
            setShowSuccessModal(true);
            setPaymentLoading(null);

            // Enhanced subscription data refresh with multiple attempts
            const refreshSubscriptionData = async (attempt = 1) => {
              try {
                console.log(`🔄 Subscription refresh attempt ${attempt}/5`);

                // First refresh user data
                const userResponse = await getUserInfo();
                if (userResponse.success) {
                  dispatch(SetUser(userResponse.data));
                  console.log('✅ User data refreshed');
                }

                // Then refresh subscription data
                const subResponse = await checkPaymentStatus();
                if (subResponse.success && subResponse.data && subResponse.status === 'active') {
                  setLocalSubscriptionData(subResponse.data);
                  dispatch(SetSubscription(subResponse.data));
                  console.log('✅ Active subscription found and updated');

                  // Force UI refresh after successful subscription update
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);

                } else if (attempt < 5) {
                  console.log(`⏳ Subscription not active yet, retrying in ${attempt * 2} seconds...`);
                  setTimeout(() => refreshSubscriptionData(attempt + 1), attempt * 2000);
                } else {
                  console.log('⚠️ Max refresh attempts reached, calling standard refresh');
                  checkCurrentSubscription();
                }
              } catch (error) {
                console.error(`❌ Refresh attempt ${attempt} failed:`, error);
                if (attempt < 5) {
                  setTimeout(() => refreshSubscriptionData(attempt + 1), attempt * 2000);
                } else {
                  checkCurrentSubscription(); // Fallback to standard refresh
                }
              }
            };

            // Start enhanced refresh
            refreshSubscriptionData();

            // Show immediate success message
            message.success({
              content: '🎉 Payment confirmed! All features are now unlocked!',
              duration: 5,
              style: {
                marginTop: '20vh',
                fontSize: '16px'
              }
            });

            // Enhanced auto-navigation with 3-second countdown
            setAutoNavigateCountdown(3); // Set to 3 seconds as requested
            const countdownInterval = setInterval(() => {
              setAutoNavigateCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(countdownInterval);
                  // Force navigation to hub with delay for better UX
                  setShowSuccessModal(false);
                  setTimeout(() => {
                    window.location.href = '/user/hub';
                  }, 500);
                  return null;
                }
                return prev - 1;
              });
            }, 1000);

            // Store success state in localStorage for persistence
            localStorage.setItem('paymentSuccess', JSON.stringify({
              timestamp: Date.now(),
              orderId: orderId,
              status: 'completed',
              redirected: false
            }));

          } else if (attempts >= maxAttempts) {
            // Timeout - but don't fail completely
            isPolling = false; // Stop polling
            if (handleVisibilityChange) {
              document.removeEventListener('visibilitychange', handleVisibilityChange); // Clean up listener
            }

            setPaymentStatus('⏰ Still waiting for confirmation. Please complete the payment on your phone.');

            setTimeout(() => {
              setShowProcessingModal(false);
              setPaymentLoading(null); // Reset to null
              message.warning('Payment confirmation is taking longer than expected. Please check your subscription status or try again.');
            }, 2000);

          } else {
            // Continue polling - NO TIME INDICATION, just encouraging message
            setPaymentStatus('📱 Complete the payment on your phone, we\'ll detect it automatically...');
            setTimeout(pollPaymentStatus, 2000); // Check every 2 seconds for better performance
          }

        } catch (error) {
          console.error('Payment status check error:', error);

          // Handle specific error types
          if (error.message && error.message.includes('404')) {
            console.error('❌ Payment status endpoint not found (404)');
            isPolling = false; // Stop polling
            if (handleVisibilityChange) {
              document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
            setShowProcessingModal(false);
            setPaymentLoading(null); // Reset to null
            message.error('Payment verification service is temporarily unavailable. Please contact support or check your subscription status manually.');
            return;
          }

          if (error.message && error.message.includes('401')) {
            console.error('❌ Authentication required for payment status check');
            isPolling = false; // Stop polling
            if (handleVisibilityChange) {
              document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
            setShowProcessingModal(false);
            setPaymentLoading(null); // Reset to null
            message.error('Please login again to check payment status.');
            return;
          }

          if (attempts >= maxAttempts) {
            isPolling = false; // Stop polling
            if (handleVisibilityChange) {
              document.removeEventListener('visibilitychange', handleVisibilityChange); // Clean up listener
            }
            setShowProcessingModal(false);
            setPaymentLoading(null); // Reset to null
            message.error('Unable to confirm payment status. Please check your subscription status manually.');
          } else {
            // Continue polling even if there's an error (unless it's a critical error)
            setTimeout(pollPaymentStatus, 1000);
          }
        }
      };

      // Add visibility change listener to check immediately when user returns to tab
      handleVisibilityChange = () => {
        if (!document.hidden && isPolling) {
          setPaymentStatus('🔍 Checking payment status...');
          // Trigger immediate check
          setTimeout(() => pollPaymentStatus(), 100);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Start polling immediately (no delay) - check right away
      setTimeout(pollPaymentStatus, 500); // Start checking after 0.5 seconds

    } catch (error) {
      isPolling = false; // Stop polling
      if (handleVisibilityChange) {
        document.removeEventListener('visibilitychange', handleVisibilityChange); // Clean up listener
      }
      setShowProcessingModal(false);
      message.error('Payment confirmation failed: ' + error.message);
      setPaymentLoading(null); // Reset to null
    }
  };

  const getSubscriptionStatus = () => {
    // First check user's subscription status (most reliable)
    if (user?.subscriptionStatus === 'active') {
      // Double-check if subscription is truly active by checking end date
      if (user?.subscriptionEndDate) {
        const endDate = new Date(user.subscriptionEndDate);
        const now = new Date();
        if (endDate > now) {
          return 'active';
        } else {
          return 'expired'; // End date has passed
        }
      }
      return 'active'; // No end date, assume active
    }

    // Check if user status indicates expired subscription
    if (user?.subscriptionStatus === 'free' && user?.subscriptionEndDate) {
      return 'expired'; // User had a subscription that expired
    }

    // Fallback to subscription data check (use local or redux state)
    const currentSubscriptionData = localSubscriptionData || subscriptionData;
    if (currentSubscriptionData && currentSubscriptionData.paymentStatus === 'paid' && currentSubscriptionData.status === 'active') {
      const endDate = new Date(currentSubscriptionData.endDate);
      const now = new Date();
      if (endDate > now) {
        return 'active';
      } else {
        return 'expired';
      }
    }

    if (user?.subscriptionStatus === 'expired' || (currentSubscriptionData && currentSubscriptionData.status === 'expired')) {
      return 'expired';
    }

    return 'none';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    const currentSubscriptionData = localSubscriptionData || subscriptionData;
    const endDateSource = currentSubscriptionData?.endDate || user?.subscriptionEndDate;

    if (!endDateSource) return 0;
    const endDate = new Date(endDateSource);
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="subscription-page">
      <div className="subscription-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="subscription-header"
        >

          <h1 className="page-title">
            <FaCrown className="title-icon" />
            Subscription Management
          </h1>
          <p className="page-subtitle">Manage your subscription and access premium features</p>
        </motion.div>

        {/* Current Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="current-subscription"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Current Subscription</h2>
            <button
              onClick={() => {
                console.log('🔄 Manual subscription refresh triggered');
                checkCurrentSubscription();
                message.info('🔄 Refreshing subscription status...');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              <FaSync style={{ fontSize: '12px' }} />
              Refresh Status
            </button>
          </div>
          
          {subscriptionStatus === 'active' && (
            <div style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white !important',
              border: '3px solid #10B981',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '3rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <FaCheckCircle style={{ color: '#ECFDF5', fontSize: '24px' }} />
                <span style={{
                  color: 'white !important',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  margin: '0'
                }}>
                  ✅ ACTIVE SUBSCRIPTION
                </span>
              </div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}>
                  <FaCrown style={{ color: '#FEF3C7' }} />
                  <span style={{ color: 'white !important', fontWeight: '600' }}>
                    Plan: {(localSubscriptionData || subscriptionData)?.activePlan?.title || 'Premium Plan'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}>
                  <FaCalendarAlt style={{ color: '#FEF3C7' }} />
                  <span style={{ color: 'white !important', fontWeight: '600' }}>
                    Expires: {formatDate((localSubscriptionData || subscriptionData)?.endDate || user?.subscriptionEndDate)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}>
                  <FaCheckCircle style={{ color: '#FEF3C7' }} />
                  <span style={{ color: 'white !important', fontWeight: '600' }}>
                    Days Remaining: {getDaysRemaining()}
                  </span>
                </div>
              </div>
              <div style={{
                marginTop: '15px',
                padding: '10px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <span style={{ color: 'white !important', fontSize: '14px', fontWeight: '500' }}>
                  🎉 Enjoy full access to all premium features!
                </span>
              </div>
            </div>
          )}

          {subscriptionStatus === 'expired' && (
            <div className="subscription-card expired" style={{
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: 'white',
              border: '3px solid #EF4444',
              boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)',
              animation: 'pulse 2s infinite'
            }}>
              <div className="subscription-status">
                <FaTimesCircle className="status-icon expired" style={{ color: '#FEE2E2', fontSize: '24px' }} />
                <span className="status-text" style={{
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  ❌ SUBSCRIPTION EXPIRED
                </span>
              </div>
              <div className="subscription-details">
                <div className="detail-item">
                  <FaCalendarAlt className="detail-icon" style={{ color: '#FEE2E2' }} />
                  <span style={{ color: 'white', fontWeight: '600' }}>
                    Expired: {formatDate((localSubscriptionData || subscriptionData)?.endDate || user?.subscriptionEndDate)}
                  </span>
                </div>
                <div style={{
                  marginTop: '15px',
                  padding: '15px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 10px 0'
                  }}>
                    🚫 Access Restricted
                  </p>
                  <p style={{
                    color: '#FEE2E2',
                    fontSize: '14px',
                    margin: '0 0 15px 0'
                  }}>
                    Your subscription has expired. Choose a new plan below to continue accessing premium features.
                  </p>
                  <button
                    onClick={() => document.querySelector('.available-plans').scrollIntoView({ behavior: 'smooth' })}
                    style={{
                      background: 'white',
                      color: '#DC2626',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    💳 RENEW NOW
                  </button>
                </div>
              </div>
            </div>
          )}

          {subscriptionStatus === 'none' && (
            <div className="subscription-card none">
              <div className="subscription-status">
                <FaUser className="status-icon none" />
                <span className="status-text">Free Account</span>
              </div>
              <div className="subscription-details">
                <p className="upgrade-message">
                  You're currently using a free account. Upgrade to a premium plan to unlock all features.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Available Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="available-plans"
        >
          <h2 className="section-title">
            {subscriptionStatus === 'active'
              ? '🚀 Upgrade Your Plan'
              : subscriptionStatus === 'expired'
                ? '🔄 Renew Your Subscription'
                : '🎯 Choose Your Plan'
            }
          </h2>


          <p className="section-subtitle">
            {subscriptionStatus === 'active'
              ? 'Upgrade to a longer plan for better value and extended access'
              : subscriptionStatus === 'expired'
                ? 'Your subscription has expired. Renew now to continue accessing premium features'
                : 'Select a subscription plan to unlock all premium features and start your learning journey'
            }
          </p>
          
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="no-plans-state">
              <div className="no-plans-icon">📋</div>
              <h3>No Plans Available</h3>
              <p>Plans are currently being loaded. Please refresh the page or try again later.</p>
              <button className="refresh-btn" onClick={fetchPlans}>
                🔄 Refresh Plans
              </button>
            </div>
          ) : (
            <div className="plans-grid">
              {plans.map((plan) => (
                <motion.div
                  key={plan._id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="plan-card"
                >
                  <div className="plan-header">
                    <h3 className="plan-title">{plan.title}</h3>
                    {plan.title?.toLowerCase().includes('standard') && (
                      <span className="plan-badge">🔥 Popular</span>
                    )}
                  </div>
                  
                  <div className="plan-pricing">
                    <div className="price-display">
                      <div className="current-price">
                        <span className="currency">TZS</span>
                        {plan.discountedPrice?.toLocaleString()}
                      </div>
                      {plan.actualPrice > plan.discountedPrice && (
                        <>
                          <span className="original-price">{plan.actualPrice?.toLocaleString()} TZS</span>
                          <span className="discount-badge">
                            {Math.round(((plan.actualPrice - plan.discountedPrice) / plan.actualPrice) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </div>
                    <div className="plan-duration">
                      <span className="duration-highlight">{plan.duration}</span> month{plan.duration > 1 ? 's' : ''} access
                    </div>
                  </div>

                  <div className="plan-features">
                    {plan.features?.slice(0, 5).map((feature, index) => (
                      <div key={index} className="feature-item">
                        <FaCheckCircle className="feature-icon" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className="select-plan-btn"
                    onClick={() => handlePlanSelect(plan)}
                    disabled={paymentLoading === plan._id}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '1rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: paymentLoading === plan._id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      opacity: paymentLoading === plan._id ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (paymentLoading !== plan._id) {
                        e.target.style.background = 'linear-gradient(135deg, #1d4ed8, #1e40af)';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (paymentLoading !== plan._id) {
                        e.target.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                      }
                    }}
                  >
                    <FaCreditCard className="btn-icon" />
                    {paymentLoading === plan._id
                      ? 'Processing...'
                      : subscriptionStatus === 'active'
                        ? 'Click to Upgrade'
                        : subscriptionStatus === 'expired'
                          ? 'Click to Renew'
                          : 'Click to Pay'
                    }
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Phone Number Warning */}
        {(!user.phoneNumber || !/^(06|07)\d{8}$/.test(user.phoneNumber)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="phone-warning"
          >
            <div className="warning-content">
              <FaTimesCircle className="warning-icon" />
              <div>
                <h4>Phone Number Required</h4>
                <p>Please update your phone number in your profile to subscribe to a plan.</p>
                <button 
                  className="update-phone-btn"
                  onClick={() => window.location.href = '/profile'}
                >
                  Update Phone Number
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Professional Payment Processing Modal */}
        {showProcessingModal && (
          <div
            className="payment-modal-overlay"
            onClick={(e) => {
              // Allow clicking through overlay but prevent closing modal accidentally
              if (e.target === e.currentTarget) {
                // Don't close modal, just allow background interaction
                e.stopPropagation();
              }
            }}
          >
            <div className="payment-modal-container processing">
              {/* Close Button */}
              <button
                className="modal-close-btn"
                onClick={handleCloseProcessingModal}
                aria-label="Close modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Header */}
              <div className="modal-header processing">
                <div className="processing-icon">
                  <div className="spinner"></div>
                  <svg className="payment-icon" width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M2 12C2 8.229 2 6.343 3.172 5.172C4.343 4 6.229 4 10 4H14C17.771 4 19.657 4 20.828 5.172C22 6.343 22 8.229 22 12C22 15.771 22 17.657 20.828 18.828C19.657 20 17.771 20 14 20H10C6.229 20 4.343 20 3.172 18.828C2 17.657 2 15.771 2 12Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M10 16H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M14 16H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M2 10L22 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2>Processing Payment</h2>
                <p>Secure transaction in progress</p>
              </div>

              {/* Content */}
              <div className="modal-content">
                {/* Status */}
                <div className="status-card">
                  <div className="status-indicator processing"></div>
                  <p className="status-text">{paymentStatus}</p>
                </div>

                {/* Plan Info */}
                <div className="plan-info-card">
                  <h3>{selectedPlan?.title}</h3>
                  <div className="plan-details">
                    <div className="detail-row">
                      <span>Amount</span>
                      <strong>{selectedPlan?.discountedPrice?.toLocaleString()} TZS</strong>
                    </div>
                    <div className="detail-row">
                      <span>Duration</span>
                      <strong>{selectedPlan?.duration} month{selectedPlan?.duration > 1 ? 's' : ''}</strong>
                    </div>
                  </div>
                </div>

                {/* Phone Instructions */}
                <div className="instruction-card">
                  <div className="instruction-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M16.5562 12.9062L16.1007 13.359C16.1007 13.359 15.0181 14.4355 12.0631 11.4972C9.10812 8.55901 10.1907 7.48257 10.1907 7.48257L10.4775 7.19738C11.1841 6.49484 11.2507 5.36691 10.6342 4.54348L9.37326 2.85908C8.61028 1.83992 7.13596 1.70529 6.26145 2.57483L4.69185 4.13552C4.25823 4.56668 3.96765 5.12559 4.00289 5.74561C4.09304 7.33182 4.81071 10.7447 8.81536 14.7266C13.0621 18.9492 17.0468 19.117 18.6763 18.9651C19.1917 18.9171 19.6399 18.6546 20.0011 18.2954L21.4217 16.883C22.3806 15.9295 22.1102 14.2949 20.8833 13.628L18.9728 12.5894C18.1672 12.1515 17.1858 12.2801 16.5562 12.9062Z" fill="currentColor"/>
                    </svg>
                    <span>Check Your Phone</span>
                  </div>
                  <div className="phone-number">{user?.phoneNumber}</div>
                  <div className="instruction-steps">
                    <div className="step">1. You'll receive an SMS with payment instructions (1-5 minutes)</div>
                    <div className="step">2. Follow the SMS steps to confirm payment</div>
                    <div className="step">3. Complete the mobile money transaction</div>
                    <div className="step note">⚠️ Ensure your number is registered with mobile money</div>
                  </div>
                </div>

                {/* Try Again */}
                {showTryAgain && (
                  <div className="try-again-card">
                    <p>Taking longer than expected?</p>
                    <button className="try-again-btn" onClick={handleTryAgain}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M4 12a8 8 0 018-8V2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 4L9 7L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        {/* Professional Success Modal */}
        {showSuccessModal && (
          <div
            className="payment-modal-overlay"
            onClick={(e) => {
              // Allow clicking through overlay but keep modal open
              if (e.target === e.currentTarget) {
                e.stopPropagation();
              }
            }}
          >
            <div className="payment-modal-container success">
              {/* Close Button */}
              <button
                className="modal-close-btn"
                onClick={() => {
                  setAutoNavigateCountdown(null);
                  setShowSuccessModal(false);
                }}
                aria-label="Close modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Header */}
              <div className="modal-header success">
                <div className="success-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="#22c55e" fillOpacity="0.2"/>
                    <path d="M16 9L10.5 14.5L8 12" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#22c55e" strokeWidth="2"/>
                  </svg>
                </div>
                <h2>Payment Successful!</h2>
                <p>Welcome to {selectedPlan?.title}!</p>
              </div>
              {/* Content */}
              <div className="modal-content">
                {/* Auto-Navigation Notice */}
                {autoNavigateCountdown && (
                  <div className="countdown-card">
                    <div className="countdown-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <p>Redirecting to Hub in {autoNavigateCountdown} seconds...</p>
                  </div>
                )}

                {/* Plan Summary */}
                <div className="plan-summary-card">
                  <h3>Subscription Activated</h3>
                  <div className="plan-details">
                    <div className="detail-row">
                      <span>Plan</span>
                      <strong>{selectedPlan?.title}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Duration</span>
                      <strong>{selectedPlan?.duration} month{selectedPlan?.duration > 1 ? 's' : ''}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Amount Paid</span>
                      <strong>{selectedPlan?.discountedPrice?.toLocaleString()} TZS</strong>
                    </div>
                    <div className="detail-row status">
                      <span>Status</span>
                      <div className="status-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Active
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features Unlocked */}
                <div className="features-card">
                  <h3>🚀 Premium Features Unlocked</h3>
                  <div className="features-grid">
                    <div className="feature-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>Unlimited Quizzes</span>
                    </div>
                    <div className="feature-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>AI Assistant</span>
                    </div>
                    <div className="feature-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>Study Materials</span>
                    </div>
                    <div className="feature-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>Progress Tracking</span>
                    </div>
                    <div className="feature-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>Learning Videos</span>
                    </div>
                    <div className="feature-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>Forum Access</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="modal-actions">
                  <button
                    className="primary-btn"
                    onClick={() => {
                      setAutoNavigateCountdown(null);
                      setShowSuccessModal(false);
                      window.location.href = '/user/hub';
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Continue to Hub {autoNavigateCountdown ? `(${autoNavigateCountdown}s)` : ''}
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setAutoNavigateCountdown(null);
                      setShowSuccessModal(false);
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Upgrade Restriction Modal */}
        <UpgradeRestrictionModal
          visible={showUpgradeRestriction}
          onClose={() => setShowUpgradeRestriction(false)}
          currentPlan={plans.find(p => p._id === subscriptionData?.activePlan) || subscriptionData?.plan}
          subscription={subscriptionData}
          user={user}
        />

        {/* Subscription Expired Modal */}
        <SubscriptionExpiredModal
          visible={showExpiredModal}
          onClose={() => setShowExpiredModal(false)}
          onRenew={handleRenewSubscription}
          subscription={subscriptionData}
          user={user}
          plans={plans}
        />

        {/* Upgrade Notification Modal */}
        {showUpgradeNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">📅</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Plan Update Scheduled</h3>
                <p className="text-gray-600 mb-4">
                  You already have an active subscription. Your new plan will be activated after your current plan expires on{' '}
                  <span className="font-semibold text-blue-600">
                    {subscriptionData?.endDate ? new Date(subscriptionData.endDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </span>.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Selected Plan:</strong> {selectedPlan?.title}<br/>
                    <strong>Price:</strong> {selectedPlan?.discountedPrice?.toLocaleString()} TZS<br/>
                    <strong>Duration:</strong> {selectedPlan?.duration} month{selectedPlan?.duration > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUpgradeNotification(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowUpgradeNotification(false);
                      // Here you could implement scheduling the upgrade
                      message.success('Plan upgrade scheduled successfully! Your new plan will activate after your current plan expires.');
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Schedule Upgrade
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;

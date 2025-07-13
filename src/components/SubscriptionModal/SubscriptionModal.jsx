import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { message } from 'antd';
import { getPlans } from '../../apicalls/plans';
import { addPayment, checkPaymentStatus } from '../../apicalls/payment';
import { updateUserInfo } from '../../apicalls/users';
import axiosInstance from '../../apicalls/index';
import { SetSubscription } from '../../redux/subscriptionSlice';
import { SetUser } from '../../redux/usersSlice';
import { HideLoading, ShowLoading } from '../../redux/loaderSlice';
import UpgradeRestrictionModal from '../UpgradeRestrictionModal/UpgradeRestrictionModal';
import './SubscriptionModal.css';

const SubscriptionModal = ({ isOpen, onClose, onSuccess }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [step, setStep] = useState('plans'); // 'plans', 'payment'
  const [showUpgradeRestriction, setShowUpgradeRestriction] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState(null);
  const [showTryAgain, setShowTryAgain] = useState(false);

  // Check if user has valid phone number
  const hasValidPhone = () => {
    const phone = user?.phoneNumber;
    return phone && /^(06|07)\d{8}$/.test(phone);
  };


  
  const { user } = useSelector((state) => state.user);
  const { subscriptionData } = useSelector((state) => state.subscription);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await getPlans();
      setPlans(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      message.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    // Check if user already has an active subscription
    if (subscriptionData && subscriptionData.status === 'active' && subscriptionData.paymentStatus === 'paid') {
      console.log('🚫 User already has active subscription:', subscriptionData);
      setShowUpgradeRestriction(true);
      return;
    }

    setSelectedPlan(plan);
    setStep('payment');
  };

  // Handle closing payment processing modal
  const handleCloseProcessingModal = () => {
    setStep('plans');
    setPaymentLoading(false);
    setShowTryAgain(false);
    setProcessingStartTime(null);
    dispatch(HideLoading());
    message.info('Payment process cancelled. You can try again anytime.');
  };

  // Handle try again functionality
  const handleTryAgain = () => {
    if (selectedPlan) {
      setShowTryAgain(false);
      setProcessingStartTime(null);
      handlePayment();
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      message.error('Please select a plan first');
      return;
    }

    if (!hasValidPhone()) {
      message.error('Please update your phone number in your profile first. Go to Profile → Edit → Phone Number');
      return;
    }

    try {
      setPaymentLoading(true);
      setShowTryAgain(false);
      setProcessingStartTime(Date.now());
      dispatch(ShowLoading());

      // Set timer for try again button (10 seconds)
      const tryAgainTimer = setTimeout(() => {
        setShowTryAgain(true);
      }, 10000);

      const paymentData = {
        plan: selectedPlan,
        userId: user._id,
        userPhone: user.phoneNumber, // Use phone number from user profile
        userEmail: user.email || `${user.name?.replace(/\s+/g, '').toLowerCase()}@brainwave.temp`
      };

      const response = await addPayment(paymentData);

      if (response.success) {
        message.success('Payment initiated! Please check your phone for SMS confirmation.');

        // Close modal and start checking payment status
        onClose();

        // Start checking payment status
        checkPaymentConfirmation(response.order_id);
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      message.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
      dispatch(HideLoading());
    }
  };

  const checkPaymentConfirmation = async (orderId) => {
    let attempts = 0;
    const maxAttempts = 150; // 5 minutes (150 attempts * 2 seconds)

    const checkStatus = async () => {
      try {
        attempts++;
        console.log(`🔍 Checking payment status... Attempt ${attempts}/${maxAttempts}`);

        const response = await checkPaymentStatus();
        console.log('📥 Payment status response:', response);

        // Handle specific error cases
        if (response && response.error) {
          if (response.error === 'ENDPOINT_NOT_FOUND') {
            console.error('❌ Payment status endpoint not found');
            message.error('Payment verification service is temporarily unavailable. Please contact support.');
            setStep('plans'); // Return to plans step
            return;
          }

          if (response.error === 'AUTH_REQUIRED') {
            console.error('❌ Authentication required for payment status');
            message.error('Please login again to check payment status.');
            setStep('plans'); // Return to plans step
            return;
          }
        }

        if (response && !response.error && (
          (response.paymentStatus === 'paid' && response.status === 'active') ||
          (response.status === 'completed' && response.success === true)
        )) {
          console.log('✅ Payment confirmed! Showing success instantly...');

          // Update Redux store
          dispatch(SetSubscription(response));

          // Show success message with celebration - INSTANTLY
          message.success({
            content: '🎉 Payment Confirmed! Welcome to Premium!',
            duration: 5,
            style: {
              marginTop: '20vh',
              fontSize: '16px',
              fontWeight: '600'
            }
          });

          // Trigger success callback immediately
          onSuccess && onSuccess();

          // Close modal immediately - no delay
          onClose();

          return true;
        }

        if (attempts >= maxAttempts) {
          console.log('⏰ Payment check timeout reached');
          message.warning({
            content: 'Payment is still processing. Your subscription will activate automatically when payment is complete.',
            duration: 8
          });
          return false;
        }

        // Continue checking - every 2 seconds for better performance
        setTimeout(checkStatus, 2000);
      } catch (error) {
        console.error('❌ Error checking payment status:', error);
        if (attempts >= maxAttempts) {
          message.error('Unable to verify payment. Please contact support if payment was completed.');
        } else {
          setTimeout(checkStatus, 2000);
        }
      }
    };

    // Start checking immediately
    checkStatus();
  };

  const handleClose = () => {
    setStep('plans');
    setSelectedPlan(null);
    setPaymentLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="subscription-modal-overlay">
      <div className="subscription-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {step === 'plans' && '🚀 Choose Your Learning Plan'}
            {step === 'payment' && '💳 Complete Your Payment'}
          </h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <div className="modal-content">
          {step === 'plans' && (
            <div className="plans-grid">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading plans...</p>
                </div>
              ) : (
                plans.map((plan) => (
                  <div key={plan._id} className="plan-card" onClick={() => handlePlanSelect(plan)}>
                    <div className="plan-header">
                      <h3 className="plan-title">{plan.title}</h3>
                      {plan.title?.toLowerCase().includes('standard') && (
                        <span className="plan-badge">🔥 Popular</span>
                      )}
                    </div>
                    
                    <div className="plan-price">
                      <span className="price-amount">{plan.discountedPrice?.toLocaleString()} TZS</span>
                      {plan.actualPrice && plan.actualPrice !== plan.discountedPrice && (
                        <span className="price-original">{plan.actualPrice.toLocaleString()} TZS</span>
                      )}
                      <span className="price-period">{plan.duration} month{plan.duration > 1 ? 's' : ''}</span>
                    </div>

                    <div className="plan-features">
                      {plan.features?.slice(0, 4).map((feature, index) => (
                        <div key={index} className="feature">
                          <span className="feature-icon">✓</span>
                          <span className="feature-text">{feature}</span>
                        </div>
                      ))}
                      {plan.features?.length > 4 && (
                        <div className="feature">
                          <span className="feature-icon">+</span>
                          <span className="feature-text">{plan.features.length - 4} more features</span>
                        </div>
                      )}
                    </div>

                    <button className="select-plan-btn">
                      Choose {plan.title}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {step === 'payment' && selectedPlan && (
            <div className="payment-step">
              <div className="selected-plan-summary">
                <h3>Selected Plan: {selectedPlan.title}</h3>
                <p className="plan-price-summary">
                  {selectedPlan.discountedPrice?.toLocaleString()} TZS for {selectedPlan.duration} month{selectedPlan.duration > 1 ? 's' : ''}
                </p>
              </div>

              <div className="payment-info">
                <div className="info-item">
                  <span className="info-label">Phone Number:</span>
                  <div className="phone-display-simple">
                    {hasValidPhone() ? (
                      <span className="info-value valid-phone">
                        {user.phoneNumber} ✅
                      </span>
                    ) : (
                      <div className="invalid-phone-warning">
                        <span className="info-value invalid-phone">
                          {user?.phoneNumber || 'No phone number set'} ❌
                        </span>
                        <button
                          className="update-phone-btn"
                          onClick={() => {
                            message.info('Redirecting to profile to update phone number...');
                            setTimeout(() => {
                              window.open('/user/profile', '_blank');
                            }, 1000);
                          }}
                        >
                          Update in Profile
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="info-item">
                  <span className="info-label">Payment Method:</span>
                  <span className="info-value">Mobile Money (M-Pesa, Tigo Pesa, Airtel Money)</span>
                </div>

                {hasValidPhone() && (
                  <div className="payment-note">
                    <p>💡 Payment SMS will be sent to your phone number above.</p>
                  </div>
                )}
              </div>

              <div className="payment-actions">
                <button className="back-btn" onClick={() => setStep('plans')}>
                  ← Back to Plans
                </button>
                <button
                  className="pay-btn"
                  onClick={handlePayment}
                  disabled={paymentLoading || !hasValidPhone()}
                >
                  {paymentLoading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Processing...
                    </>
                  ) : !hasValidPhone() ? (
                    'Update phone number first'
                  ) : (
                    `Pay ${selectedPlan.discountedPrice?.toLocaleString()} TZS`
                  )}
                </button>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Upgrade Restriction Modal */}
      <UpgradeRestrictionModal
        visible={showUpgradeRestriction}
        onClose={() => setShowUpgradeRestriction(false)}
        currentPlan={plans.find(p => p._id === subscriptionData?.activePlan) || subscriptionData?.plan}
        subscription={subscriptionData}
        user={user}
      />
    </div>
  );
};

export default SubscriptionModal;

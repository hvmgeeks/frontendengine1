import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import SubscriptionExpiredModal from '../SubscriptionExpiredModal/SubscriptionExpiredModal';
import { getPlans } from '../../apicalls/plans';
import { addPayment } from '../../apicalls/payment';
import { ShowLoading, HideLoading } from '../../redux/loaderSlice';

const ProtectedRoute = ({ children }) => {
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useSelector((state) => state.user);
  const { subscriptionData } = useSelector((state) => state.subscription);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Pages that are always accessible (even with expired subscription)
  const allowedPages = ['/subscription', '/profile', '/logout'];
  
  // Check if current page is allowed
  const isAllowedPage = allowedPages.some(page => 
    location.pathname === page || location.pathname.startsWith(page)
  );

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

  // Fetch plans for the expired modal
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await getPlans();
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle subscription renewal
  const handleRenewSubscription = async (selectedPlan) => {
    try {
      dispatch(ShowLoading());
      
      // Validate phone number
      if (!user.phoneNumber || !/^(06|07)\d{8}$/.test(user.phoneNumber)) {
        message.error('Please update your phone number in your profile before subscribing');
        navigate('/profile');
        return;
      }

      const paymentData = {
        plan: selectedPlan,
        userId: user._id,
        userPhone: user.phoneNumber,
        userEmail: user.email || `${user.firstName?.replace(/\s+/g, '').toLowerCase()}@brainwave.temp`
      };

      const response = await addPayment(paymentData);

      if (response.success) {
        message.success('Payment initiated! Please check your phone for SMS confirmation.');
        setShowExpiredModal(false);
        navigate('/subscription');
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      message.error(error.message || 'Payment failed. Please try again.');
    } finally {
      dispatch(HideLoading());
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowExpiredModal(false);
    // Redirect to subscription page if trying to access restricted content
    if (!isAllowedPage) {
      navigate('/subscription');
    }
  };

  // Check subscription status on route change
  useEffect(() => {
    // Only check if user is logged in
    if (!user) return;
    
    // If on allowed page, don't show modal
    if (isAllowedPage) return;
    
    // If subscription is expired, show modal
    if (isSubscriptionExpired()) {
      setShowExpiredModal(true);
      fetchPlans();
    }
  }, [location.pathname, subscriptionData, user]);

  // If user is not logged in, render children (let auth handle it)
  if (!user) {
    return children;
  }

  // If on allowed page, always render children
  if (isAllowedPage) {
    return (
      <>
        {children}
        <SubscriptionExpiredModal
          visible={showExpiredModal}
          onClose={handleModalClose}
          onRenew={handleRenewSubscription}
          subscription={subscriptionData}
          user={user}
          plans={plans}
        />
      </>
    );
  }

  // If subscription is active, render children
  if (!isSubscriptionExpired()) {
    return children;
  }

  // If subscription is expired and trying to access restricted page
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div>
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
          🔒 Premium Access Required
        </h2>
        <p style={{ fontSize: '16px', marginBottom: '24px', opacity: 0.9 }}>
          Your subscription has expired. Please renew to continue accessing this content.
        </p>
        <button
          onClick={() => navigate('/subscription')}
          style={{
            background: 'white',
            color: '#667eea',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Go to Subscription
        </button>
      </div>

      <SubscriptionExpiredModal
        visible={showExpiredModal}
        onClose={handleModalClose}
        onRenew={handleRenewSubscription}
        subscription={subscriptionData}
        user={user}
        plans={plans}
      />
    </div>
  );
};

export default ProtectedRoute;

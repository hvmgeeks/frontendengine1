import React, { useState } from 'react';
import { Modal, Button, Progress } from 'antd';
import {
  ClockCircleOutlined,
  CrownOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  RocketOutlined,
  StarOutlined
} from '@ant-design/icons';
import './SubscriptionExpiredModal.css';

const SubscriptionExpiredModal = ({ 
  visible, 
  onClose, 
  onRenew,
  subscription,
  user,
  plans = []
}) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlans, setShowPlans] = useState(false);

  // Calculate how long ago the subscription expired
  const calculateExpiredDays = () => {
    if (!subscription?.endDate) return 0;
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = today - endDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const expiredDays = calculateExpiredDays();
  const planTitle = subscription?.planTitle || 'Premium Plan';
  const endDate = subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A';

  // Sample plans if none provided
  const defaultPlans = [
    {
      _id: 'premium-plan',
      title: 'Premium Plan',
      discountedPrice: 13000,
      actualPrice: 30000,
      duration: 3,
      features: ['3-months full access', 'Unlimited quizzes', 'AI chat assistance', 'Premium study materials', 'Priority support']
    }
  ];

  const availablePlans = plans.length > 0 ? plans : defaultPlans;

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handleRenewSubscription = () => {
    if (selectedPlan && onRenew) {
      onRenew(selectedPlan);
    }
  };

  const handleShowPlans = () => {
    setShowPlans(true);
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      className="subscription-expired-modal"
      maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      closable={false}
    >
      <div className="expired-modal-content">
        {!showPlans ? (
          // Expiration Notice
          <div className="expiration-notice">
            {/* Header with Warning Icon */}
            <div className="modal-header expired-header">
              <div className="warning-icon">
                <ExclamationCircleOutlined />
              </div>
              <h2 className="modal-title">Subscription Expired!</h2>
              <p className="modal-subtitle">Your premium access has ended</p>
            </div>

            {/* Expired Plan Card */}
            <div className="expired-plan-card">
              <div className="plan-header">
                <div className="plan-icon expired-icon">
                  <ClockCircleOutlined />
                </div>
                <div className="plan-info">
                  <h3 className="plan-name">{planTitle}</h3>
                  <span className="plan-status expired-status">Expired</span>
                </div>
              </div>

              {/* Expiration Details */}
              <div className="expiration-details">
                <div className="detail-item">
                  <CalendarOutlined className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Expired On</span>
                    <span className="detail-value">{endDate}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <ClockCircleOutlined className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Days Since Expiration</span>
                    <span className="detail-value">
                      {expiredDays === 0 ? 'Today' : `${expiredDays} days ago`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar (Full - Expired) */}
              <div className="progress-section">
                <div className="progress-header">
                  <span className="progress-label">Subscription Status</span>
                  <span className="expired-badge">Expired</span>
                </div>
                <Progress 
                  percent={100} 
                  strokeColor="#ff4d4f"
                  trailColor="#f0f0f0"
                  strokeWidth={8}
                  showInfo={false}
                />
              </div>
            </div>

            {/* Message Section */}
            <div className="message-section">
              <div className="message-card expired-message">
                <h4 className="message-title">⏰ Time to Renew!</h4>
                <p className="message-text">
                  Your <strong>{planTitle}</strong> subscription expired on <strong>{endDate}</strong>. 
                  To continue enjoying all premium features, please choose a new subscription plan.
                </p>
              </div>

              <div className="restricted-access">
                <h5 className="restricted-title">🚫 Currently Restricted:</h5>
                <ul className="restricted-list">
                  <li>❌ Quiz access</li>
                  <li>❌ AI chat assistance</li>
                  <li>❌ Premium study materials</li>
                  <li>❌ Progress tracking</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <Button 
                type="primary" 
                size="large" 
                onClick={handleShowPlans}
                className="renew-button"
                icon={<RocketOutlined />}
              >
                Choose New Plan
              </Button>
              <Button 
                type="default" 
                size="large" 
                onClick={onClose}
                className="later-button"
              >
                Maybe Later
              </Button>
            </div>

            {/* Footer Note */}
            <div className="footer-note">
              <p>
                💡 <strong>Good News:</strong> You can access your profile and subscription settings anytime to renew!
              </p>
            </div>
          </div>
        ) : (
          // Plan Selection
          <div className="plan-selection">
            <div className="modal-header">
              <div className="crown-icon">
                <CrownOutlined />
              </div>
              <h2 className="modal-title">Choose Your Plan</h2>
              <p className="modal-subtitle">Select a plan to continue your learning journey</p>
            </div>

            <div className="plans-grid">
              {availablePlans.map((plan) => (
                <div 
                  key={plan._id} 
                  className={`plan-card ${selectedPlan?._id === plan._id ? 'selected' : ''}`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  <div className="plan-header">
                    <h3 className="plan-title">{plan.title}</h3>
                    {plan.title?.toLowerCase().includes('standard') && (
                      <span className="plan-badge">🔥 Popular</span>
                    )}
                  </div>

                  <div className="plan-pricing">
                    <div className="price-main">
                      <span className="currency">TZS</span>
                      <span className="amount">{plan.discountedPrice?.toLocaleString()}</span>
                    </div>
                    {plan.actualPrice > plan.discountedPrice && (
                      <div className="price-original">
                        <span className="original-price">TZS {plan.actualPrice?.toLocaleString()}</span>
                        <span className="discount">
                          {Math.round(((plan.actualPrice - plan.discountedPrice) / plan.actualPrice) * 100)}% OFF
                        </span>
                      </div>
                    )}
                    <div className="duration">{plan.duration} month{plan.duration > 1 ? 's' : ''}</div>
                  </div>

                  <div className="plan-features">
                    {plan.features?.slice(0, 4).map((feature, index) => (
                      <div key={index} className="feature-item">
                        <StarOutlined className="feature-icon" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {selectedPlan?._id === plan._id && (
                    <div className="selected-indicator">
                      ✓ Selected
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="action-buttons">
              <Button 
                type="primary" 
                size="large" 
                onClick={handleRenewSubscription}
                disabled={!selectedPlan}
                className="continue-button"
                icon={<RocketOutlined />}
              >
                Continue with {selectedPlan?.title || 'Selected Plan'}
              </Button>
              <Button 
                type="default" 
                size="large" 
                onClick={() => setShowPlans(false)}
                className="back-button"
              >
                ← Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SubscriptionExpiredModal;

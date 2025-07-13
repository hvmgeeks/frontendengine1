import React from 'react';
import { Modal, Button, Progress } from 'antd';
import { ClockCircleOutlined, CrownOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import './UpgradeRestrictionModal.css';

const UpgradeRestrictionModal = ({ 
  visible, 
  onClose, 
  currentPlan, 
  subscription,
  user 
}) => {
  // Calculate days remaining
  const calculateDaysRemaining = () => {
    if (!subscription?.endDate) return 0;
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!subscription?.startDate || !subscription?.endDate) return 0;
    const startDate = new Date(subscription.startDate);
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const usedDays = (today - startDate) / (1000 * 60 * 60 * 24);
    
    return Math.min(100, Math.max(0, (usedDays / totalDays) * 100));
  };

  const daysRemaining = calculateDaysRemaining();
  const progress = calculateProgress();
  const planTitle = currentPlan?.title || subscription?.planTitle || 'Premium Plan';
  const endDate = subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A';

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
      className="upgrade-restriction-modal"
      maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div className="upgrade-restriction-content">
        {/* Header with Crown Icon */}
        <div className="modal-header">
          <div className="crown-icon">
            <CrownOutlined />
          </div>
          <h2 className="modal-title">Already Premium Member!</h2>
          <p className="modal-subtitle">You're currently enjoying premium features</p>
        </div>

        {/* Current Plan Card */}
        <div className="current-plan-card">
          <div className="plan-header">
            <div className="plan-icon">
              <CheckCircleOutlined />
            </div>
            <div className="plan-info">
              <h3 className="plan-name">{planTitle}</h3>
              <span className="plan-status">Active Subscription</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-header">
              <span className="progress-label">Subscription Progress</span>
              <span className="days-remaining">{daysRemaining} days remaining</span>
            </div>
            <Progress 
              percent={progress} 
              strokeColor={{
                '0%': '#52c41a',
                '50%': '#faad14', 
                '100%': '#ff4d4f',
              }}
              trailColor="#f0f0f0"
              strokeWidth={8}
              showInfo={false}
            />
          </div>

          {/* Subscription Details */}
          <div className="subscription-details">
            <div className="detail-item">
              <CalendarOutlined className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Expires On</span>
                <span className="detail-value">{endDate}</span>
              </div>
            </div>
            <div className="detail-item">
              <ClockCircleOutlined className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Time Remaining</span>
                <span className="detail-value">
                  {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Section */}
        <div className="message-section">
          <div className="message-card">
            <h4 className="message-title">🎉 You're All Set!</h4>
            <p className="message-text">
              You're currently enjoying all premium features with your <strong>{planTitle}</strong>. 
              To upgrade to a different plan, please wait until your current subscription expires.
            </p>
          </div>

          <div className="benefits-list">
            <h5 className="benefits-title">Your Current Benefits:</h5>
            <ul className="benefits">
              {currentPlan?.features?.slice(0, 4).map((feature, index) => (
                <li key={index} className="benefit-item">
                  <CheckCircleOutlined className="benefit-icon" />
                  {feature}
                </li>
              )) || [
                <li key="1" className="benefit-item">
                  <CheckCircleOutlined className="benefit-icon" />
                  Full access to all features
                </li>,
                <li key="2" className="benefit-item">
                  <CheckCircleOutlined className="benefit-icon" />
                  Unlimited quizzes and practice
                </li>,
                <li key="3" className="benefit-item">
                  <CheckCircleOutlined className="benefit-icon" />
                  AI chat assistance
                </li>,
                <li key="4" className="benefit-item">
                  <CheckCircleOutlined className="benefit-icon" />
                  Premium study materials
                </li>
              ]}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <Button 
            type="primary" 
            size="large" 
            onClick={onClose}
            className="continue-button"
          >
            Continue Learning
          </Button>
          <Button 
            type="default" 
            size="large" 
            onClick={onClose}
            className="close-button"
          >
            Close
          </Button>
        </div>

        {/* Footer Note */}
        <div className="footer-note">
          <p>
            💡 <strong>Tip:</strong> You can upgrade to a different plan after your current subscription expires on <strong>{endDate}</strong>
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default UpgradeRestrictionModal;

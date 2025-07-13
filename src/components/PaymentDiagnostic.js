import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, Alert, Button, List, Typography, Space, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PaymentDiagnostic = ({ onClose }) => {
  const { user } = useSelector(state => state.users);
  const [diagnostics, setDiagnostics] = useState([]);
  const [overallStatus, setOverallStatus] = useState('checking');

  useEffect(() => {
    runDiagnostics();
  }, [user]);

  const runDiagnostics = () => {
    const checks = [];
    let hasErrors = false;
    let hasWarnings = false;

    // Check phone number
    const phoneRegex = /^0[67]\d{8}$/;
    if (!user?.phoneNumber) {
      checks.push({
        type: 'error',
        title: 'Phone Number Missing',
        description: 'Phone number is required for payments',
        fix: 'Add your phone number in Profile Settings'
      });
      hasErrors = true;
    } else if (!phoneRegex.test(user.phoneNumber)) {
      checks.push({
        type: 'error',
        title: 'Invalid Phone Format',
        description: `Phone number "${user.phoneNumber}" is not in correct format`,
        fix: 'Use Tanzania format: 06xxxxxxxx or 07xxxxxxxx (10 digits)'
      });
      hasErrors = true;
    } else {
      checks.push({
        type: 'success',
        title: 'Phone Number Valid',
        description: `Phone number ${user.phoneNumber} is correctly formatted`
      });
    }

    // Check email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user?.email) {
      checks.push({
        type: 'warning',
        title: 'Email Not Set',
        description: 'A temporary email will be generated for payment',
        fix: 'Consider adding a real email in Profile Settings'
      });
      hasWarnings = true;
    } else if (!emailRegex.test(user.email)) {
      checks.push({
        type: 'error',
        title: 'Invalid Email Format',
        description: `Email "${user.email}" is not valid`,
        fix: 'Update your email in Profile Settings'
      });
      hasErrors = true;
    } else {
      checks.push({
        type: 'success',
        title: 'Email Valid',
        description: `Email ${user.email} is correctly formatted`
      });
    }

    // Check name
    if (!user?.name || user.name.trim().length < 2) {
      checks.push({
        type: 'error',
        title: 'Name Missing or Too Short',
        description: 'Full name is required for payments',
        fix: 'Add your full name in Profile Settings'
      });
      hasErrors = true;
    } else {
      checks.push({
        type: 'success',
        title: 'Name Valid',
        description: `Name "${user.name}" is valid`
      });
    }

    // Check profile completeness
    const profileFields = ['name', 'phoneNumber', 'level', 'class'];
    const missingFields = profileFields.filter(field => !user?.[field]);
    
    if (missingFields.length > 0) {
      checks.push({
        type: 'warning',
        title: 'Incomplete Profile',
        description: `Missing fields: ${missingFields.join(', ')}`,
        fix: 'Complete your profile for better experience'
      });
      hasWarnings = true;
    }

    setDiagnostics(checks);
    
    if (hasErrors) {
      setOverallStatus('error');
    } else if (hasWarnings) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('success');
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getOverallMessage = () => {
    switch (overallStatus) {
      case 'success':
        return {
          type: 'success',
          message: 'Your profile is ready for payments!',
          description: 'All required information is valid and properly formatted.'
        };
      case 'warning':
        return {
          type: 'warning',
          message: 'Profile has minor issues',
          description: 'Payments should work, but consider fixing the warnings for better experience.'
        };
      case 'error':
        return {
          type: 'error',
          message: 'Profile needs attention',
          description: 'Please fix the errors below before attempting payment.'
        };
      default:
        return {
          type: 'info',
          message: 'Checking profile...',
          description: 'Please wait while we validate your information.'
        };
    }
  };

  const overallMessage = getOverallMessage();

  return (
    <Card 
      title="Payment Profile Diagnostic" 
      style={{ maxWidth: 600, margin: '20px auto' }}
      extra={
        <Button onClick={onClose} type="text">
          Close
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          type={overallMessage.type}
          message={overallMessage.message}
          description={overallMessage.description}
          showIcon
        />

        <div>
          <Title level={4}>Profile Check Results</Title>
          <List
            dataSource={diagnostics}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={getStatusIcon(item.type)}
                  title={
                    <Space>
                      <span>{item.title}</span>
                      <Tag color={getStatusColor(item.type)}>
                        {item.type.toUpperCase()}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Text>{item.description}</Text>
                      {item.fix && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" italic>
                            💡 Fix: {item.fix}
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>

        {overallStatus === 'success' && (
          <Alert
            type="info"
            message="Ready for Payment"
            description="Your profile meets all requirements. You can proceed with payment."
            showIcon
          />
        )}

        {overallStatus !== 'success' && (
          <Alert
            type="info"
            message="How to Fix Issues"
            description={
              <div>
                <p>1. Go to your Profile page</p>
                <p>2. Update the required information</p>
                <p>3. Save changes and try payment again</p>
                <p>4. Contact support if issues persist</p>
              </div>
            }
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};

export default PaymentDiagnostic;

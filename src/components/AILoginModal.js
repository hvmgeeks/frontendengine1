import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Checkbox, Alert, Typography, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, RobotOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { quickLogin, autoRefreshToken } from '../apicalls/auth';
import { getTokenExpiryInfo } from '../utils/authUtils';

const { Title, Text } = Typography;

const AILoginModal = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  title = "Login Required for AI Features",
  description = "Please login to access AI question generation features."
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      // Check current token status when modal opens
      const info = getTokenExpiryInfo();
      setTokenInfo(info);
      
      // Try auto-refresh if token is expiring soon
      if (info.needsRefresh && !info.expired) {
        handleAutoRefresh();
      }
    }
  }, [visible]);

  const handleAutoRefresh = async () => {
    try {
      setAutoRefreshing(true);
      const success = await autoRefreshToken();
      if (success) {
        const newInfo = getTokenExpiryInfo();
        setTokenInfo(newInfo);
        
        if (!newInfo.expired) {
          onSuccess?.();
          return;
        }
      }
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    } finally {
      setAutoRefreshing(false);
    }
  };

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      
      const response = await quickLogin({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe || false
      });

      if (response.success) {
        // Check AI access
        const { aiAccess } = response.data;
        
        if (!aiAccess.enabled) {
          Modal.warning({
            title: 'AI Features Not Available',
            content: aiAccess.requiresUpgrade 
              ? 'AI question generation requires a premium subscription. Please upgrade your account.'
              : 'AI features are not available for your account. Please contact support.',
          });
          return;
        }

        form.resetFields();
        onSuccess?.(response.data);
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTokenStatus = () => {
    if (!tokenInfo) return null;

    if (tokenInfo.expired) {
      return (
        <Alert
          type="warning"
          icon={<ClockCircleOutlined />}
          message="Session Expired"
          description="Your session has expired. Please login again to continue using AI features."
          style={{ marginBottom: 16 }}
        />
      );
    }

    if (tokenInfo.needsRefresh) {
      return (
        <Alert
          type="info"
          icon={<ClockCircleOutlined />}
          message="Session Expiring Soon"
          description={`Your session will expire in ${tokenInfo.formattedTimeLeft}. Login to extend your session.`}
          style={{ marginBottom: 16 }}
        />
      );
    }

    return null;
  };

  return (
    <Modal
      title={
        <Space>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <span>{title}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={450}
      destroyOnClose
      maskClosable={false}
    >
      <div style={{ padding: '20px 0' }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24, textAlign: 'center' }}>
          {description}
        </Text>

        {renderTokenStatus()}

        {autoRefreshing && (
          <Alert
            type="info"
            message="Refreshing Session..."
            description="Attempting to refresh your authentication automatically."
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item name="rememberMe" valuePropName="checked">
            <Checkbox>
              Keep me logged in for 30 days
            </Checkbox>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading || autoRefreshing}
              block
              size="large"
              icon={<RobotOutlined />}
            >
              {loading ? 'Logging in...' : autoRefreshing ? 'Refreshing...' : 'Login for AI Features'}
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Secure authentication for AI-powered question generation
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default AILoginModal;

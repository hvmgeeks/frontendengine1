import React, { useState } from 'react';
import { Card, Button, Alert, Space, Typography } from 'antd';
import { useAIAuth } from '../hooks/useAIAuth';
import AILoginModal from './AILoginModal';

const { Title, Text } = Typography;

const AuthTestComponent = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const {
    isAuthenticated,
    hasAIAccess,
    user,
    loading,
    requiresUpgrade,
    needsLogin,
    handleLoginSuccess,
    requireAIAuth,
    sessionExpiringSoon,
    timeUntilExpiry
  } = useAIAuth();

  const handleTestAIAccess = async () => {
    const authCheck = await requireAIAuth();
    if (!authCheck.success) {
      setShowLoginModal(true);
    } else {
      alert('AI access granted! You can proceed with AI operations.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Card title="AI Authentication Test">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={4}>Authentication Status</Title>
          
          {loading ? (
            <Alert message="Loading authentication status..." type="info" />
          ) : (
            <div>
              <Text strong>Authenticated: </Text>
              <Text type={isAuthenticated ? 'success' : 'danger'}>
                {isAuthenticated ? 'Yes' : 'No'}
              </Text>
              <br />
              
              <Text strong>Has AI Access: </Text>
              <Text type={hasAIAccess ? 'success' : 'danger'}>
                {hasAIAccess ? 'Yes' : 'No'}
              </Text>
              <br />
              
              {user && (
                <>
                  <Text strong>User: </Text>
                  <Text>{user.name} ({user.email})</Text>
                  <br />
                </>
              )}
              
              {requiresUpgrade && (
                <>
                  <Text strong>Requires Upgrade: </Text>
                  <Text type="warning">Yes</Text>
                  <br />
                </>
              )}
              
              {sessionExpiringSoon && (
                <>
                  <Text strong>Session Expires: </Text>
                  <Text type="warning">{timeUntilExpiry}</Text>
                  <br />
                </>
              )}
            </div>
          )}

          <Space>
            <Button 
              type="primary" 
              onClick={handleTestAIAccess}
              disabled={loading}
            >
              Test AI Access
            </Button>
            
            <Button 
              onClick={() => setShowLoginModal(true)}
              disabled={loading}
            >
              Show Login Modal
            </Button>
          </Space>

          {needsLogin && (
            <Alert
              message="Login Required"
              description="You need to login to access AI features."
              type="warning"
              showIcon
            />
          )}
        </Space>
      </Card>

      <AILoginModal
        visible={showLoginModal}
        onCancel={() => setShowLoginModal(false)}
        onSuccess={(userData) => {
          handleLoginSuccess(userData);
          setShowLoginModal(false);
        }}
        title="Test AI Login"
        description="This is a test of the AI authentication system."
      />
    </div>
  );
};

export default AuthTestComponent;

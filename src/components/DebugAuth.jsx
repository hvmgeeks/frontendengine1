import React, { useState, useEffect } from 'react';
import { Card, Button, message, Space, Typography } from 'antd';
import { getAllSyllabuses, getAvailableSubjects } from '../apicalls/syllabus';
import { getSubjectsForLevel } from '../apicalls/aiQuestions';

const { Text, Title } = Typography;

const DebugAuth = () => {
  const [authInfo, setAuthInfo] = useState({});
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuthInfo();
  }, []);

  const checkAuthInfo = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    let tokenInfo = {};
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        tokenInfo = {
          userId: payload.userId,
          exp: payload.exp,
          iat: payload.iat,
          isExpired: payload.exp < Date.now() / 1000
        };
      } catch (e) {
        tokenInfo = { error: 'Invalid token format' };
      }
    }

    setAuthInfo({
      hasToken: !!token,
      hasUser: !!user,
      token: token ? `${token.substring(0, 20)}...` : null,
      user: user ? JSON.parse(user) : null,
      tokenInfo
    });
  };

  const testSyllabusAPI = async () => {
    setLoading(true);
    const results = {};

    try {
      console.log('🧪 Testing getAllSyllabuses...');
      const syllabusResponse = await getAllSyllabuses();
      results.getAllSyllabuses = {
        success: syllabusResponse.success,
        dataLength: syllabusResponse.data?.length || 0,
        message: syllabusResponse.message,
        error: syllabusResponse.success ? null : syllabusResponse.message
      };
      console.log('📚 Syllabus response:', syllabusResponse);
    } catch (error) {
      results.getAllSyllabuses = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
      console.error('❌ Syllabus error:', error);
    }

    try {
      console.log('🧪 Testing getAvailableSubjects...');
      const subjectsResponse = await getAvailableSubjects('primary');
      results.getAvailableSubjects = {
        success: subjectsResponse.success,
        dataLength: subjectsResponse.data?.length || 0,
        data: subjectsResponse.data,
        message: subjectsResponse.message,
        error: subjectsResponse.success ? null : subjectsResponse.message
      };
      console.log('📖 Subjects response:', subjectsResponse);
    } catch (error) {
      results.getAvailableSubjects = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
      console.error('❌ Subjects error:', error);
    }

    try {
      console.log('🧪 Testing getSubjectsForLevel (AI)...');
      const aiSubjectsResponse = await getSubjectsForLevel('primary');
      results.getSubjectsForLevel = {
        success: aiSubjectsResponse.success,
        dataLength: aiSubjectsResponse.data?.length || 0,
        data: aiSubjectsResponse.data,
        message: aiSubjectsResponse.message,
        error: aiSubjectsResponse.success ? null : aiSubjectsResponse.message
      };
      console.log('🤖 AI Subjects response:', aiSubjectsResponse);
    } catch (error) {
      results.getSubjectsForLevel = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
      console.error('❌ AI Subjects error:', error);
    }

    setTestResults(results);
    setLoading(false);
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.info('Authentication cleared');
    checkAuthInfo();
  };

  const refreshAuth = () => {
    checkAuthInfo();
    message.info('Authentication info refreshed');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>🔍 Authentication & API Debug</Title>
      
      {/* Authentication Info */}
      <Card title="🔐 Authentication Status" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text><strong>Has Token:</strong> {authInfo.hasToken ? '✅ Yes' : '❌ No'}</Text>
          <Text><strong>Has User:</strong> {authInfo.hasUser ? '✅ Yes' : '❌ No'}</Text>
          
          {authInfo.token && (
            <Text><strong>Token Preview:</strong> {authInfo.token}</Text>
          )}
          
          {authInfo.user && (
            <div>
              <Text><strong>User:</strong> {authInfo.user.name} ({authInfo.user.email})</Text>
              <br />
              <Text><strong>Is Admin:</strong> {authInfo.user.isAdmin ? '✅ Yes' : '❌ No'}</Text>
            </div>
          )}
          
          {authInfo.tokenInfo && (
            <div>
              <Text><strong>Token Info:</strong></Text>
              <br />
              <Text>User ID: {authInfo.tokenInfo.userId}</Text>
              <br />
              <Text>Expires: {authInfo.tokenInfo.exp ? new Date(authInfo.tokenInfo.exp * 1000).toLocaleString() : 'N/A'}</Text>
              <br />
              <Text>Is Expired: {authInfo.tokenInfo.isExpired ? '❌ Yes' : '✅ No'}</Text>
              {authInfo.tokenInfo.error && (
                <>
                  <br />
                  <Text type="danger">Error: {authInfo.tokenInfo.error}</Text>
                </>
              )}
            </div>
          )}
        </Space>
        
        <div style={{ marginTop: '15px' }}>
          <Space>
            <Button onClick={refreshAuth}>Refresh</Button>
            <Button onClick={clearAuth} danger>Clear Auth</Button>
          </Space>
        </div>
      </Card>

      {/* API Test Results */}
      <Card title="🧪 API Test Results" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            onClick={testSyllabusAPI} 
            loading={loading}
            disabled={!authInfo.hasToken}
          >
            Test API Endpoints
          </Button>
          
          {Object.keys(testResults).length > 0 && (
            <div>
              <Title level={4}>Test Results:</Title>

              {Object.entries(testResults).map(([testName, result]) => (
                <Card
                  key={testName}
                  size="small"
                  title={testName}
                  style={{ marginBottom: '10px' }}
                >
                  <Text><strong>Success:</strong> {result.success ? '✅ Yes' : '❌ No'}</Text>
                  <br />
                  {result.dataLength !== undefined && (
                    <>
                      <Text><strong>Data Length:</strong> {result.dataLength}</Text>
                      <br />
                    </>
                  )}
                  {result.data && (
                    <>
                      <Text><strong>Data:</strong> {JSON.stringify(result.data)}</Text>
                      <br />
                    </>
                  )}
                  {result.message && (
                    <>
                      <Text><strong>Message:</strong> {result.message}</Text>
                      <br />
                    </>
                  )}
                  {result.error && (
                    <>
                      <Text type="danger"><strong>Error:</strong> {result.error}</Text>
                      <br />
                    </>
                  )}
                  {result.status && (
                    <>
                      <Text><strong>Status:</strong> {result.status}</Text>
                      <br />
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Quick Test Buttons */}
          <div style={{ marginTop: '15px' }}>
            <Space>
              <Button
                onClick={async () => {
                  try {
                    const response = await getSubjectsForLevel('primary');
                    console.log('Quick test - Primary subjects:', response);
                    message.info(`Primary subjects: ${JSON.stringify(response.data)}`);
                  } catch (error) {
                    console.error('Quick test error:', error);
                    message.error(`Error: ${error.message}`);
                  }
                }}
              >
                Quick Test: Primary Subjects
              </Button>

              <Button
                onClick={async () => {
                  try {
                    const response = await getAvailableSubjects('primary');
                    console.log('Quick test - Available subjects:', response);
                    message.info(`Available subjects: ${JSON.stringify(response.data)}`);
                  } catch (error) {
                    console.error('Quick test error:', error);
                    message.error(`Error: ${error.message}`);
                  }
                }}
              >
                Quick Test: Syllabus Subjects
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      {/* Instructions */}
      <Card title="📋 Debug Instructions">
        <Space direction="vertical">
          <Text>1. Check if you have a valid authentication token</Text>
          <Text>2. Verify the token is not expired</Text>
          <Text>3. Test API endpoints to see specific error messages</Text>
          <Text>4. Check browser console for detailed error logs</Text>
          <Text>5. If token is invalid, try logging out and logging back in</Text>
        </Space>
      </Card>
    </div>
  );
};

export default DebugAuth;

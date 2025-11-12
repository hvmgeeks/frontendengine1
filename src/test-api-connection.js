// Simple test to check API connection from frontend
import axios from 'axios';

const testAPIConnection = async () => {
  try {
    console.log('🧪 Testing API connection from frontend...');

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Test basic connection
    const response = await axios.get(`${apiUrl}/api/health`);
    console.log('✅ API connection successful:', response.data);

    // Test with auth token
    const token = localStorage.getItem('token');
    console.log('🔑 Token exists:', !!token);

    if (token) {
      const authResponse = await axios.get(`${apiUrl}/api/users/get-user-info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Auth test successful:', authResponse.data);
    }

  } catch (error) {
    console.error('❌ API connection failed:', error);
  }
};

// Run test when this file is imported
testAPIConnection();

export default testAPIConnection;

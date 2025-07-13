import React, { useState, useEffect } from 'react';
import { getUserOnlineStatus } from '../../apicalls/notifications';

const OnlineStatusIndicator = ({ 
  userId, 
  size = 'sm', 
  showLabel = false, 
  className = '',
  refreshInterval = 30000 // 30 seconds
}) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const checkStatus = async () => {
      try {
        const response = await getUserOnlineStatus(userId);
        console.log('Online status response:', response); // Debug log
        if (response.success) {
          setIsOnline(response.data.isOnline);
          setLastSeen(response.data.lastSeen);
          console.log('User online status:', response.data.isOnline); // Debug log
        }
      } catch (error) {
        console.error('Error checking online status:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkStatus();

    // Set up interval for periodic checks
    const interval = setInterval(checkStatus, refreshInterval);

    return () => clearInterval(interval);
  }, [userId, refreshInterval]);

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-2 h-2';
      case 'sm':
        return 'w-4 h-4'; // Made slightly larger for better visibility
      case 'md':
        return 'w-5 h-5';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-4 h-4'; // Made slightly larger for better visibility
    }
  };

  const getLastSeenText = () => {
    if (!lastSeen) return '';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Online status dot */}
      <div
        className={`${getSizeClasses()} rounded-full shadow-lg`}
        style={{
          backgroundColor: loading
            ? '#3b82f6'
            : isOnline
              ? '#22c55e'
              : '#6b7280',
          border: '3px solid #ffffff',
          boxShadow: loading || isOnline
            ? '0 4px 12px rgba(34, 197, 94, 0.6), 0 2px 4px rgba(0, 0, 0, 0.2)'
            : '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 10,
          animation: loading || isOnline ? 'pulse 2s infinite' : 'none'
        }}
        title={loading ? 'Loading...' : isOnline ? 'Online' : `Last seen ${getLastSeenText()}`}
      />

      {/* Optional label */}
      {showLabel && (
        <span className={`ml-2 text-sm ${loading ? 'text-blue-500' : isOnline ? 'text-green-600' : 'text-gray-500'}`}>
          {loading ? 'Loading...' : isOnline ? 'Online' : getLastSeenText()}
        </span>
      )}
    </div>
  );
};

export default OnlineStatusIndicator;

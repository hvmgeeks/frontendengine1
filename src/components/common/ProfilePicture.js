import React, { useState, useEffect } from 'react';
import { MdVerified } from 'react-icons/md';

const ProfilePicture = ({
  user,
  size = 'md',
  showOnlineStatus = true,
  className = '',
  onClick = null,
  style = {},
  ...props
}) => {

  const [isOnline, setIsOnline] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Conservative online status check - only show if explicitly online
  useEffect(() => {
    if (user && showOnlineStatus) {
      // Only show online if explicitly marked as online in the user data
      // This prevents false positives
      setIsOnline(user.isOnline === true);
    } else {
      setIsOnline(false);
    }
  }, [user, showOnlineStatus]);

  // Reset image error when user or profile image changes
  useEffect(() => {
    setImageError(false);
  }, [user?.profileImage, user?.profilePicture]);

  const getSizeConfig = () => {
    switch (size) {
      case 'xs':
        return {
          container: 'w-6 h-6',
          text: 'text-xs font-semibold',
          pixels: 24,
          onlineSize: 8,
          border: 'border-2'
        };
      case 'sm':
        return {
          container: 'w-8 h-8',
          text: 'text-sm font-semibold',
          pixels: 32,
          onlineSize: 10,
          border: 'border-2'
        };
      case 'md':
        return {
          container: 'w-12 h-12',
          text: 'text-base font-bold',
          pixels: 48,
          onlineSize: 12,
          border: 'border-2'
        };
      case 'lg':
        return {
          container: 'w-16 h-16',
          text: 'text-lg font-bold',
          pixels: 64,
          onlineSize: 16,
          border: 'border-3'
        };
      case 'xl':
        return {
          container: 'w-20 h-20',
          text: 'text-xl font-bold',
          pixels: 80,
          onlineSize: 18,
          border: 'border-3'
        };
      case '2xl':
        return {
          container: 'w-24 h-24',
          text: 'text-2xl font-bold',
          pixels: 96,
          onlineSize: 20,
          border: 'border-4'
        };
      case '3xl':
        return {
          container: 'w-32 h-32',
          text: 'text-3xl font-bold',
          pixels: 128,
          onlineSize: 24,
          border: 'border-4'
        };
      default:
        return {
          container: 'w-12 h-12',
          text: 'text-base font-bold',
          pixels: 48,
          onlineSize: 12,
          border: 'border-2'
        };
    }
  };

  const sizeConfig = getSizeConfig();
  const isClickable = onClick !== null;

  // Generate user initials
  const getInitials = (user) => {
    if (!user) return '?';
    const name = user.name || user.username || 'User';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Generate consistent color based on user name
  const getAvatarColor = (user) => {
    if (!user) return '#6B7280'; // Gray for unknown user

    const name = user.name || user.username || 'User';
    const colors = [
      '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
      '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
      '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
      '#EC4899', '#F43F5E'
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div 
      className={`relative inline-block ${className}`} 
      style={{ padding: showOnlineStatus ? '2px' : '0' }}
      {...props}
    >
      <div
        className={`
          ${sizeConfig.container}
          rounded-full overflow-hidden relative
          ${isClickable ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : ''}
        `}
        style={{
          background: '#f0f0f0',
          border: (showOnlineStatus && isOnline) ? '4px solid #22c55e' : '2px solid #e5e7eb',
          boxShadow: (showOnlineStatus && isOnline)
            ? '0 6px 16px rgba(34, 197, 94, 0.5), 0 2px 4px rgba(0, 0, 0, 0.1)'
            : '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'all 0.3s ease',
          ...style
        }}
        onClick={onClick}
      >
        {!user ? (
          // Show fallback for undefined user
          <div
            className={`
              rounded-full flex items-center justify-center w-full h-full
              ${sizeConfig.text}
            `}
            style={{
              background: getAvatarColor(user),
              color: '#FFFFFF'
            }}
          >
            ?
          </div>
        ) : (user?.profileImage || user?.profilePicture) && !imageError ? (
          <img
            src={user.profileImage || user.profilePicture}
            alt={user.name || 'User'}
            className="object-cover rounded-full w-full h-full"
            style={{ objectFit: 'cover' }}
            crossOrigin="anonymous"
            onLoad={() => {
              console.log('✅ Profile image loaded successfully:', user.profileImage || user.profilePicture);
            }}
            onError={(e) => {
              // Fallback to initials if image fails to load
              console.warn('⚠️ Profile image failed to load (this is normal if running locally with production images):', {
                src: e.target.src,
                user: user?.name
              });
              setImageError(true);
            }}
          />
        ) : null}
        
        {/* Fallback initials - show if user exists and (has no profile image OR image failed to load) */}
        {user && (!(user?.profileImage || user?.profilePicture) || imageError) && (
          <div
            className={`
              rounded-full flex items-center justify-center w-full h-full
              ${sizeConfig.text}
            `}
            style={{
              background: getAvatarColor(user),
              color: '#FFFFFF'
            }}
          >
            {getInitials(user)}
          </div>
        )}
      </div>

      {/* Online Status Indicator - Only show if actually online */}
      {showOnlineStatus && user?._id && isOnline && (
        <div
          style={{
            position: 'absolute',
            width: `${sizeConfig.onlineSize}px`,
            height: `${sizeConfig.onlineSize}px`,
            bottom: '-2px',
            right: '-2px',
            zIndex: 999,
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            border: '3px solid #ffffff',
            outline: 'none',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.8), 0 2px 4px rgba(0, 0, 0, 0.2)',
            animation: 'pulse 2s infinite'
          }}
          title="Online"
        />
      )}


    </div>
  );
};

export default ProfilePicture;

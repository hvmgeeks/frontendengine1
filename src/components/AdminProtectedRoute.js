import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

const AdminProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AdminProtectedRoute: User state changed", {
      user: user ? { name: user.name, isAdmin: user.isAdmin } : null
    });

    // Check if user is loaded and is not an admin
    if (user && !user.isAdmin) {
      console.log("AdminProtectedRoute: Non-admin user detected, redirecting to user hub");
      message.error('Access denied. Admin privileges required.');
      navigate('/user/hub');
    }
  }, [user, navigate]);

  // If user is not loaded yet, show loading or return null
  if (!user) {
    console.log("AdminProtectedRoute: User not loaded yet, showing loading...");
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading admin panel...</p>
      </div>
    </div>;
  }

  // If user is not admin, return null (will redirect in useEffect)
  if (!user.isAdmin) {
    console.log("AdminProtectedRoute: User is not admin, will redirect");
    return null;
  }

  console.log("AdminProtectedRoute: Admin user confirmed, rendering children");
  // If user is admin, render the children
  return children;
};

export default AdminProtectedRoute;

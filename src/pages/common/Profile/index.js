import React, { useEffect, useState } from "react";
import "./index.css";

import {
  getUserInfo,
  updateUserInfo,
  updateUserPhoto,
  wipeLevelData,
} from "../../../apicalls/users";
import { message, Modal } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { SetUser } from "../../../redux/usersSlice";
import { getAllReportsForRanking, getUserRanking, getXPLeaderboard } from "../../../apicalls/reports";
import ProfilePicture from "../../../components/common/ProfilePicture";

import { useLanguage } from "../../../contexts/LanguageContext";

const Profile = () => {
  const { isKiswahili } = useLanguage();

  // Function to format class name based on level
  const formatClassName = (classValue, level) => {
    if (!classValue) return 'N/A';

    switch (level) {
      case 'primary':
        return `Class ${classValue}`;
      case 'primary_kiswahili':
        return `Darasa la ${classValue}`;
      case 'secondary':
        // If it's already in Form-X format, use it; otherwise add Form prefix
        return classValue.toString().startsWith('Form') ? classValue : `Form ${classValue}`;
      case 'advance':
        // If it's already in Form-X format, use it; otherwise add Form prefix
        return classValue.toString().startsWith('Form') ? classValue : `Form ${classValue}`;
      default:
        return classValue.toString();
    }
  };
  const [userDetails, setUserDetails] = useState(null);
  const [rankingData, setRankingData] = useState(null);
  const [userRanking, setUserRanking] = useState(null);
  const [userRankingStats, setUserRankingStats] = useState(null);
  const [edit, setEdit] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    school: "",
    level: "",
    class_: "",
    phoneNumber: "",
  });
  const [profileImage, setProfileImage] = useState(null);

  const [showLevelChangeModal, setShowLevelChangeModal] = useState(false);
  const [pendingLevelChange, setPendingLevelChange] = useState(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { subscriptionData } = useSelector((state) => state.subscription);

  const fetchReports = async () => {
    try {
      const response = await getAllReportsForRanking();
      if (response.success) {
        setRankingData(response.data);
      } else {
        message.error(response.message);
      }
      dispatch(HideLoading());
    } catch (error) {
      message.error(error.message);
      dispatch(HideLoading());
    }
  };

  const getUserStats = () => {
    const Ranking = rankingData
      .map((user, index) => ({
        user,
        ranking: index + 1,
      }))
      .filter((item) => item.user.userId.includes(userDetails._id));
    setUserRanking(Ranking);
  };

  // Fetch user ranking data from the ranking system
  const fetchUserRankingData = async () => {
    if (!userDetails?._id) return;

    try {
      dispatch(ShowLoading());

      // Get user's ranking position and nearby users
      const rankingResponse = await getUserRanking(userDetails._id, 5);

      if (rankingResponse.success) {
        setUserRankingStats(rankingResponse.data);
      }

      // Also get the full leaderboard to find user's position
      const leaderboardResponse = await getXPLeaderboard({
        limit: 1000,
        levelFilter: userDetails?.level || 'all'
      });

      if (leaderboardResponse.success) {
        const userIndex = leaderboardResponse.data.findIndex(user => user._id === userDetails._id);
        if (userIndex >= 0) {
          const userWithRank = {
            ...leaderboardResponse.data[userIndex],
            rank: userIndex + 1,
            totalUsers: leaderboardResponse.data.length
          };
          setUserRankingStats(prev => ({
            ...prev,
            userRank: userIndex + 1,
            totalUsers: leaderboardResponse.data.length,
            user: userWithRank
          }));
        }
      }

      dispatch(HideLoading());
    } catch (error) {
      dispatch(HideLoading());
      console.error('Error fetching ranking data:', error);
    }
  };

  useEffect(() => {
    if (rankingData && userDetails) {
      getUserStats();
    }
  }, [rankingData, userDetails]);

  const getUserData = async () => {
    dispatch(ShowLoading());
    try {
      const response = await getUserInfo();
      if (response.success) {
        setUserDetails(response.data);

        // CRITICAL FIX: Update Redux store with fresh user data including subscription status
        dispatch(SetUser(response.data));

        // Also update localStorage to maintain consistency
        localStorage.setItem("user", JSON.stringify(response.data));

        // Update form data with server response, but preserve any pending changes
        const newFormData = {
          name: response.data.name || "",
          email: response.data.email || "",
          school: response.data.school || "",
          class_: response.data.class || "",
          level: response.data.level || "",
          phoneNumber: response.data.phoneNumber || "",
        };

        console.log('🔍 Server response level:', response.data.level);
        console.log('🔍 Setting form data:', newFormData);

        setFormData(newFormData);
        if (response.data.profileImage) {
          setProfileImage(response.data.profileImage);
        }
        fetchReports();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(HideLoading());
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      getUserData();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phoneNumber" && value.length > 10) return;
    if (name === "level" && value !== userDetails?.level && value !== "") {
      setPendingLevelChange(value);
      setShowLevelChangeModal(true);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "level" ? { class_: "" } : {}),
    }));
  };

  const discardChanges = () => {
    setFormData({
      name: userDetails.name,
      email: userDetails.email,
      school: userDetails.school,
      class_: userDetails.class,
      level: userDetails.level,
      phoneNumber: userDetails.phoneNumber,
    });
    setEdit(false);
  };



  const handleUpdate = async ({ skipOTP } = {}) => {
    console.log('🔍 Current formData:', formData);
    console.log('🔍 Current userDetails:', userDetails);

    // Validation
    if (!formData.name || formData.name.trim() === "") {
      console.log('❌ Validation failed: name is empty');
      return message.error("Please enter your name.");
    }
    if (!formData.class_ || formData.class_.trim() === "") {
      console.log('❌ Validation failed: class is empty');
      return message.error("Please select a class.");
    }
    if (!formData.level || formData.level.trim() === "") {
      console.log('❌ Validation failed: level is empty');
      return message.error("Please select a level.");
    }
    // Email validation (optional - only validate if provided)
    if (formData.email && formData.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return message.error("Please enter a valid email address.");
      }
    }

    // Since email is optional in username-based system, skip OTP verification
    // Users can update their email directly without verification

    dispatch(ShowLoading());
    try {
      // Prepare update payload - only include email if it has a value
      const updatePayload = {
        ...formData,
        userId: userDetails._id,
      };

      // Only include email if it's provided and not empty
      if (formData.email && formData.email.trim() !== "") {
        updatePayload.email = formData.email.trim();
      } else if (userDetails?.email) {
        updatePayload.email = userDetails.email;
      }

      console.log('📤 Sending update data:', updatePayload);

      const response = await updateUserInfo(updatePayload);

      console.log('📥 Server response:', response);

      if (response.success) {
        message.success(response.message);
        setEdit(false);
        getUserData();
        if (response.levelChanged) {
          setTimeout(() => window.location.reload(), 2000);
        }
      } else {
        console.error('❌ Update failed:', response);
        message.error(response.message || "Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error('❌ Update error:', error);
      const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
      message.error(`Update failed: ${errorMessage}`);
    } finally {
      dispatch(HideLoading());
    }
  };

  const handleLevelChangeConfirm = async () => {
    try {
      dispatch(ShowLoading());

      // Store old level for reference
      const oldLevel = userDetails?.level;
      const userId = user?._id || userDetails?._id;

      console.log('🔄 Starting level change:', {
        userId,
        oldLevel,
        newLevel: pendingLevelChange
      });

      // Validate required data
      if (!userId) {
        message.error('User ID not found. Please refresh the page and try again.');
        return;
      }

      if (!pendingLevelChange) {
        message.error('No level selected. Please try again.');
        return;
      }

      // Call API to change level (data is now preserved)
      const changeResponse = await wipeLevelData({
        userId: userId,
        newLevel: pendingLevelChange,
        oldLevel: oldLevel
      });

      console.log('📥 Level change response:', changeResponse);

      if (changeResponse.success) {
        console.log(`✅ Level changed successfully: ${oldLevel} → ${pendingLevelChange}`);
        message.success(`Level changed to ${pendingLevelChange} successfully! Your learning progress has been reset.`);

        // Update userDetails first to maintain consistency
        setUserDetails(prev => ({
          ...prev,
          level: pendingLevelChange,
          class: "" // Reset class when level changes
        }));

        // Update form data with new level
        console.log('🔄 Updating form data with new level:', pendingLevelChange);
        setFormData((prev) => {
          const newData = {
            ...prev,
            level: pendingLevelChange,
            class_: "",
          };
          console.log('🔄 New form data after level change:', newData);
          return newData;
        });

        setShowLevelChangeModal(false);
        setPendingLevelChange(null);

        // Refresh user data to get updated level from server
        setTimeout(() => {
          getUserData();
        }, 500);

      } else {
        console.error('⚠️ Level change failed:', changeResponse);
        const errorMessage = changeResponse.message || 'Failed to change level. Please try again.';
        message.error(errorMessage);
        return;
      }

    } catch (error) {
      console.error('❌ Error during level change:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change level. Please try again.';
      message.error(`Level change failed: ${errorMessage}`);
    } finally {
      dispatch(HideLoading());
    }
  };

  const handleLevelChangeCancel = () => {
    setShowLevelChangeModal(false);
    setPendingLevelChange(null);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        message.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        message.error('Image size should be less than 5MB');
        return;
      }

      setProfileImage(file);

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);

      // Auto-upload the image
      const data = new FormData();
      data.append("profileImage", file);
      dispatch(ShowLoading());

      try {
        const response = await updateUserPhoto(data);
        dispatch(HideLoading());
        if (response.success) {
          message.success("Profile picture updated successfully!");
          getUserData(); // Refresh user data to show new image
        } else {
          message.error(response.message);
        }
      } catch (error) {
        dispatch(HideLoading());
        message.error(error.message || "Failed to update profile picture");
      }
    }
  };

  const handleImageUpload = async () => {
    const data = new FormData();
    data.append("profileImage", profileImage);
    dispatch(ShowLoading());
    try {
      const response = await updateUserPhoto(data);
      if (response.success) {
        message.success("Photo updated successfully!");
        getUserData();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(HideLoading());
    }
  };



  // Load user data on component mount
  useEffect(() => {
    getUserData();
  }, []);

  // Load ranking data when user details are available
  useEffect(() => {
    if (userDetails) {
      fetchUserRankingData();
    }
  }, [userDetails]);

  // Ensure formData is synchronized with userDetails (but preserve form changes)
  useEffect(() => {
    if (userDetails && !edit) {
      // Only sync when not in edit mode to preserve user changes
      setFormData(prevFormData => ({
        name: userDetails.name || prevFormData.name || "",
        email: userDetails.email || prevFormData.email || "",
        school: userDetails.school || prevFormData.school || "",
        class_: userDetails.class || prevFormData.class_ || "",
        level: userDetails.level || prevFormData.level || "",
        phoneNumber: userDetails.phoneNumber || prevFormData.phoneNumber || "",
      }));
    }
  }, [userDetails, edit]);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>

            {/* Profile Picture with Online Status - Centered Below Header */}
            <div className="relative mt-8 flex justify-center">
              <div className="relative">
                <ProfilePicture
                  user={userDetails}
                  size="3xl"
                  showOnlineStatus={true}
                  onClick={() => document.getElementById('profileImageInput').click()}
                  className="hover:scale-105 transition-transform duration-200"
                  style={{
                    width: '120px',
                    height: '120px',
                    border: '4px solid #BFDBFE',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />

                {/* Camera Icon Overlay */}
                <div className="absolute bottom-2 right-2 bg-blue-600 rounded-full p-2 shadow-lg cursor-pointer hover:bg-blue-700 transition-colors duration-200"
                     onClick={() => document.getElementById('profileImageInput').click()}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>

                {/* Hidden File Input */}
                <input
                  id="profileImageInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col items-center mb-8">
                {/* User Info - Horizontal Layout */}
                <div className="flex flex-wrap justify-center gap-4 text-center mb-6">
                  <div className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-200 min-w-[120px]">
                    <p className="text-sm text-blue-600 font-medium">Name</p>
                    <p className="text-lg font-bold text-gray-900">{userDetails?.name || 'User'}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg px-4 py-3 border border-green-200 min-w-[120px]">
                    <p className="text-sm text-green-600 font-medium">Username</p>
                    <p className="text-lg font-bold text-gray-900 truncate max-w-[150px]">{userDetails?.username || 'username'}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg px-4 py-3 border border-purple-200 min-w-[120px]">
                    <p className="text-sm text-purple-600 font-medium">{isKiswahili ? 'Darasa' : 'Class'}</p>
                    <p className="text-lg font-bold" style={{color: '#111827'}}>{formatClassName(userDetails?.class, userDetails?.level)}</p>
                  </div>

                  {/* Subscription Status */}
                  <div className={`rounded-lg px-4 py-3 border min-w-[140px] ${
                    userDetails?.subscriptionStatus === 'active'
                      ? 'bg-white border-green-400'
                      : 'bg-red-50 border-red-200'
                  }`} style={{
                    ...(userDetails?.subscriptionStatus === 'active' && {
                      background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                      borderColor: '#22c55e',
                      borderWidth: '2px',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)'
                    })
                  }}>
                    <p className={`text-sm font-medium ${
                      userDetails?.subscriptionStatus === 'active'
                        ? 'text-green-700'
                        : 'text-red-600'
                    }`}>
                      {isKiswahili ? 'Hali ya Uanachama' : 'Subscription'}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        userDetails?.subscriptionStatus === 'active'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`} style={{
                        ...(userDetails?.subscriptionStatus === 'active' && {
                          background: '#22c55e',
                          boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)'
                        })
                      }}></div>
                      <p className={`text-lg font-bold ${
                        userDetails?.subscriptionStatus === 'active'
                          ? 'text-green-600'
                          : 'text-red-700'
                      }`}>
                        {userDetails?.subscriptionStatus === 'active'
                          ? (isKiswahili ? 'Amilifu' : 'Active')
                          : (isKiswahili ? 'Imeisha' : 'Expired')
                        }
                      </p>
                    </div>
                    {userDetails?.subscriptionEndDate && (
                      <p className={`text-xs mt-1 font-medium ${
                        userDetails?.subscriptionStatus === 'active'
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}>
                        {userDetails?.subscriptionStatus === 'active'
                          ? (isKiswahili ? 'Inaisha: ' : 'Expires: ')
                          : (isKiswahili ? 'Iliisha: ' : 'Expired: ')
                        }
                        {new Date(userDetails.subscriptionEndDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ranking Stats - Horizontal Layout */}
                {userRankingStats && (
                  <div className="flex flex-wrap justify-center gap-4 text-center">
                    <div className="bg-yellow-50 rounded-lg px-4 py-3 border border-yellow-200 min-w-[120px]">
                      <p className="text-sm text-yellow-600 font-medium">Rank</p>
                      <p className="text-lg font-bold text-gray-900">
                        #{userRankingStats.userRank || 'N/A'}
                        {userRankingStats.totalUsers && (
                          <span className="text-sm text-gray-500">/{userRankingStats.totalUsers}</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg px-4 py-3 border border-orange-200 min-w-[120px]">
                      <p className="text-sm text-orange-600 font-medium">Total XP</p>
                      <p className="text-lg font-bold text-gray-900">
                        {userRankingStats.user?.totalXP?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg px-4 py-3 border border-indigo-200 min-w-[120px]">
                      <p className="text-sm text-indigo-600 font-medium">Avg Score</p>
                      <p className="text-lg font-bold text-gray-900">
                        {userRankingStats.user?.averageScore || '0'}%
                      </p>
                    </div>
                    <div className="bg-pink-50 rounded-lg px-4 py-3 border border-pink-200 min-w-[120px]">
                      <p className="text-sm text-pink-600 font-medium">Quizzes</p>
                      <p className="text-lg font-bold text-gray-900">
                        {userRankingStats.user?.totalQuizzesTaken || '0'}
                      </p>
                    </div>
                    <div className="bg-teal-50 rounded-lg px-4 py-3 border border-teal-200 min-w-[120px]">
                      <p className="text-sm text-teal-600 font-medium">Streak</p>
                      <p className="text-lg font-bold text-gray-900">
                        {userRankingStats.user?.currentStreak || '0'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Details */}
              {!edit ? (
                // View Mode
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {userDetails?.name || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {userDetails?.username || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {userDetails?.email ? (
                          <div className="flex items-center justify-between">
                            <span>{userDetails.email}</span>
                            {userDetails.email.includes('@brainwave.temp') && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                Auto-generated
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">No email set</span>
                            <button
                              onClick={async () => {
                                const timestamp = Date.now();
                                const autoEmail = `${userDetails.username}.${timestamp}@brainwave.temp`;
                                setFormData(prev => ({ ...prev, email: autoEmail }));
                                message.info('Auto-generated email created. Click "Save Changes" to update.');
                              }}
                              className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                            >
                              Generate Email
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {userDetails?.school || 'Not provided'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {userDetails?.level || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {userDetails?.class || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {userDetails?.phoneNumber || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <div className="p-3 bg-gray-100 rounded-lg border text-gray-600">
                        {userDetails?.username || 'Not available'}
                        <span className="text-xs text-gray-500 block mt-1">Username cannot be changed</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ""}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-24"
                          placeholder="Enter your email (optional)"
                        />
                        {(!formData.email || formData.email === '') && (
                          <button
                            type="button"
                            onClick={() => {
                              const timestamp = Date.now();
                              const autoEmail = `${userDetails.username}.${timestamp}@brainwave.temp`;
                              setFormData(prev => ({ ...prev, email: autoEmail }));
                              message.success('Auto-generated email created!');
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                          >
                            Auto-Gen
                          </button>
                        )}
                      </div>
                      {formData.email && formData.email.includes('@brainwave.temp') && (
                        <p className="text-xs text-blue-600 mt-1">
                          📧 This is an auto-generated email. You can change it to your real email if you prefer.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                      <input
                        type="text"
                        name="school"
                        value={formData.school}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter your school"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                      <select
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors mobile-dropdown"
                        required
                      >
                        <option value="">Select Level</option>
                        <option value="primary">Primary Education (Classes 1-7)</option>
                        <option value="primary_kiswahili">Elimu ya Msingi - Kiswahili (Madarasa 1-7)</option>
                        <option value="secondary">Secondary Education (Forms 1-4)</option>
                        <option value="advance">Advanced Level (Forms 5-6)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                      <select
                        name="class_"
                        value={formData.class_}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors mobile-dropdown"
                        required
                      >
                        <option value="">Select Class</option>
                        {formData.level === "primary" && (
                          <>
                            <option value="1">Class 1</option>
                            <option value="2">Class 2</option>
                            <option value="3">Class 3</option>
                            <option value="4">Class 4</option>
                            <option value="5">Class 5</option>
                            <option value="6">Class 6</option>
                            <option value="7">Class 7</option>
                          </>
                        )}
                        {formData.level === "primary_kiswahili" && (
                          <>
                            <option value="1">Darasa la 1</option>
                            <option value="2">Darasa la 2</option>
                            <option value="3">Darasa la 3</option>
                            <option value="4">Darasa la 4</option>
                            <option value="5">Darasa la 5</option>
                            <option value="6">Darasa la 6</option>
                            <option value="7">Darasa la 7</option>
                          </>
                        )}
                        {formData.level === "secondary" && (
                          <>
                            <option value="1">Form 1</option>
                            <option value="2">Form 2</option>
                            <option value="3">Form 3</option>
                            <option value="4">Form 4</option>
                          </>
                        )}
                        {formData.level === "advance" && (
                          <>
                            <option value="5">Form 5</option>
                            <option value="6">Form 6</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter phone number"
                        maxLength="10"
                      />
                    </div>
                  </div>
                </div>
              )}











              {/* Action Buttons */}
              <div className="mt-8 flex justify-center gap-4">
                {!edit ? (
                  <button
                    onClick={() => {
                      // Ensure formData is properly initialized with current user data
                      setFormData({
                        name: userDetails?.name || "",
                        email: userDetails?.email || "",
                        school: userDetails?.school || "",
                        class_: userDetails?.class || "",
                        level: userDetails?.level || "",
                        phoneNumber: userDetails?.phoneNumber || "",
                      });
                      setEdit(true);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={discardChanges}
                      className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                    >
                      Save Changes
                    </button>
                    {/* Debug button - remove in production */}
                    <button
                      onClick={() => {
                        console.log('🔍 Debug - Current formData:', formData);
                        console.log('🔍 Debug - Current userDetails:', userDetails);
                        alert(`FormData: ${JSON.stringify(formData, null, 2)}`);
                      }}
                      className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors duration-200 font-medium text-sm"
                    >
                      Debug
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input for profile image upload */}
      <input
        type="file"
        id="profileImageInput"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: 'none' }}
      />

      {/* Level Change Confirmation Modal */}
      <Modal
        title="⚠️ Confirm Level Change"
        open={showLevelChangeModal}
        onOk={handleLevelChangeConfirm}
        onCancel={() => {
          setShowLevelChangeModal(false);
          setPendingLevelChange(null);
        }}
        okText="Yes, Change Level"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          style: { backgroundColor: '#dc2626', borderColor: '#dc2626' }
        }}
        width={500}
      >
        <div className="space-y-4">
          <p className="text-lg">
            Are you sure you want to change your level to <strong className="text-blue-600">{pendingLevelChange}</strong>?
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-green-800 font-semibold mb-2 flex items-center">
              <span className="mr-2">✅</span>
              Your Data Will Be Preserved
            </h4>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• All quiz results and progress will be kept</li>
              <li>• Learning history and achievements preserved</li>
              <li>• XP points and rankings maintained</li>
              <li>• You can access content from your new level</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-green-800 font-semibold mb-2 flex items-center">
              <span className="mr-2">✅</span>
              What Will Be Preserved
            </h4>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Your subscription status and plan</li>
              <li>• Profile information (name, email, etc.)</li>
              <li>• Account settings and preferences</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> This action cannot be undone. You'll start fresh with content for the new level.
            </p>
          </div>
        </div>
      </Modal>

    </div>
    </>
  );
};

export default Profile;

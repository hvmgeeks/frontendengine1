import React, { useEffect, useState } from "react";
import "./index.css";
import PageTitle from "../../../components/PageTitle";
import {
  getUserInfo,
  updateUserInfo,
  updateUserPhoto,
} from "../../../apicalls/users";
import { Form, message, Modal, Input, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { getAllReportsForRanking, getUserRanking, getXPLeaderboard } from "../../../apicalls/reports";
import ProfilePicture from "../../../components/common/ProfilePicture";
import SubscriptionModal from "../../../components/SubscriptionModal/SubscriptionModal";
import { useLanguage } from "../../../contexts/LanguageContext";

const Profile = () => {
  const { t, isKiswahili, getClassName } = useLanguage();
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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showLevelChangeModal, setShowLevelChangeModal] = useState(false);
  const [pendingLevelChange, setPendingLevelChange] = useState(null);
  const dispatch = useDispatch();
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
        setFormData({
          name: response.data.name || "",
          email: response.data.email || "",
          school: response.data.school || "",
          class_: response.data.class || "",
          level: response.data.level || "",
          phoneNumber: response.data.phoneNumber || "",
        });
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

  const handleLevelChangeConfirm = () => {
    setFormData((prev) => ({
      ...prev,
      level: pendingLevelChange,
      class_: "",
    }));
    setShowLevelChangeModal(false);
    setPendingLevelChange(null);
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

  // Ensure formData is synchronized with userDetails
  useEffect(() => {
    if (userDetails) {
      setFormData({
        name: userDetails.name || "",
        email: userDetails.email || "", // Email is optional
        school: userDetails.school || "",
        class_: userDetails.class || "",
        level: userDetails.level || "",
        phoneNumber: userDetails.phoneNumber || "",
      });
    }
  }, [userDetails]);

  return (
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
                    <p className="text-lg font-bold" style={{color: '#111827'}}>{userDetails?.class ? (isKiswahili ? `Darasa la ${userDetails.class}` : userDetails.class) : 'N/A'}</p>
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      >
                        <option value="">Select Level</option>
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Advance">Advance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                      <select
                        name="class_"
                        value={formData.class_}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      >
                        <option value="">Select Class</option>
                        {formData.level === "Primary" && (
                          <>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                          </>
                        )}
                        {formData.level === "Secondary" && (
                          <>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                          </>
                        )}
                        {formData.level === "Advance" && (
                          <>
                            <option value="5">5</option>
                            <option value="6">6</option>
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

              {/* Subscription Section */}
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">💎</span>
                  Subscription Plan
                </h3>

                {subscriptionData && subscriptionData.status === 'active' ? (
                  // Active Subscription
                  <div className="space-y-6">
                    {/* Plan Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-bold text-blue-700">{subscriptionData.planTitle || subscriptionData.plan?.title || 'Premium Plan'}</h4>
                        <p className="text-gray-600 mt-1">
                          <span className="inline-flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                            Active Subscription
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                          ✅ Active
                        </span>
                      </div>
                    </div>

                    {/* Subscription Timeline */}
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl border border-blue-200">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="mr-2">📅</span>
                        Subscription Timeline
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Started On</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {subscriptionData.startDate ?
                              new Date(subscriptionData.startDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) :
                              new Date(subscriptionData.createdAt).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Expires On</p>
                          <p className="text-sm font-semibold text-red-600">
                            {new Date(subscriptionData.endDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Plan Statistics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Duration</p>
                            <p className="text-lg font-bold text-gray-900">
                              {subscriptionData.duration || subscriptionData.plan?.duration || 1} month{(subscriptionData.duration || subscriptionData.plan?.duration || 1) > 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-blue-500">
                            <span className="text-2xl">📆</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Amount Paid</p>
                            <p className="text-lg font-bold text-green-600">
                              {(subscriptionData.amount || subscriptionData.discountedPrice || 0).toLocaleString()} TZS
                            </p>
                          </div>
                          <div className="text-green-500">
                            <span className="text-2xl">💰</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Days Remaining</p>
                            <p className="text-lg font-bold text-orange-600">
                              {(() => {
                                const daysLeft = Math.max(0, Math.ceil((new Date(subscriptionData.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
                                return daysLeft;
                              })()} days
                            </p>
                          </div>
                          <div className="text-orange-500">
                            <span className="text-2xl">⏰</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Days</p>
                            <p className="text-lg font-bold text-purple-600">
                              {(subscriptionData.duration || subscriptionData.plan?.duration || 1) * 30} days
                            </p>
                          </div>
                          <div className="text-purple-500">
                            <span className="text-2xl">📊</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700">Subscription Progress</p>
                        <p className="text-xs text-gray-500">
                          {(() => {
                            const duration = subscriptionData.duration || subscriptionData.plan?.duration || 1;
                            const totalDays = duration * 30;
                            const daysLeft = Math.max(0, Math.ceil((new Date(subscriptionData.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
                            const daysUsed = totalDays - daysLeft;
                            const percentage = Math.min(100, Math.max(0, (daysUsed / totalDays) * 100));
                            return `${percentage.toFixed(1)}% completed`;
                          })()}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${(() => {
                              const duration = subscriptionData.duration || subscriptionData.plan?.duration || 1;
                              const totalDays = duration * 30;
                              const daysLeft = Math.max(0, Math.ceil((new Date(subscriptionData.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
                              const daysUsed = totalDays - daysLeft;
                              const percentage = Math.min(100, Math.max(0, (daysUsed / totalDays) * 100));
                              return percentage;
                            })()}%`
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Started</span>
                        <span>
                          {(() => {
                            const daysLeft = Math.max(0, Math.ceil((new Date(subscriptionData.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
                            if (daysLeft > 7) {
                              return `${daysLeft} days left`;
                            } else if (daysLeft > 0) {
                              return `⚠️ ${daysLeft} days left`;
                            } else {
                              return '❌ Expired';
                            }
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md"
                      >
                        🚀 Upgrade Plan
                      </button>
                      <button
                        onClick={() => {
                          const endDate = new Date(subscriptionData.endDate);
                          const today = new Date();
                          const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

                          if (daysLeft <= 7 && daysLeft > 0) {
                            message.warning(`Your subscription expires in ${daysLeft} days. Consider renewing soon!`);
                          } else if (daysLeft <= 0) {
                            message.error('Your subscription has expired. Please renew to continue accessing premium features.');
                          } else {
                            message.info(`Your subscription is active for ${daysLeft} more days.`);
                          }
                        }}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        📊 Check Status
                      </button>
                    </div>
                  </div>
                ) : (
                  // No Active Subscription
                  <div className="text-center py-8">
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-4xl">🔒</span>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">No Active Subscription</h4>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Unlock premium features and get unlimited access to all educational content with a subscription plan.
                      </p>
                    </div>

                    {/* Premium Features Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-blue-600 text-2xl mb-2">📚</div>
                        <h5 className="font-semibold text-gray-900 mb-1">Unlimited Quizzes</h5>
                        <p className="text-sm text-gray-600">Access all quizzes without restrictions</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                        <div className="text-green-600 text-2xl mb-2">🤖</div>
                        <h5 className="font-semibold text-gray-900 mb-1">AI Study Assistant</h5>
                        <p className="text-sm text-gray-600">Get instant help with your studies</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-purple-600 text-2xl mb-2">📊</div>
                        <h5 className="font-semibold text-gray-900 mb-1">Progress Tracking</h5>
                        <p className="text-sm text-gray-600">Monitor your learning progress</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                        <div className="text-orange-600 text-2xl mb-2">🏆</div>
                        <h5 className="font-semibold text-gray-900 mb-1">Rankings & Badges</h5>
                        <p className="text-sm text-gray-600">Compete and earn achievements</p>
                      </div>
                    </div>

                    {/* Call to Action */}
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        🚀 Choose Subscription Plan
                      </button>
                      <p className="text-xs text-gray-500">
                        Plans start from as low as 13,000 TZS per month
                      </p>
                    </div>
                  </div>
                )}
              </div>

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
        title="Confirm Level Change"
        open={showLevelChangeModal}
        onOk={handleLevelChangeConfirm}
        onCancel={() => {
          setShowLevelChangeModal(false);
          setPendingLevelChange(null);
        }}
        okText="Confirm"
        cancelText="Cancel"
      >
        <p>
          Are you sure you want to change your level to <strong>{pendingLevelChange}</strong>?
        </p>
        <p className="text-orange-600 text-sm mt-2">
          Note: Changing your level will reset your class selection and you'll only have access to content for the new level.
        </p>
      </Modal>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={() => {
          setShowSubscriptionModal(false);
          // Refresh user data to show updated subscription
          getUserData();
          message.success('Subscription updated successfully!');
        }}
      />

    </div>
  );
};

export default Profile;

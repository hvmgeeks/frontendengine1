import { message } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./index.css";
import {
  getAllUsers,
  blockUserById,
  deleteUserById,
} from "../../../apicalls/users";
import PageTitle from "../../../components/PageTitle";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { Card, Button, Input, Loading } from "../../../components/modern";
import AdminLayout from "../../../components/AdminLayout";
import AdminCard from "../../../components/AdminCard";
import {
  TbUsers,
  TbSearch,
  TbFilter,
  TbUserCheck,
  TbUserX,
  TbTrash,
  TbEye,
  TbSchool,
  TbMail,
  TbUser,
  TbCrown,
  TbClock,
  TbX,
  TbPlus,
  TbDownload,
  TbDashboard
} from "react-icons/tb";

function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSubscription, setFilterSubscription] = useState("all");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // Function to determine subscription status for filtering based on subscription dates
  const getSubscriptionFilterStatus = (user) => {
    const now = new Date();
    const paymentRequired = user.paymentRequired;
    const subscriptionEndDate = user.subscriptionEndDate;
    const subscriptionStartDate = user.subscriptionStartDate;

    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`User ${user.name}:`, {
        paymentRequired,
        subscriptionStartDate,
        subscriptionEndDate,
        isExpired: subscriptionEndDate ? new Date(subscriptionEndDate) < now : 'no end date'
      });
    }

    // NO-PLAN: Users who never required payment or never had subscription
    if (!paymentRequired) {
      return 'no-plan';
    }

    // Users with paymentRequired = true (have or had a subscription)
    if (paymentRequired) {
      // Check if subscription has expired by date
      if (subscriptionEndDate) {
        const endDate = new Date(subscriptionEndDate);

        if (endDate < now) {
          // Subscription end date has passed - EXPIRED PLAN
          return 'expired-plan';
        } else {
          // Subscription is still valid by date - ON PLAN
          return 'on-plan';
        }
      } else {
        // Has paymentRequired = true but no end date specified
        // This could be a lifetime subscription or missing data
        // Assume they are on plan if they have paymentRequired = true
        return 'on-plan';
      }
    }

    // Default fallback for edge cases
    return 'no-plan';
  };

  const getUsersData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getAllUsers();
      dispatch(HideLoading());
      if (response.success) {
        setUsers(response.users);
        console.log("users loaded:", response.users.length);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };
  const blockUser = async (studentId) => {
    try {
      dispatch(ShowLoading());
      const response = await blockUserById({
        studentId,
      });
      dispatch(HideLoading());
      if (response.success) {
        message.success(response.message);
        getUsersData();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const deleteUser = async (studentId) => {
    try {
      dispatch(ShowLoading());
      const response = await deleteUserById({ studentId });
      dispatch(HideLoading());
      if (response.success) {
        message.success("User deleted successfully");
        getUsersData();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };


  // Filter users based on search, status, and subscription
  useEffect(() => {
    let filtered = users;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.school?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.class?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(user => {
        if (filterStatus === "blocked") return user.isBlocked;
        if (filterStatus === "active") return !user.isBlocked;
        return true;
      });
    }

    // Filter by subscription plan
    if (filterSubscription !== "all") {
      filtered = filtered.filter(user => {
        const subscriptionStatus = getSubscriptionFilterStatus(user);
        return subscriptionStatus === filterSubscription;
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, filterStatus, filterSubscription]);

  useEffect(() => {
    getUsersData();
  }, []);

  const UserCard = ({ user }) => {
    const subscriptionStatus = getSubscriptionFilterStatus(user);

    const getSubscriptionBadge = () => {
      switch (subscriptionStatus) {
        case 'on-plan':
          return (
            <span className="badge-modern bg-green-100 text-green-800 flex items-center space-x-1">
              <TbCrown className="w-3 h-3" />
              <span>On Plan</span>
            </span>
          );
        case 'expired-plan':
          return (
            <span className="badge-modern bg-orange-100 text-orange-800 flex items-center space-x-1">
              <TbClock className="w-3 h-3" />
              <span>Expired</span>
            </span>
          );
        case 'no-plan':
          return (
            <span className="badge-modern bg-gray-100 text-gray-800 flex items-center space-x-1">
              <TbX className="w-3 h-3" />
              <span>No Plan</span>
            </span>
          );
        default:
          return null;
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="p-6 hover:shadow-large">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                user.isBlocked ? 'bg-error-100' : 'bg-primary-100'
              }`}>
                <TbUser className={`w-6 h-6 ${user.isBlocked ? 'text-error-600' : 'text-primary-600'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <span className={`badge-modern ${
                    user.isBlocked ? 'bg-error-100 text-error-800' : 'bg-success-100 text-success-800'
                  }`}>
                    {user.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                  {getSubscriptionBadge()}
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <TbMail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TbSchool className="w-4 h-4" />
                    <span>{user.school || 'No school specified'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TbUsers className="w-4 h-4" />
                    <span>Class: {user.class || 'Not assigned'}</span>
                  </div>

                  {/* Subscription Details */}
                  {user.subscriptionPlan && (
                    <div className="flex items-center space-x-2">
                      <TbCrown className="w-4 h-4" />
                      <span>Plan: {user.subscriptionPlan}</span>
                    </div>
                  )}

                  {/* Subscription Period */}
                  {user.subscriptionStartDate && (
                    <div className="flex items-center space-x-2">
                      <TbClock className="w-4 h-4" />
                      <span>Started: {formatDate(user.subscriptionStartDate)}</span>
                    </div>
                  )}
                  {user.subscriptionEndDate && (
                    <div className="flex items-center space-x-2">
                      <TbClock className="w-4 h-4" />
                      <span className={new Date(user.subscriptionEndDate) < new Date() ? 'text-red-600 font-medium' : 'text-green-600'}>
                        {new Date(user.subscriptionEndDate) < new Date() ? 'Expired: ' : 'Expires: '}
                        {formatDate(user.subscriptionEndDate)}
                      </span>
                    </div>
                  )}

                  {/* Payment Status */}
                  {user.paymentRequired !== undefined && (
                    <div className="flex items-center space-x-2">
                      <TbCrown className="w-4 h-4" />
                      <span className={user.paymentRequired ? 'text-blue-600' : 'text-gray-600'}>
                        {user.paymentRequired ? 'Paid Subscription' : 'Free Account'}
                      </span>
                    </div>
                  )}

                  {/* Activity Information */}
                  {user.totalQuizzesTaken > 0 && (
                    <div className="flex items-center space-x-2">
                      <TbUser className="w-4 h-4" />
                      <span>Quizzes: {user.totalQuizzesTaken}</span>
                    </div>
                  )}
                  {user.lastActivity && (
                    <div className="flex items-center space-x-2">
                      <TbClock className="w-4 h-4" />
                      <span>Last Active: {formatDate(user.lastActivity)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={user.isBlocked ? "success" : "warning"}
                size="sm"
                onClick={() => blockUser(user.studentId)}
                icon={user.isBlocked ? <TbUserCheck /> : <TbUserX />}
              >
                {user.isBlocked ? "Unblock" : "Block"}
              </Button>

              <Button
                variant="error"
                size="sm"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this user?")) {
                    deleteUser(user.studentId);
                  }
                }}
                icon={<TbTrash />}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  const actionButtons = [
    <motion.button
      key="reports"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/admin/reports')}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
    >
      <TbEye className="w-4 h-4" />
      <span className="hidden sm:inline">View Reports</span>
    </motion.button>,
    <motion.button
      key="export"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {/* Add export functionality */}}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
    >
      <TbDownload className="w-4 h-4" />
      <span className="hidden sm:inline">Export</span>
    </motion.button>
  ];

  return (
    <AdminLayout showHeader={false}>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Dashboard Shortcut */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 text-white border border-white/30"
              >
                <TbDashboard className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
              </motion.button>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  User Management
                </h1>
                <p className="text-green-100 text-sm sm:text-base">
                  Manage student accounts, permissions, and access controls
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {actionButtons}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <AdminCard className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Users</p>
              <p className="text-2xl sm:text-3xl font-bold">{users.length}</p>
              <p className="text-blue-200 text-xs mt-1">All registered</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TbUsers className="w-6 h-6" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Active Users</p>
              <p className="text-2xl sm:text-3xl font-bold">{users.filter(u => !u.isBlocked).length}</p>
              <p className="text-green-200 text-xs mt-1">Not blocked</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TbUserCheck className="w-6 h-6" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">Expired Plans</p>
              <p className="text-2xl sm:text-3xl font-bold">{users.filter(u => getSubscriptionFilterStatus(u) === 'expired-plan').length}</p>
              <p className="text-orange-200 text-xs mt-1">Need renewal</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TbClock className="w-6 h-6" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">No Plan</p>
              <p className="text-2xl sm:text-3xl font-bold">{users.filter(u => getSubscriptionFilterStatus(u) === 'no-plan').length}</p>
              <p className="text-purple-200 text-xs mt-1">Free users</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TbX className="w-6 h-6" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard
        title="Search & Filter"
        subtitle="Find and filter users by various criteria"
        className="mb-6 sm:mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search Users
            </label>
            <Input
              placeholder="Search by name, email, school, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<TbSearch />}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Plan
            </label>
            <select
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">All Plans</option>
              <option value="on-plan">On Plan</option>
              <option value="expired-plan">Expired Plan</option>
              <option value="no-plan">No Plan</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
          <div>
            {(searchQuery || filterStatus !== "all" || filterSubscription !== "all") && (
              <span className="text-sm text-slate-600">
                Showing {filteredUsers.length} of {users.length} users
                {filterSubscription !== "all" && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {filterSubscription === 'on-plan' && 'On Plan'}
                    {filterSubscription === 'expired-plan' && 'Expired Plan'}
                    {filterSubscription === 'no-plan' && 'No Plan'}
                  </span>
                )}
              </span>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSearchQuery("");
              setFilterStatus("all");
              setFilterSubscription("all");
            }}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 flex items-center gap-2"
          >
            <TbFilter className="w-4 h-4" />
            Clear Filters
          </motion.button>
        </div>
      </AdminCard>

      {/* Users Grid */}
      <AdminCard
        title={`Users (${filteredUsers.length})`}
        subtitle="Manage individual user accounts and permissions"
        loading={loading}
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading text="Loading users..." />
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="space-y-4">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.studentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <UserCard user={user} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TbUsers className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Users Found</h3>
            <p className="text-slate-600">
              {searchQuery || filterStatus !== "all" || filterSubscription !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No users have been registered yet"}
            </p>
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
}

export default Users;

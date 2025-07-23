import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Progress } from 'antd';
import {
  TbUsers,
  TbBook,
  TbFileText,
  TbChartBar,
  TbTrendingUp,
  TbTarget,
  TbAward,
  TbClock,
  TbPlus,
  TbEye,
  TbRobot,
  TbBell,
  TbMessageCircle
} from 'react-icons/tb';
import { getAllUsers } from '../../../apicalls/users';
import { getAllExams } from '../../../apicalls/exams';
import { getAllReports } from '../../../apicalls/reports';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';
import AdminLayout from '../../../components/AdminLayout';
import AdminCard from '../../../components/AdminCard';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalExams: 0,
    totalReports: 0,
    averageScore: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      dispatch(ShowLoading()); // Restore normal loading behavior
      
      // Fetch users data
      const usersResponse = await getAllUsers();
      const users = usersResponse.success ? usersResponse.users : [];

      // Fetch exams data
      const examsResponse = await getAllExams();
      const exams = examsResponse.success ? examsResponse.data : [];

      // Fetch reports data (with empty filters to get all reports)
      const reportsResponse = await getAllReports({ examName: '', userName: '', page: 1, limit: 1000 });
      const reports = reportsResponse.success ? reportsResponse.data : [];

      // Calculate statistics
      const totalUsers = users.length;
      const activeUsers = users.filter(u => !u.isBlocked).length;
      const totalExams = exams.length;
      const totalReports = reports.length;
      
      // Calculate average score from reports
      const averageScore = reports.length > 0 
        ? reports.reduce((sum, report) => sum + (report.percentage || 0), 0) / reports.length
        : 0;
      
      // Calculate completion rate
      const completionRate = totalUsers > 0 ? (totalReports / totalUsers) * 100 : 0;

      setStats({
        totalUsers,
        activeUsers,
        totalExams,
        totalReports,
        averageScore: Math.round(averageScore),
        completionRate: Math.round(completionRate)
      });

      setLoading(false);
      dispatch(HideLoading()); // Restore normal loading behavior
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
      dispatch(HideLoading()); // Restore normal loading behavior
    }
  };



  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage student accounts',
      icon: TbUsers,
      path: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'Create Exam',
      description: 'Add new exams and questions',
      icon: TbFileText,
      path: '/admin/exams/add',
      color: 'bg-green-500'
    },
    {
      title: 'Study Materials',
      description: 'Manage learning resources',
      icon: TbBook,
      path: '/admin/study-materials',
      color: 'bg-orange-500'
    },
    {
      title: 'View Reports',
      description: 'Analytics and performance',
      icon: TbChartBar,
      path: '/admin/reports',
      color: 'bg-indigo-500'
    },
    {
      title: 'Notifications',
      description: 'Send announcements',
      icon: TbBell,
      path: '/admin/notifications',
      color: 'bg-pink-500'
    },
    {
      title: 'Forum Management',
      description: 'Manage community forum',
      icon: TbMessageCircle,
      path: '/admin/forum',
      color: 'bg-purple-500'
    }
  ];

  const quickActionButtons = [
    <motion.button
      key="users"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/admin/users')}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
    >
      <TbUsers className="w-4 h-4" />
      <span className="hidden sm:inline">Manage Users</span>
    </motion.button>,
    <motion.button
      key="exams"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/admin/exams/add')}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
    >
      <TbPlus className="w-4 h-4" />
      <span className="hidden sm:inline">Create Exam</span>
    </motion.button>,
    <motion.button
      key="ai"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/admin/ai-questions')}
      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
    >
      <TbRobot className="w-4 h-4" />
      <span className="hidden sm:inline">AI Questions</span>
    </motion.button>,
  ];

  return (
    <AdminLayout showHeader={false}>
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                Here's what's happening with your educational platform today.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActionButtons}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <AdminCard className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Students</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.totalUsers}</p>
              <p className="text-blue-200 text-xs mt-1">Registered users</p>
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
              <p className="text-2xl sm:text-3xl font-bold">{stats.activeUsers}</p>
              <p className="text-green-200 text-xs mt-1">Currently active</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TbTrendingUp className="w-6 h-6" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Total Exams</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.totalExams}</p>
              <p className="text-purple-200 text-xs mt-1">Available exams</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TbFileText className="w-6 h-6" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">Avg Score</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.averageScore}%</p>
              <p className="text-orange-200 text-xs mt-1">Overall performance</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TbAward className="w-6 h-6" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Quick Actions and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
        {/* Quick Actions */}
        <AdminCard 
          title="Quick Actions" 
          subtitle="Common administrative tasks"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <motion.button
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={() => navigate(action.path)}
                  className={`p-4 rounded-xl ${action.color} text-white hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-left`}
                >
                  <IconComponent className="w-8 h-8 mb-3" />
                  <h3 className="font-semibold text-sm sm:text-base mb-1">{action.title}</h3>
                  <p className="text-xs sm:text-sm opacity-90">{action.description}</p>
                </motion.button>
              );
            })}
          </div>
        </AdminCard>

        {/* Performance Analytics */}
        <AdminCard 
          title="Performance Analytics" 
          subtitle="System performance overview"
        >
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Completion Rate</span>
                <span className="text-sm font-bold text-slate-900">{stats.completionRate}%</span>
              </div>
              <Progress 
                percent={stats.completionRate} 
                strokeColor={{
                  '0%': '#3B82F6',
                  '100%': '#8B5CF6',
                }}
                className="mb-4"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Average Score</span>
                <span className="text-sm font-bold text-slate-900">{stats.averageScore}%</span>
              </div>
              <Progress 
                percent={stats.averageScore} 
                strokeColor={{
                  '0%': '#10B981',
                  '100%': '#059669',
                }}
                className="mb-4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.totalReports}</p>
                <p className="text-xs text-slate-600">Total Attempts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{Math.round((stats.activeUsers / stats.totalUsers) * 100) || 0}%</p>
                <p className="text-xs text-slate-600">User Activity</p>
              </div>
            </div>
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

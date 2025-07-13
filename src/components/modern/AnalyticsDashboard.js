import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TbChartLine, 
  TbTrophy, 
  TbTarget, 
  TbFlame, 
  TbTrendingUp, 
  TbCalendar,
  TbBook,
  TbClock,
  TbStar,
  TbRefresh
} from 'react-icons/tb';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { AchievementList } from './AchievementBadge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsDashboard = ({ userId, className = '' }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [error, setError] = useState(null);

  const fetchAnalytics = async (selectedTimeframe = timeframe) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quiz/analytics/${userId}?timeframe=${selectedTimeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAnalytics();
    }
  }, [userId]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    fetchAnalytics(newTimeframe);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchAnalytics()}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  // Chart configurations
  const scoreProgressionData = {
    labels: analytics.scoreProgression.map((_, index) => `Quiz ${index + 1}`),
    datasets: [
      {
        label: 'Score %',
        data: analytics.scoreProgression.map(item => item.score),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const subjectPerformanceData = {
    labels: Object.keys(analytics.subjectPerformance),
    datasets: [
      {
        label: 'Average Score %',
        data: Object.values(analytics.subjectPerformance).map(subject => subject.averageScore),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
      },
    ],
  };

  const passRateData = {
    labels: ['Passed', 'Failed'],
    datasets: [
      {
        data: [analytics.passRate, 100 - analytics.passRate],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-6 ${className}`}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <TbChartLine className="w-6 h-6 mr-2 text-blue-500" />
          Performance Analytics
        </h2>
        
        <div className="flex items-center space-x-2">
          {['7d', '30d', '90d', 'all'].map((period) => (
            <button
              key={period}
              onClick={() => handleTimeframeChange(period)}
              className={`
                px-3 py-1 rounded-lg text-sm font-medium transition-colors
                ${timeframe === period 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {period === 'all' ? 'All Time' : period.toUpperCase()}
            </button>
          ))}
          
          <button
            onClick={() => fetchAnalytics()}
            className="p-2 text-gray-600 hover:text-blue-500 transition-colors"
          >
            <TbRefresh className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalQuizzes}</p>
            </div>
            <TbBook className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.averageScore}%</p>
            </div>
            <TbTarget className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pass Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.passRate}%</p>
            </div>
            <TbTrophy className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.streakData.current}</p>
            </div>
            <TbFlame className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Progression */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Progression</h3>
          {analytics.scoreProgression.length > 0 ? (
            <Line data={scoreProgressionData} options={chartOptions} />
          ) : (
            <p className="text-gray-500 text-center py-8">No quiz data available</p>
          )}
        </motion.div>

        {/* Subject Performance */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
          {Object.keys(analytics.subjectPerformance).length > 0 ? (
            <Bar data={subjectPerformanceData} options={chartOptions} />
          ) : (
            <p className="text-gray-500 text-center py-8">No subject data available</p>
          )}
        </motion.div>

        {/* Pass Rate */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pass Rate</h3>
          <div className="w-64 mx-auto">
            <Doughnut data={passRateData} />
          </div>
        </motion.div>

        {/* Recent Achievements */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
          {analytics.recentAchievements && analytics.recentAchievements.length > 0 ? (
            <AchievementList
              achievements={analytics.recentAchievements}
              maxDisplay={10}
              size="medium"
              layout="grid"
            />
          ) : (
            <p className="text-gray-500 text-center py-8">No achievements yet</p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnalyticsDashboard;

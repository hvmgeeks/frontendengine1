import React, { useState, useEffect } from "react";
import './index.css';
import PageTitle from "../../../components/PageTitle";
import { message, Card, Progress, Statistic, Select, Button, Empty, Table, Tag, Modal } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { getAllReportsByUser } from "../../../apicalls/reports";
import { motion } from "framer-motion";
import {
  TbTrophy,
  TbTarget,
  TbTrendingUp,
  TbCalendar,
  TbClock,
  TbAward,
  TbChartBar,
  TbDownload,
  TbFilter,
  TbEye,
  TbCheck,
  TbX,
  TbFlame
} from "react-icons/tb";
import moment from "moment";

const { Option } = Select;

// Month names for display
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function UserReports() {
  const [reportsData, setReportsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterVerdict, setFilterVerdict] = useState('all');
  const [filterMonth, setFilterMonth] = useState(null); // Month filter (1-12)
  const [filterDay, setFilterDay] = useState(null); // Day filter (1-31)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear()); // Current year by default
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [stats, setStats] = useState({
    totalExams: 0,
    passedExams: 0,
    averageScore: 0,
    streak: 0,
    bestScore: 0
  });
  const [todayStats, setTodayStats] = useState({
    totalToday: 0,
    passedToday: 0,
    failedToday: 0,
    averageToday: 0,
    todayReports: []
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const dispatch = useDispatch();

  // Helper function to safely get correct answers count
  // Handles both array format (old) and number format (new)
  const getCorrectAnswersCount = (result) => {
    if (!result) return 0;
    if (Array.isArray(result.correctAnswers)) return result.correctAnswers.length;
    if (typeof result.correctAnswers === 'number') return result.correctAnswers;
    return 0;
  };

  // Helper function to safely get wrong answers count
  const getWrongAnswersCount = (result) => {
    if (!result) return 0;
    if (Array.isArray(result.wrongAnswers)) return result.wrongAnswers.length;
    if (typeof result.wrongAnswers === 'number') return result.wrongAnswers;
    return 0;
  };



  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      setStats({
        totalExams: 0,
        passedExams: 0,
        averageScore: 0,
        streak: 0,
        bestScore: 0
      });
      return;
    }

    const totalExams = data.length;
    const passedExams = data.filter(report => report.result?.verdict === 'Pass').length;
    const scores = data.map(report => {
      const obtained = getCorrectAnswersCount(report.result) || 0;
      const total = report.exam?.totalMarks || 1;
      return (obtained / total) * 100;
    });

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalExams;
    const bestScore = Math.max(...scores);

    // Calculate streak (consecutive passes)
    let currentStreak = 0;
    let maxStreak = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].result?.verdict === 'Pass') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    setStats({
      totalExams,
      passedExams,
      averageScore: Math.round(averageScore),
      streak: maxStreak,
      bestScore: Math.round(bestScore)
    });
  };

  const calculateTodayStats = (data) => {
    const today = moment().startOf('day');
    const todayReports = data.filter(report => {
      const reportDate = moment(report.createdAt).startOf('day');
      return reportDate.isSame(today);
    });

    if (todayReports.length === 0) {
      setTodayStats({
        totalToday: 0,
        passedToday: 0,
        failedToday: 0,
        averageToday: 0,
        todayReports: []
      });
      return;
    }

    const passedToday = todayReports.filter(report => report.result?.verdict === 'Pass').length;
    const failedToday = todayReports.filter(report => report.result?.verdict === 'Fail').length;

    const todayScores = todayReports.map(report => {
      const obtained = getCorrectAnswersCount(report.result) || 0;
      const total = report.exam?.totalMarks || 1;
      return (obtained / total) * 100;
    });

    const averageToday = todayScores.reduce((sum, score) => sum + score, 0) / todayReports.length;

    setTodayStats({
      totalToday: todayReports.length,
      passedToday,
      failedToday,
      averageToday: Math.round(averageToday),
      todayReports
    });
  };

  const getData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getAllReportsByUser();
      if (response.success) {
        setReportsData(response.data);
        setFilteredData(response.data);
        calculateStats(response.data);
        calculateTodayStats(response.data);
      } else {
        message.error(response.message);
      }
      dispatch(HideLoading());
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const applyFilters = () => {
    let filtered = [...reportsData];

    console.log('🔍 Applying filters:', {
      totalReports: reportsData.length,
      filterVerdict,
      filterMonth,
      filterDay,
      filterYear
    });

    if (filterVerdict !== 'all') {
      filtered = filtered.filter(report => report.result?.verdict === filterVerdict);
      console.log(`✅ After verdict filter: ${filtered.length} reports`);
    }

    // Filter by month and day (year defaults to current year)
    if (filterMonth !== null || filterDay !== null) {
      filtered = filtered.filter(report => {
        const reportDate = moment(report.createdAt);
        const reportYear = reportDate.year();
        const reportMonth = reportDate.month() + 1; // moment months are 0-indexed
        const reportDay = reportDate.date();

        // Only filter by year if month or day is selected
        if (reportYear !== filterYear) return false;

        // Filter by month if selected
        if (filterMonth !== null && reportMonth !== filterMonth) return false;

        // Filter by day if selected
        if (filterDay !== null && reportDay !== filterDay) return false;

        return true;
      });
      console.log(`📅 After date filter (Month: ${filterMonth}, Day: ${filterDay}, Year: ${filterYear}): ${filtered.length} reports`);
    }

    console.log(`✨ Final filtered results: ${filtered.length} reports`);
    setFilteredData(filtered);
    calculateStats(filtered);
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterVerdict, filterMonth, filterDay, filterYear, reportsData]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getVerdictIcon = (verdict) => {
    return verdict === 'Pass' ?
      <TbCheck className="w-5 h-5 text-green-600" /> :
      <TbX className="w-5 h-5 text-red-600" />;
  };



  const handleViewDetails = (record) => {
    setSelectedReport(record);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedReport(null);
  };

  const getResponsiveColumns = () => {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    const baseColumns = [
      {
        title: 'Exam',
        dataIndex: 'examName',
        key: 'examName',
        render: (text, record) => (
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
              {record.exam?.name || 'Unnamed Exam'}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 truncate">
              {record.exam?.subject || 'General'}
            </div>
            {isMobile && (
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-400">
                  {moment(record.createdAt).format("MMM DD, YYYY")}
                </div>
                <Button
                  type="link"
                  size="small"
                  icon={<TbEye />}
                  onClick={() => handleViewDetails(record)}
                  className="text-blue-500 p-0 h-auto"
                >
                  View
                </Button>
              </div>
            )}
          </div>
        ),
        width: isMobile ? 180 : isTablet ? 200 : 250,
        ellipsis: true,
      },
      {
        title: 'Score',
        dataIndex: 'score',
        key: 'score',
        render: (text, record) => {
          const obtained = getCorrectAnswersCount(record.result) || 0;
          const total = record.exam?.totalMarks || 1;
          const percentage = Math.round((obtained / total) * 100);

          return (
            <div className="text-center">
              {/* BIG PERCENTAGE - EASY TO SEE */}
              <div className={`text-2xl sm:text-3xl font-black mb-1 ${getScoreColor(percentage)}`}>
                {percentage}%
              </div>
              {/* CORRECT/TOTAL - CLEAR */}
              <div className="text-base sm:text-lg font-bold text-gray-700 mb-2">
                {obtained}/{total}
              </div>
              {/* Progress Bar */}
              <Progress
                percent={percentage}
                size="small"
                strokeColor={percentage >= 60 ? '#10b981' : '#ef4444'}
                showInfo={false}
              />
            </div>
          );
        },
        width: isMobile ? 100 : 140,
        sorter: (a, b) => {
          const scoreA = Math.round(((getCorrectAnswersCount(a.result) || 0) / (a.exam?.totalMarks || 1)) * 100);
          const scoreB = Math.round(((getCorrectAnswersCount(b.result) || 0) / (b.exam?.totalMarks || 1)) * 100);
          return scoreA - scoreB;
        },
      },
      {
        title: 'Result',
        dataIndex: 'verdict',
        key: 'verdict',
        render: (text, record) => {
          const verdict = record.result?.verdict;
          const isPassed = verdict === 'Pass';

          return (
            <Tag
              icon={!isMobile ? getVerdictIcon(verdict) : null}
              color={isPassed ? 'success' : 'error'}
              className="font-medium text-xs sm:text-sm"
            >
              {isMobile ? (isPassed ? 'P' : 'F') : (verdict || 'N/A')}
            </Tag>
          );
        },
        width: isMobile ? 50 : 100,
        filters: !isMobile ? [
          { text: 'Pass', value: 'Pass' },
          { text: 'Fail', value: 'Fail' },
        ] : undefined,
        onFilter: !isMobile ? (value, record) => record.result?.verdict === value : undefined,
      },
    ];

    // Add date column for tablet and desktop
    if (!isMobile) {
      baseColumns.splice(1, 0, {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'date',
        render: (date) => (
          <div className="text-sm">
            <div className="font-medium">{moment(date).format("MMM DD, YYYY")}</div>
            <div className="text-gray-500">{moment(date).format("HH:mm")}</div>
          </div>
        ),
        width: isTablet ? 100 : 120,
      });
    }

    // Add actions column for desktop
    if (!isMobile) {
      baseColumns.push({
        title: 'Actions',
        key: 'actions',
        render: (text, record) => (
          <Button
            type="primary"
            size="small"
            icon={<TbEye />}
            onClick={() => handleViewDetails(record)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isTablet ? '' : 'View'}
          </Button>
        ),
        width: isTablet ? 60 : 80,
      });
    }

    return baseColumns;
  };

  const columns = getResponsiveColumns();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">


      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">


        {/* Stats Cards - PROFESSIONAL DESIGN */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6"
        >
          {/* Total Exams */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-amber-500 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Exams</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.totalExams}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TbTarget className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Passed */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-amber-500 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Passed</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.passedExams}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TbCheck className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-amber-500 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Average Score</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.averageScore}%</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TbTrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Best Score */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-amber-500 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Best Score</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.bestScore}%</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TbTrophy className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Best Streak */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-amber-500 p-4 sm:col-span-3 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Best Streak</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.streak}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TbFlame className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>


        </motion.div>

        {/* Today's Summary Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6 sm:mb-8"
        >
          {todayStats.totalToday > 0 ? (
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 border-2 border-blue-400">{/* Removed decorative circles */}

              {/* Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-purple-400 bg-white rounded-xl p-4 shadow-lg">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <TbCalendar className="w-7 h-7 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                    Today's Summary
                  </h2>
                  <p className="text-gray-800 text-sm font-bold">{moment().format('dddd, MMMM Do YYYY')}</p>
                </div>
                <div className="ml-auto">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 rounded-full font-black text-base shadow-lg border-2 border-orange-600">
                    <span className="text-white drop-shadow-lg">🔥 {todayStats.totalToday} Quiz{todayStats.totalToday > 1 ? 'zes' : ''}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {/* Total Quizzes Today */}
                <div className="bg-white rounded-xl p-4 border-2 border-blue-400 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                      <TbChartBar className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <p className="text-blue-800 text-xs sm:text-sm font-bold mb-1">Quizzes Taken</p>
                  <p className="text-3xl sm:text-4xl font-black text-blue-900">{todayStats.totalToday}</p>
                </div>

                {/* Passed Today */}
                <div className="bg-white rounded-xl p-4 border-2 border-green-400 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-md">
                      <TbCheck className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <p className="text-green-800 text-xs sm:text-sm font-bold mb-1">Passed</p>
                  <p className="text-3xl sm:text-4xl font-black text-green-900">{todayStats.passedToday}</p>
                </div>

                {/* Failed Today */}
                <div className="bg-white rounded-xl p-4 border-2 border-red-400 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
                      <TbX className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <p className="text-red-800 text-xs sm:text-sm font-bold mb-1">Failed</p>
                  <p className="text-3xl sm:text-4xl font-black text-red-900">{todayStats.failedToday}</p>
                </div>

                {/* Average Score Today */}
                <div className="bg-white rounded-xl p-4 border-2 border-amber-400 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center shadow-md">
                      <TbTrendingUp className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <p className="text-amber-800 text-xs sm:text-sm font-bold mb-1">Avg Score</p>
                  <p className="text-3xl sm:text-4xl font-black text-amber-900">{todayStats.averageToday}%</p>
                </div>
              </div>

              {/* Today's Reports List */}
              <div className="bg-white rounded-xl p-5 border-2 border-purple-300 shadow-lg">
                <h3 className="text-gray-900 font-black text-lg mb-4 flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                    <TbChartBar className="w-6 h-6 text-white" />
                  </div>
                  Today's Quizzes
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {todayStats.todayReports.map((report, index) => {
                    const score = ((getCorrectAnswersCount(report.result) / report.exam?.totalMarks) * 100).toFixed(0);
                    const isPassed = report.result?.verdict === 'Pass';
                    return (
                      <div key={index} className={`bg-white rounded-lg p-4 border-2 ${isPassed ? 'border-green-400 hover:border-green-500' : 'border-red-400 hover:border-red-500'} shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-between`}>
                        <div className="flex-1">
                          <p className="text-gray-900 font-black text-sm sm:text-base">{report.exam?.name || 'Quiz'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <TbClock className="w-4 h-4 text-gray-700" />
                            <p className="text-gray-700 text-xs font-semibold">{moment(report.createdAt).format('h:mm A')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-lg ${isPassed ? 'bg-green-200' : 'bg-red-200'}`}>
                            <span className={`${isPassed ? 'text-green-900' : 'text-red-900'} font-black text-lg`}>{score}%</span>
                          </div>
                          <Tag className={`${isPassed ? 'bg-green-600 border-green-700 text-white' : 'bg-red-600 border-red-700 text-white'} font-bold text-xs px-3 py-1`}>
                            {isPassed ? '✓ PASS' : '✗ FAIL'}
                          </Tag>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Motivational Message */}
              <div className="mt-6">
                {todayStats.passedToday === todayStats.totalToday ? (
                  <div className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 rounded-xl p-5 shadow-xl border-2 border-yellow-500">
                    <p className="text-gray-900 text-center font-black text-lg flex items-center justify-center gap-3">
                      <TbTrophy className="w-8 h-8 text-yellow-900" />
                      <span>Perfect day! You passed all quizzes! 🎉</span>
                      <TbTrophy className="w-8 h-8 text-yellow-900" />
                    </p>
                  </div>
                ) : todayStats.passedToday > todayStats.failedToday ? (
                  <div className="bg-gradient-to-r from-green-300 to-emerald-300 rounded-xl p-5 shadow-xl border-2 border-green-500">
                    <p className="text-gray-900 text-center font-black text-lg flex items-center justify-center gap-3">
                      <TbAward className="w-8 h-8 text-green-900" />
                      <span>Great job! Keep up the good work! 💪</span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-300 to-indigo-300 rounded-xl p-5 shadow-xl border-2 border-blue-500">
                    <p className="text-gray-900 text-center font-black text-lg flex items-center justify-center gap-3">
                      <TbTarget className="w-8 h-8 text-blue-900" />
                      <span>Keep practicing! You're improving! 📚</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 border-2 border-gray-400">
              {/* Removed decorative circles */}

              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <TbCalendar className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">No Quizzes Today</h2>
                <p className="text-gray-800 text-lg mb-2 font-bold">You haven't taken any quizzes yet today.</p>
                <p className="text-gray-700 text-base font-semibold">Start a quiz to see your daily progress!</p>
                <div className="mt-6">
                  <div className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-black shadow-xl text-lg">
                    🚀 Ready to start?
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <TbFilter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filter Results</h3>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Result Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Result</label>
                <Select
                  placeholder="All Results"
                  value={filterVerdict}
                  onChange={setFilterVerdict}
                  className="w-full"
                  size="large"
                  getPopupContainer={(trigger) => trigger.parentNode}
                  dropdownStyle={{ zIndex: 9999 }}
                >
                  <Option value="all">All Results</Option>
                  <Option value="Pass">Passed</Option>
                  <Option value="Fail">Failed</Option>
                </Select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Year</label>
                <Select
                  placeholder="Select Year"
                  value={filterYear}
                  onChange={setFilterYear}
                  className="w-full"
                  size="large"
                  getPopupContainer={(trigger) => trigger.parentNode}
                  dropdownStyle={{ zIndex: 9999 }}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <Option key={year} value={year}>{year}</Option>
                  ))}
                </Select>
              </div>

              {/* Month Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Month</label>
                <Select
                  placeholder="All Months"
                  value={filterMonth}
                  onChange={setFilterMonth}
                  className="w-full"
                  size="large"
                  allowClear
                  getPopupContainer={(trigger) => trigger.parentNode}
                  dropdownStyle={{ zIndex: 9999 }}
                >
                  {MONTH_NAMES.map((month, index) => (
                    <Option key={index + 1} value={index + 1}>{month}</Option>
                  ))}
                </Select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <Select
                  placeholder="All Dates"
                  value={filterDay}
                  onChange={setFilterDay}
                  className="w-full"
                  size="large"
                  allowClear
                  getPopupContainer={(trigger) => trigger.parentNode}
                  dropdownStyle={{ zIndex: 9999 }}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <Option key={day} value={day}>{day}</Option>
                  ))}
                </Select>
              </div>

              {/* Clear Button */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 opacity-0">Actions</label>
                <Button
                  onClick={() => {
                    setFilterVerdict('all');
                    setFilterYear(new Date().getFullYear());
                    setFilterMonth(null);
                    setFilterDay(null);
                  }}
                  size="large"
                  className="w-full"
                  icon={<TbX />}
                >
                  Clear All
                </Button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(filterVerdict !== 'all' || filterYear !== new Date().getFullYear() || filterMonth !== null || filterDay !== null) && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {filterVerdict !== 'all' && (
                  <Tag
                    closable
                    onClose={() => setFilterVerdict('all')}
                    className={filterVerdict === 'Pass' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}
                  >
                    Result: {filterVerdict}
                  </Tag>
                )}
                {filterYear !== new Date().getFullYear() && (
                  <Tag
                    closable
                    onClose={() => setFilterYear(new Date().getFullYear())}
                    className="bg-indigo-50 border-indigo-200 text-indigo-700"
                  >
                    Year: {filterYear}
                  </Tag>
                )}
                {filterMonth !== null && (
                  <Tag
                    closable
                    onClose={() => setFilterMonth(null)}
                    className="bg-purple-50 border-purple-200 text-purple-700"
                  >
                    Month: {moment().month(filterMonth - 1).format('MMMM')}
                  </Tag>
                )}
                {filterDay !== null && (
                  <Tag
                    closable
                    onClose={() => setFilterDay(null)}
                    className="bg-orange-50 border-orange-200 text-orange-700"
                  >
                    Date: {filterDay}
                  </Tag>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Exam Results Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100"
        >
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey={(record) => record._id}
            pagination={{
              pageSize: window.innerWidth < 768 ? 5 : 10,
              showSizeChanger: window.innerWidth >= 768,
              showQuickJumper: window.innerWidth >= 768,
              showTotal: (total, range) =>
                window.innerWidth >= 640
                  ? `${range[0]}-${range[1]} of ${total} results`
                  : `${range[0]}-${range[1]} / ${total}`,
              className: "px-3 sm:px-6 py-2 sm:py-4",
              simple: window.innerWidth < 640
            }}
            scroll={{ x: window.innerWidth < 768 ? 600 : 800 }}
            className="modern-table"
            size={window.innerWidth < 768 ? "middle" : "large"}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="py-8">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No exam results found</h3>
                      <p className="text-sm sm:text-base text-gray-500 px-4">Try adjusting your filters or take some exams to see your results here.</p>
                    </div>
                  }
                />
              )
            }}
          />
        </motion.div>

        {/* Details Modal */}
        <Modal
          title={
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <TbEye className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold">Exam Details</span>
            </div>
          }
          open={isModalVisible}
          onCancel={handleCloseModal}
          footer={[
            <Button key="close" onClick={handleCloseModal} size="large">
              Close
            </Button>
          ]}
          width={isMobile ? '95%' : isTablet ? 600 : 700}
          className="exam-details-modal"
        >
          {selectedReport && (
            <div className="space-y-6">
              {/* Exam Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-1 sm:col-span-2">
                    <div className="text-sm text-gray-600">Exam Name</div>
                    <div className="font-medium text-gray-900">{selectedReport.exam?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Subject</div>
                    <div className="font-medium text-gray-900">{selectedReport.exam?.subject || 'General'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Date Taken</div>
                    <div className="font-medium text-gray-900">{moment(selectedReport.createdAt).format("MMMM DD, YYYY [at] HH:mm")}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                    <div className="font-medium text-gray-900">{selectedReport.exam?.totalMarks || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Passing Marks</div>
                    <div className="font-medium text-gray-900">{selectedReport.exam?.passingMarks || 0}</div>
                  </div>
                </div>
              </div>

              {/* Performance Summary - SIMPLE AND CLEAR */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TbChartBar className="w-6 h-6 text-blue-600" />
                  Your Performance
                </h3>

                {/* Score - BIG AND CLEAR */}
                <div className="mb-6 text-center p-6 bg-white rounded-xl shadow-lg">
                  <div className="text-sm text-gray-600 mb-2">FINAL SCORE</div>
                  <div className={`text-6xl font-black mb-2 ${
                    Math.round(((getCorrectAnswersCount(selectedReport.result) || 0) / (selectedReport.exam?.totalMarks || 1)) * 100) >= 60
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {Math.round(((getCorrectAnswersCount(selectedReport.result) || 0) / (selectedReport.exam?.totalMarks || 1)) * 100)}%
                  </div>
                  <div className="text-2xl font-bold text-gray-700">
                    {getCorrectAnswersCount(selectedReport.result) || 0} / {selectedReport.exam?.totalMarks || 0}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Correct Answers</div>
                </div>

                {/* Breakdown - SIMPLE */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TbCheck className="w-6 h-6 text-green-600" />
                      <span className="text-sm font-medium text-green-700">CORRECT</span>
                    </div>
                    <div className="text-4xl font-black text-green-600">
                      {getCorrectAnswersCount(selectedReport.result) || 0}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TbX className="w-6 h-6 text-red-600" />
                      <span className="text-sm font-medium text-red-700">WRONG</span>
                    </div>
                    <div className="text-4xl font-black text-red-600">
                      {(selectedReport.exam?.totalMarks || 0) - (getCorrectAnswersCount(selectedReport.result) || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Status */}
              <div className={`rounded-lg p-4 ${
                selectedReport.result?.verdict === 'Pass'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-center gap-3">
                  {getVerdictIcon(selectedReport.result?.verdict)}
                  <span className={`text-xl font-semibold ${
                    selectedReport.result?.verdict === 'Pass' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {selectedReport.result?.verdict === 'Pass' ? 'Congratulations! You Passed' : 'Keep Trying! You Can Do Better'}
                  </span>
                </div>
                <div className="text-center mt-2">
                  <span className="text-sm text-gray-600">
                    {selectedReport.result?.verdict === 'Pass'
                      ? 'Great job on passing this exam!'
                      : 'Review the material and try again to improve your score.'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default UserReports;

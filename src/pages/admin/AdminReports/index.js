import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  TbDashboard,
  TbChartBar,
  TbUsers,
  TbTarget,
  TbTrendingUp,
  TbDownload,
  TbFilter,
  TbEye,
  TbCheck,
  TbX,
  TbCalendar,
  TbClock,
  TbFileText
} from "react-icons/tb";
import PageTitle from "../../../components/PageTitle";
import { message, Table, Card, Statistic, Input, Select, DatePicker, Button, Tag, Progress } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { getAllReports } from "../../../apicalls/reports";
import moment from "moment";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

function AdminReports() {
  const navigate = useNavigate();
  const [reportsData, setReportsData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stats, setStats] = useState({
    totalReports: 0,
    totalStudents: 0,
    averageScore: 0,
    passRate: 0,
    totalExams: 0,
    activeToday: 0
  });
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    examName: "",
    userName: "",
    verdict: "",
    dateRange: null
  });

  const calculateStats = (data) => {
    if (!data || data.length === 0) return;

    const totalReports = data.length;
    const uniqueStudents = new Set(data.map(report => report.user?._id)).size;
    const passedReports = data.filter(report => report.result?.verdict === 'Pass').length;
    const passRate = totalReports > 0 ? Math.round((passedReports / totalReports) * 100) : 0;

    const scores = data.map(report => {
      const obtained = report.result?.correctAnswers?.length || 0;
      const total = report.exam?.totalMarks || 1;
      return (obtained / total) * 100;
    });

    const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    const uniqueExams = new Set(data.map(report => report.exam?._id)).size;
    const today = moment().startOf('day');
    const activeToday = data.filter(report => moment(report.createdAt).isSame(today, 'day')).length;

    setStats({
      totalReports,
      totalStudents: uniqueStudents,
      averageScore,
      passRate,
      totalExams: uniqueExams,
      activeToday
    });
  };

  const columns = [
    {
      title: "Student",
      dataIndex: "userName",
      render: (text, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <TbUsers className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{record.user?.name || 'N/A'}</div>
            <div className="text-sm text-gray-500">{record.user?.email || ''}</div>
          </div>
        </div>
      ),
      width: 200,
    },
    {
      title: "Exam",
      dataIndex: "examName",
      render: (text, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.exam?.name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{record.exam?.subject || 'General'}</div>
        </div>
      ),
      width: 200,
    },
    {
      title: "Date & Time",
      dataIndex: "date",
      render: (text, record) => (
        <div className="flex items-center space-x-2">
          <TbCalendar className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium">{moment(record.createdAt).format("MMM DD, YYYY")}</div>
            <div className="text-xs text-gray-500">{moment(record.createdAt).format("HH:mm")}</div>
          </div>
        </div>
      ),
      width: 150,
    },
    {
      title: "Score",
      dataIndex: "score",
      render: (text, record) => {
        const obtained = record.result?.correctAnswers?.length || 0;
        const total = record.exam?.totalMarks || 1;
        const percentage = Math.round((obtained / total) * 100);

        return (
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{obtained}/{total}</div>
            <Progress
              percent={percentage}
              size="small"
              strokeColor={percentage >= 60 ? '#10b981' : '#ef4444'}
              showInfo={false}
            />
            <div className={`text-sm font-medium ${percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
              {percentage}%
            </div>
          </div>
        );
      },
      width: 120,
    },
    {
      title: "Result",
      dataIndex: "verdict",
      render: (text, record) => {
        const verdict = record.result?.verdict;
        const isPassed = verdict === 'Pass';

        return (
          <Tag
            icon={isPassed ? <TbCheck /> : <TbX />}
            color={isPassed ? 'success' : 'error'}
            className="font-medium"
          >
            {verdict || 'N/A'}
          </Tag>
        );
      },
      width: 100,
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Button
          type="primary"
          size="small"
          icon={<TbEye />}
          onClick={() => {/* Handle view details */}}
          className="bg-blue-500 hover:bg-blue-600"
        >
          View
        </Button>
      ),
      width: 80,
    },
  ];

  const getData = async (tempFilters, page = 1, limit = 10) => {
    try {
      dispatch(ShowLoading());
      const response = await getAllReports({
        ...tempFilters,
        page,
        limit,
      });
      if (response.success) {
        setReportsData(response.data);
        calculateStats(response.data);
        setPagination({
          ...pagination,
          current: page,
          total: response.pagination.totalReports,
        });
      } else {
        message.error(response.message);
      }
      dispatch(HideLoading());
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const handleSearch = (value, field) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleDateRangeChange = (dates) => {
    setFilters(prev => ({
      ...prev,
      dateRange: dates
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      examName: "",
      userName: "",
      verdict: "",
      dateRange: null
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  useEffect(() => {
    getData(filters, pagination.current, pagination.pageSize);
  }, [filters, pagination.current]);

  const handleTableChange = (pagination) => {
    getData(filters, pagination.current, pagination.pageSize);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <PageTitle title="Admin Reports" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <TbChartBar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Performance</span> Analytics
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive insights into student performance and exam analytics
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8"
        >
          <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                <TbFileText className="w-6 h-6 text-white" />
              </div>
              <Statistic
                title="Total Reports"
                value={stats.totalReports}
                valueStyle={{ color: '#1e40af', fontSize: '24px', fontWeight: 'bold' }}
              />
            </div>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                <TbUsers className="w-6 h-6 text-white" />
              </div>
              <Statistic
                title="Active Students"
                value={stats.totalStudents}
                valueStyle={{ color: '#059669', fontSize: '24px', fontWeight: 'bold' }}
              />
            </div>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3">
                <TbTrendingUp className="w-6 h-6 text-white" />
              </div>
              <Statistic
                title="Average Score"
                value={stats.averageScore}
                suffix="%"
                valueStyle={{ color: '#7c3aed', fontSize: '24px', fontWeight: 'bold' }}
              />
            </div>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-3">
                <TbTarget className="w-6 h-6 text-white" />
              </div>
              <Statistic
                title="Pass Rate"
                value={stats.passRate}
                suffix="%"
                valueStyle={{ color: '#ea580c', fontSize: '24px', fontWeight: 'bold' }}
              />
            </div>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-pink-50 to-pink-100">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mb-3">
                <TbFileText className="w-6 h-6 text-white" />
              </div>
              <Statistic
                title="Total Exams"
                value={stats.totalExams}
                valueStyle={{ color: '#db2777', fontSize: '24px', fontWeight: 'bold' }}
              />
            </div>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-indigo-50 to-indigo-100">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mb-3">
                <TbClock className="w-6 h-6 text-white" />
              </div>
              <Statistic
                title="Today's Activity"
                value={stats.activeToday}
                valueStyle={{ color: '#4338ca', fontSize: '24px', fontWeight: 'bold' }}
              />
            </div>
          </Card>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <TbFilter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filter Reports</h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Search
                placeholder="Search by exam name"
                value={filters.examName}
                onChange={(e) => handleSearch(e.target.value, 'examName')}
                className="w-full sm:w-48"
                size="large"
              />

              <Search
                placeholder="Search by student name"
                value={filters.userName}
                onChange={(e) => handleSearch(e.target.value, 'userName')}
                className="w-full sm:w-48"
                size="large"
              />

              <Select
                placeholder="Select Result"
                value={filters.verdict}
                onChange={(value) => handleSearch(value, 'verdict')}
                className="w-full sm:w-48"
                size="large"
              >
                <Option value="">All Results</Option>
                <Option value="Pass">Passed</Option>
                <Option value="Fail">Failed</Option>
              </Select>

              <RangePicker
                value={filters.dateRange}
                onChange={handleDateRangeChange}
                className="w-full sm:w-64"
                size="large"
                placeholder={['Start Date', 'End Date']}
              />

              <Button
                onClick={clearFilters}
                size="large"
                className="w-full sm:w-auto"
              >
                Clear Filters
              </Button>

              <Button
                type="primary"
                icon={<TbDownload />}
                size="large"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 border-none"
              >
                Export
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Reports Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
        >
          <Table
            columns={columns}
            dataSource={reportsData}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} reports`,
              className: "px-6 py-4"
            }}
            onChange={handleTableChange}
            rowKey={(record) => record._id}
            scroll={{ x: 1200 }}
            className="modern-table"
            size="large"
          />
        </motion.div>
      </div>
    </div>
  );
}

export default AdminReports;

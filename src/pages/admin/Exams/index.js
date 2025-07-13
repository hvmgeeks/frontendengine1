import { message, Table, Select, Input } from "antd";
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TbDashboard, TbPlus, TbFilter, TbSearch, TbX } from "react-icons/tb";
import { deleteExamById, getAllExams } from "../../../apicalls/exams";
import PageTitle from "../../../components/PageTitle";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";

function Exams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const dispatch = useDispatch();

  // Filter states
  const [filters, setFilters] = useState({
    level: '',
    class: '',
    topic: '',
    search: ''
  });

  const getExamsData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getAllExams();
      dispatch(HideLoading());
      if (response.success) {
        const examData = response.data.reverse();
        setExams(examData);
        setFilteredExams(examData);
        console.log(response, "exam");
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const deleteExam = async (examId) => {
    try {
      dispatch(ShowLoading());
      const response = await deleteExamById({
        examId,
      });
      dispatch(HideLoading());
      if (response.success) {
        message.success(response.message);
        getExamsData();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  // Get unique filter options from exams
  const filterOptions = useMemo(() => {
    const levels = [...new Set(exams.map(exam => exam.level).filter(Boolean))];
    const classes = [...new Set(exams.map(exam => exam.class).filter(Boolean))].sort();
    const topics = [...new Set(exams.map(exam => exam.topic).filter(Boolean))].sort();

    return { levels, classes, topics };
  }, [exams]);

  // Apply filters
  useEffect(() => {
    let filtered = [...exams];

    // Apply level filter
    if (filters.level) {
      filtered = filtered.filter(exam =>
        exam.level && exam.level.toLowerCase() === filters.level.toLowerCase()
      );
    }

    // Apply class filter
    if (filters.class) {
      filtered = filtered.filter(exam => exam.class === filters.class);
    }

    // Apply topic filter
    if (filters.topic) {
      filtered = filtered.filter(exam => exam.topic === filters.topic);
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(exam =>
        exam.name?.toLowerCase().includes(searchTerm) ||
        exam.subject?.toLowerCase().includes(searchTerm) ||
        exam.category?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredExams(filtered);
  }, [exams, filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      level: '',
      class: '',
      topic: '',
      search: ''
    });
  };

  const columns = [
    {
      title: "Exam Name",
      dataIndex: "name",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Level",
      dataIndex: "level",
      width: 100,
      render: (level) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          level === 'primary' ? 'bg-green-100 text-green-800' :
          level === 'secondary' ? 'bg-blue-100 text-blue-800' :
          level === 'advance' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {level?.charAt(0).toUpperCase() + level?.slice(1)}
        </span>
      ),
    },
    {
      title: "Class",
      dataIndex: "class",
      width: 100,
    },
    {
      title: "Subject",
      dataIndex: "subject",
      width: 120,
    },
    {
      title: "Topic",
      dataIndex: "topic",
      width: 150,
      ellipsis: true,
      render: (topic) => topic || <span className="text-gray-400 italic">General</span>,
    },
    {
      title: "Duration",
      dataIndex: "duration",
      width: 100,
      render: (duration) => `${Math.round(duration / 60)} min`,
    },
    {
      title: "Questions",
      dataIndex: "questions",
      width: 100,
      render: (questions) => questions?.length || 0,
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (text, record) => (
        <div className="flex gap-2">
          <i
            className="ri-pencil-line"
            onClick={() => navigate(`/admin/exams/edit/${record._id}`)}
          ></i>
          <i
            className="ri-delete-bin-line"
            onClick={() => deleteExam(record._id)}
          ></i>
        </div>
      ),
    },
  ];
  useEffect(() => {
    getExamsData();
  }, []);
  return (
    <div>
      <div className="flex justify-between mt-2 items-end">
        <div className="flex items-center gap-4">
          {/* Dashboard Shortcut */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-md"
          >
            <TbDashboard className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
          </motion.button>

          <PageTitle title="Exams" />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="primary-outlined-btn flex items-center gap-2"
          onClick={() => navigate("/admin/exams/add")}
        >
          <TbPlus className="w-4 h-4" />
          Add Exam
        </motion.button>
      </div>
      <div className="divider"></div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TbFilter className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
          {(filters.level || filters.class || filters.topic || filters.search) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <TbX className="w-4 h-4" />
              Clear All
            </motion.button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Exams
            </label>
            <Input
              placeholder="Search by name, subject, category..."
              prefix={<TbSearch className="w-4 h-4 text-gray-400" />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level
            </label>
            <Select
              placeholder="Select level"
              value={filters.level || undefined}
              onChange={(value) => handleFilterChange('level', value)}
              allowClear
              className="w-full"
            >
              {filterOptions.levels.map(level => (
                <Select.Option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <Select
              placeholder="Select class"
              value={filters.class || undefined}
              onChange={(value) => handleFilterChange('class', value)}
              allowClear
              className="w-full"
            >
              {filterOptions.classes.map(className => (
                <Select.Option key={className} value={className}>
                  {className}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Topic Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic
            </label>
            <Select
              placeholder="Select topic"
              value={filters.topic || undefined}
              onChange={(value) => handleFilterChange('topic', value)}
              allowClear
              className="w-full"
            >
              {filterOptions.topics.map(topic => (
                <Select.Option key={topic} value={topic}>
                  {topic}
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>

        {/* Filter Results Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredExams.length} of {exams.length} exams
          </span>
          {filteredExams.length !== exams.length && (
            <span className="text-blue-600 font-medium">
              Filters applied
            </span>
          )}
        </div>
      </div>

      <Table columns={columns} dataSource={filteredExams} />
    </div>
  );
}

export default Exams;

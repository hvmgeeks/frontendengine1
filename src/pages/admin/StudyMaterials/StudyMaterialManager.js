import React, { useState, useEffect } from "react";
import { Table, Button, Space, Select, Input, message, Modal, Tag, Tooltip } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { 
  getAllStudyMaterials, 
  deleteVideo, 
  deleteNote, 
  deletePastPaper, 
  deleteBook 
} from "../../../apicalls/study";
import { primarySubjects, secondarySubjects, advanceSubjects } from "../../../data/Subjects";
import {
  FaVideo,
  FaFileAlt,
  FaBook,
  FaGraduationCap,
  FaEdit,
  FaTrash,
  FaEye,
  FaFilter,
  FaSearch
} from "react-icons/fa";
import "./StudyMaterialManager.css";

const { Option } = Select;
const { Search } = Input;

function StudyMaterialManager({ onEdit }) {
  const dispatch = useDispatch();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    materialType: "",
    level: "",
    className: "",
    subject: ""
  });
  const [searchText, setSearchText] = useState("");

  // Get subjects based on level
  const getSubjectsForLevel = (level) => {
    switch (level) {
      case "primary":
        return primarySubjects;
      case "secondary":
        return secondarySubjects;
      case "advance":
        return advanceSubjects;
      default:
        return [];
    }
  };

  // Get classes based on level
  const getClassesForLevel = (level) => {
    switch (level) {
      case "primary":
        return ["1", "2", "3", "4", "5"];
      case "secondary":
        return ["6", "7", "8", "9", "10", "11"];
      case "advance":
        return ["12", "13"];
      default:
        return [];
    }
  };

  // Fetch materials
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      dispatch(ShowLoading());
      
      const response = await getAllStudyMaterials(filters);
      
      if (response.status === 200 && response.data.success) {
        setMaterials(response.data.data || []);
      } else {
        message.error("Failed to fetch study materials");
        setMaterials([]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      message.error("Failed to fetch study materials");
      setMaterials([]);
    } finally {
      setLoading(false);
      dispatch(HideLoading());
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset dependent filters
      if (key === "level") {
        newFilters.className = "";
        newFilters.subject = "";
      }
      
      return newFilters;
    });
  };

  // Handle delete
  const handleDelete = async (material) => {
    Modal.confirm({
      title: `Delete ${material.type.replace("-", " ")}`,
      content: `Are you sure you want to delete "${material.title}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          dispatch(ShowLoading());
          
          let response;
          switch (material.type) {
            case "videos":
              response = await deleteVideo(material._id);
              break;
            case "study-notes":
              response = await deleteNote(material._id);
              break;
            case "past-papers":
              response = await deletePastPaper(material._id);
              break;
            case "books":
              response = await deleteBook(material._id);
              break;
            default:
              throw new Error("Invalid material type");
          }

          if (response.status === 200 && response.data.success) {
            message.success(response.data.message);
            fetchMaterials(); // Refresh the list
          } else {
            message.error(response.data?.message || "Failed to delete material");
          }
        } catch (error) {
          console.error("Error deleting material:", error);
          message.error("Failed to delete material");
        } finally {
          dispatch(HideLoading());
        }
      }
    });
  };

  // Get material type icon
  const getMaterialIcon = (type) => {
    switch (type) {
      case "videos":
        return <FaVideo className="material-icon video" />;
      case "study-notes":
        return <FaFileAlt className="material-icon note" />;
      case "past-papers":
        return <FaGraduationCap className="material-icon paper" />;
      case "books":
        return <FaBook className="material-icon book" />;
      default:
        return <FaFileAlt className="material-icon" />;
    }
  };

  // Get material type label
  const getMaterialTypeLabel = (type) => {
    switch (type) {
      case "videos":
        return "Video";
      case "study-notes":
        return "Study Note";
      case "past-papers":
        return "Past Paper";
      case "books":
        return "Book";
      default:
        return type;
    }
  };

  // Filter materials based on search text
  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchText.toLowerCase()) ||
    material.subject.toLowerCase().includes(searchText.toLowerCase()) ||
    material.className.toLowerCase().includes(searchText.toLowerCase())
  );

  // Table columns
  const columns = [
    {
      title: "Material",
      key: "material",
      width: "30%",
      render: (_, record) => (
        <div className="material-info">
          <div className="material-header">
            {getMaterialIcon(record.type)}
            <div className="material-details">
              <div className="material-title">{record.title}</div>
              <div className="material-meta">
                <Tag color="blue">{getMaterialTypeLabel(record.type)}</Tag>
                <span className="meta-text">{record.subject} • Class {record.className}</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Level",
      dataIndex: "level",
      key: "level",
      width: "10%",
      render: (level) => (
        <Tag color={level === "primary" ? "green" : level === "secondary" ? "orange" : "purple"}>
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </Tag>
      ),
    },
    {
      title: "Class",
      dataIndex: "className",
      key: "className",
      width: "10%",
      render: (className) => <span className="class-badge">Class {className}</span>,
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      width: "15%",
    },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      width: "10%",
      render: (year) => year || "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: "25%",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit material">
            <Button
              type="primary"
              icon={<FaEdit />}
              size="small"
              onClick={() => onEdit(record)}
            >
              Edit
            </Button>
          </Tooltip>
          
          <Tooltip title="Delete material">
            <Button
              danger
              icon={<FaTrash />}
              size="small"
              onClick={() => handleDelete(record)}
            >
              Delete
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="study-material-manager">
      <div className="manager-header">
        <h2>Study Materials Management</h2>
        <p>Manage all uploaded study materials - edit, delete, and organize content</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Material Type:</label>
            <Select
              placeholder="All Types"
              value={filters.materialType || undefined}
              onChange={(value) => handleFilterChange("materialType", value)}
              allowClear
              style={{ width: 150 }}
            >
              <Option value="videos">Videos</Option>
              <Option value="study-notes">Study Notes</Option>
              <Option value="past-papers">Past Papers</Option>
              <Option value="books">Books</Option>
            </Select>
          </div>

          <div className="filter-group">
            <label>Level:</label>
            <Select
              placeholder="All Levels"
              value={filters.level || undefined}
              onChange={(value) => handleFilterChange("level", value)}
              allowClear
              style={{ width: 120 }}
            >
              <Option value="primary">Primary</Option>
              <Option value="secondary">Secondary</Option>
              <Option value="advance">Advance</Option>
            </Select>
          </div>

          {filters.level && (
            <div className="filter-group">
              <label>Class:</label>
              <Select
                placeholder="All Classes"
                value={filters.className || undefined}
                onChange={(value) => handleFilterChange("className", value)}
                allowClear
                style={{ width: 120 }}
              >
                {getClassesForLevel(filters.level).map(cls => (
                  <Option key={cls} value={cls}>Class {cls}</Option>
                ))}
              </Select>
            </div>
          )}

          {filters.level && (
            <div className="filter-group">
              <label>Subject:</label>
              <Select
                placeholder="All Subjects"
                value={filters.subject || undefined}
                onChange={(value) => handleFilterChange("subject", value)}
                allowClear
                style={{ width: 150 }}
              >
                {getSubjectsForLevel(filters.level).map(subject => (
                  <Option key={subject} value={subject}>{subject}</Option>
                ))}
              </Select>
            </div>
          )}

          <div className="filter-group">
            <label>Search:</label>
            <Search
              placeholder="Search materials..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="materials-table">
        <Table
          columns={columns}
          dataSource={filteredMaterials}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} materials`,
          }}
          scroll={{ x: 1000 }}
        />
      </div>
    </div>
  );
}

export default StudyMaterialManager;

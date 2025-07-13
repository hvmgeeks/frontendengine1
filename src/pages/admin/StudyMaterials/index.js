import React, { useState } from "react";
import { message } from "antd";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TbDashboard } from "react-icons/tb";
import PageTitle from "../../../components/PageTitle";
import AddStudyMaterialForm from "./AddStudyMaterialForm";
import SubtitleManager from "./SubtitleManager";
import StudyMaterialManager from "./StudyMaterialManager";
import EditStudyMaterialForm from "./EditStudyMaterialForm";
import "./index.css";
import {
  FaVideo,
  FaFileAlt,
  FaBook,
  FaPlus,
  FaGraduationCap,
  FaClosedCaptioning,
  FaCog,
  FaList
} from "react-icons/fa";

function AdminStudyMaterials() {
  const navigate = useNavigate();
  const [selectedMaterialType, setSelectedMaterialType] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSubtitleManager, setShowSubtitleManager] = useState(false);
  const [showMaterialManager, setShowMaterialManager] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const materialTypes = [
    {
      key: "videos",
      title: "Videos",
      icon: <FaVideo />,
      description: "Add educational videos for students",
      color: "#e74c3c"
    },
    {
      key: "study-notes",
      title: "Study Notes",
      icon: <FaFileAlt />,
      description: "Upload study notes and documents",
      color: "#3498db"
    },
    {
      key: "past-papers",
      title: "Past Papers",
      icon: <FaGraduationCap />,
      description: "Add past examination papers",
      color: "#9b59b6"
    },
    {
      key: "books",
      title: "Books",
      icon: <FaBook />,
      description: "Upload textbooks and reference materials",
      color: "#27ae60"
    }
  ];

  const managementOptions = [
    {
      key: "manage-materials",
      title: "Manage Materials",
      icon: <FaCog />,
      description: "Edit, delete, and organize study materials",
      color: "#34495e"
    },
    {
      key: "subtitles",
      title: "Subtitle Management",
      icon: <FaClosedCaptioning />,
      description: "Manage video subtitles and captions",
      color: "#f39c12"
    }
  ];

  const handleMaterialTypeSelect = (materialType) => {
    setSelectedMaterialType(materialType);
    setShowAddForm(true);
  };

  const handleManagementOptionSelect = (option) => {
    if (option === "subtitles") {
      setShowSubtitleManager(true);
    } else if (option === "manage-materials") {
      setShowMaterialManager(true);
    }
  };

  const handleFormClose = () => {
    setShowAddForm(false);
    setSelectedMaterialType("");
  };

  const handleSubtitleManagerClose = () => {
    setShowSubtitleManager(false);
  };

  const handleMaterialManagerClose = () => {
    setShowMaterialManager(false);
  };

  const handleEditMaterial = (material) => {
    setSelectedMaterial(material);
    setShowEditForm(true);
  };

  const handleEditFormClose = () => {
    setShowEditForm(false);
    setSelectedMaterial(null);
  };

  const handleFormSuccess = (materialType) => {
    message.success(`${materialType} added successfully!`);
    setShowAddForm(false);
    setSelectedMaterialType("");
  };

  const handleEditSuccess = (materialType) => {
    message.success(`${materialType} updated successfully!`);
    setShowEditForm(false);
    setSelectedMaterial(null);
    // Refresh the material manager if it's open
    if (showMaterialManager) {
      // The StudyMaterialManager component will handle its own refresh
    }
  };

  return (
    <div className="admin-study-materials">
      <div className="flex items-center gap-4 mb-4">
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

        <PageTitle title="Study Materials Management" />
      </div>
      
      {showSubtitleManager ? (
        <div className="subtitle-manager-container">
          <div className="form-header">
            <button
              className="back-button"
              onClick={handleSubtitleManagerClose}
            >
              ← Back to Material Types
            </button>
            <h2>Subtitle Management</h2>
          </div>
          <SubtitleManager />
        </div>
      ) : showMaterialManager ? (
        <div className="material-manager-container">
          <div className="form-header">
            <button
              className="back-button"
              onClick={handleMaterialManagerClose}
            >
              ← Back to Main Menu
            </button>
            <h2>Study Materials Management</h2>
          </div>
          <StudyMaterialManager onEdit={handleEditMaterial} />
        </div>
      ) : showEditForm ? (
        <div className="edit-form-container">
          <div className="form-header">
            <button
              className="back-button"
              onClick={handleEditFormClose}
            >
              ← Back to Materials List
            </button>
          </div>
          <EditStudyMaterialForm
            material={selectedMaterial}
            onSuccess={handleEditSuccess}
            onCancel={handleEditFormClose}
          />
        </div>
      ) : showAddForm ? (
        <div className="add-form-container">
          <div className="form-header">
            <button
              className="back-button"
              onClick={handleFormClose}
            >
              ← Back to Main Menu
            </button>
            <h2>
              Add {materialTypes.find(t => t.key === selectedMaterialType)?.title}
            </h2>
          </div>

          <AddStudyMaterialForm
            materialType={selectedMaterialType}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </div>
      ) : (
        <div className="main-menu-container">
          <div className="header-section">
            <h2>Study Materials Administration</h2>
            <p>Manage your educational content - add new materials or edit existing ones</p>
          </div>

          <div className="menu-sections">
            <div className="menu-section">
              <h3>
                <FaPlus className="section-icon" />
                Add New Materials
              </h3>
              <p>Upload new study materials for students</p>
              <div className="material-types-grid">
                {materialTypes.map((type) => (
                  <div
                    key={type.key}
                    className="material-type-card"
                    onClick={() => handleMaterialTypeSelect(type.key)}
                    style={{ borderColor: type.color }}
                  >
                    <div className="card-icon" style={{ color: type.color }}>
                      {type.icon}
                    </div>
                    <h4>{type.title}</h4>
                    <p>{type.description}</p>
                    <div className="add-button" style={{ backgroundColor: type.color }}>
                      <FaPlus />
                      <span>Add {type.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="menu-section">
              <h3>
                <FaList className="section-icon" />
                Manage Existing Materials
              </h3>
              <p>Edit, delete, and organize your study materials</p>
              <div className="management-options-grid">
                {managementOptions.map((option) => (
                  <div
                    key={option.key}
                    className="management-option-card"
                    onClick={() => handleManagementOptionSelect(option.key)}
                    style={{ borderColor: option.color }}
                  >
                    <div className="card-icon" style={{ color: option.color }}>
                      {option.icon}
                    </div>
                    <h4>{option.title}</h4>
                    <p>{option.description}</p>
                    <div className="manage-button" style={{ backgroundColor: option.color }}>
                      <FaCog />
                      <span>Open {option.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStudyMaterials;

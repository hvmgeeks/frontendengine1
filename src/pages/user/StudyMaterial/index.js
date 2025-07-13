import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./index.css";
import { motion, AnimatePresence } from "framer-motion";
import { getStudyMaterial } from "../../../apicalls/study";
import { useDispatch, useSelector } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { useLanguage } from "../../../contexts/LanguageContext";
// import { Card, Button, Input, Loading } from "../../../components/modern";

import PDFModal from "./PDFModal";
import {
  FaBook,
  FaFileAlt,
  FaGraduationCap,
  FaDownload,
  FaEye,
  FaChevronDown,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import {
  TbFileText,
  TbBook as TbBookIcon,
  TbSchool,
  TbSearch,
  TbFilter,
  TbSortAscending,
  TbDownload,
  TbEye,
  TbCalendar,
  TbUser,
  TbChevronDown as TbChevronDownIcon,
  TbChevronUp,
  TbX,
  TbAlertTriangle,
  TbInfoCircle,
  TbCheck,
  TbBooks,
  TbCertificate
} from "react-icons/tb";
import { primarySubjects, primaryKiswahiliSubjects, secondarySubjects, advanceSubjects } from "../../../data/Subjects.jsx";

function StudyMaterial() {
  const { user } = useSelector((state) => state.user);
  const { t, isKiswahili, getSubjectName } = useLanguage();
  const dispatch = useDispatch();

  // Get user level and subjects list (case-insensitive)
  const userLevel = user?.level || 'Primary';
  const userLevelLower = useMemo(() => userLevel.toLowerCase(), [userLevel]);

  const subjectsList = useMemo(() => {
    return userLevelLower === 'primary'
      ? primarySubjects
      : userLevelLower === 'primary_kiswahili'
        ? primaryKiswahiliSubjects
        : userLevelLower === 'secondary'
          ? secondarySubjects
          : advanceSubjects;
  }, [userLevelLower]);

  // Debug: Log current level and subjects (removed subjectsList from dependencies to prevent infinite loop)
  useEffect(() => {
    console.log('📚 Study Materials - User Level:', userLevel);
    console.log('📚 Study Materials - User Level (lowercase):', userLevelLower);
    console.log('📚 Study Materials - Subjects List:', subjectsList);
    console.log('📚 Study Materials - User Data:', user);
  }, [userLevel, userLevelLower, user]);

  // Define all possible classes for each level (memoized to prevent re-renders)
  const allPossibleClasses = useMemo(() => {
    return userLevelLower === 'primary'
      ? ['1', '2', '3', '4', '5', '6', '7']
      : userLevelLower === 'secondary'
        ? ['Form-1', 'Form-2', 'Form-3', 'Form-4']
        : ['Form-5', 'Form-6'];
  }, [userLevelLower]);

  // Simplified state management - initialize with user's class if available
  const [activeTab, setActiveTab] = useState("study-notes");
  const [selectedClass, setSelectedClass] = useState(user?.class || user?.className || "all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  // Get user's current class for highlighting
  const userCurrentClass = user?.class || user?.className;
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [documentUrl, setDocumentUrl] = useState("");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [showClassSelector, setShowClassSelector] = useState(false);


  // Unified search and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Update selectedClass when user data becomes available
  useEffect(() => {
    const userClass = user?.class || user?.className;
    if (userClass && selectedClass === "all" && !availableClasses.length) {
      setSelectedClass(userClass);
    }
  }, [user, selectedClass, availableClasses.length]);

  // Reset subject selection when user level changes (removed subjectsList from dependencies)
  useEffect(() => {
    if (user?.level) {
      // Check if current selected subject is valid for the new level
      const isValidSubject = subjectsList.includes(selectedSubject);
      if (!isValidSubject && selectedSubject !== "all") {
        console.log('📚 Resetting subject selection due to level change');
        setSelectedSubject("all");
      }
    }
  }, [user?.level, selectedSubject]); // Removed subjectsList to prevent infinite loop

  // Set available classes based on user level (show all possible classes)
  const setAvailableClassesForLevel = useCallback(() => {
    setAvailableClasses(allPossibleClasses);
  }, [allPossibleClasses]);

  // Simplified fetch function
  const fetchMaterials = useCallback(async () => {
    if (!activeTab || selectedClass === "default") {
      return;
    }

    setIsLoading(true);
    setError(null);
    dispatch(ShowLoading());

    try {
      // Normalize className for backend - remove "Form-" prefix if present
      const normalizedClassName = selectedClass === "all" ? "all" :
        selectedClass.toString().replace("Form-", "");

      const data = {
        content: activeTab,
        className: normalizedClassName,
        subject: selectedSubject, // This can be "all" or a specific subject
      };
      if (userLevel) {
        data.level = userLevel;
      }

      const res = await getStudyMaterial(data);

      if (res.status === 200 && res.data.success) {
        const materials = res.data.data === "empty" ? [] : res.data.data;
        setMaterials(materials);
      } else {
        setMaterials([]);
        setError(`Failed to fetch ${activeTab}. Please try again.`);
      }
    } catch (error) {
      console.error("Error fetching study material:", error);
      setMaterials([]);
      setError(`Unable to load ${activeTab}. Please check your connection and try again.`);
    } finally {
      setIsLoading(false);
      dispatch(HideLoading());
    }
  }, [activeTab, selectedClass, selectedSubject, userLevel, dispatch]);

  // Set available classes when component mounts
  useEffect(() => {
    if (user && userLevel) {
      setAvailableClassesForLevel();
    }
  }, [user, userLevel, setAvailableClassesForLevel]);

  // Fetch materials when filters change or component mounts
  useEffect(() => {
    // Only fetch if we have a valid activeTab, selectedClass, and user
    if (user && userLevel && activeTab && selectedClass && selectedClass !== "default") {
      fetchMaterials();
    }
  }, [user, userLevel, activeTab, selectedClass, selectedSubject, fetchMaterials]);

  // Handler functions
  const handleTabChange = (tab) => {
    setMaterials([]);
    setActiveTab(tab);
    setSearchTerm("");
    setSortBy("newest");
  };

  const handleSubjectChange = (subject) => {
    setMaterials([]);
    setSelectedSubject(subject);
    setSearchTerm("");
  };

  const handleClassChange = (className) => {
    setMaterials([]);
    setSelectedClass(className);
    setShowClassSelector(false);
  };

  const toggleClassSelector = () => {
    setShowClassSelector(!showClassSelector);
  };

  // Unified filtering and sorting logic
  const filteredAndSortedMaterials = useMemo(() => {
    if (!materials || materials.length === 0) {
      return [];
    }

    let filtered = materials;

    // Filter by search term (title, subject, or year)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(searchLower) ||
        material.subject.toLowerCase().includes(searchLower) ||
        (material.year && material.year.toLowerCase().includes(searchLower))
      );
    }

    // Sort by year, creation date, or title
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        // For materials with year field (books, past papers)
        if (a.year && b.year) {
          return parseInt(b.year) - parseInt(a.year);
        }

        // Fallback: materials with year come first
        else if (a.year && !b.year) return -1;
        else if (!a.year && b.year) return 1;
        else return 0;
      } else if (sortBy === "oldest") {
        // For materials with year field
        if (a.year && b.year) {
          return parseInt(a.year) - parseInt(b.year);
        }

        // Fallback: materials with year come first
        else if (a.year && !b.year) return -1;
        else if (!a.year && b.year) return 1;
        else return 0;
      } else {
        // Sort by title alphabetically
        return a.title.localeCompare(b.title);
      }
    });



    return filtered;
  }, [materials, searchTerm, sortBy, activeTab]);

  // Document handlers
  const handleDocumentDownload = (documentUrl) => {
    // Use proxy endpoint to handle CORS issues
    const proxyUrl = `${process.env.REACT_APP_SERVER_DOMAIN}/api/study/document-proxy?url=${encodeURIComponent(documentUrl)}`;

    fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = documentUrl.split("/").pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Error downloading the file:", error);
        // Fallback to direct download if proxy fails
        window.open(documentUrl, '_blank');
      });
  };

  const handleDocumentPreview = (documentUrl) => {
    setDocumentUrl(documentUrl);
    setModalIsOpen(true);
  };























  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Modern Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 to-blue-600 text-white"
      >
        <div className="container-modern py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <TbBooks className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Study Materials</h1>
                <p className="text-xl text-blue-100">
                  Access comprehensive learning resources for {userLevel} education
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <div className="text-sm text-blue-100 mb-1">Current Level</div>
                <div className="text-lg font-bold">{userLevel?.toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container-modern py-8">
        {/* Study Material Tabs */}
        <div className="mb-6">
          <div className="study-tabs">
            {[
              { key: 'study-notes', label: isKiswahili ? 'Maelezo' : 'Notes', icon: TbFileText },
              { key: 'past-papers', label: isKiswahili ? 'Karatasi za Zamani' : 'Past Papers', icon: TbCertificate },
              { key: 'books', label: isKiswahili ? 'Vitabu' : 'Books', icon: TbBookIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                className={`study-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                <tab.icon />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modern Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="card p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-end">
              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isKiswahili ? 'Tafuta Vifaa' : 'Search Materials'}
                </label>
                <input
                  placeholder={isKiswahili ? `Tafuta ${activeTab === 'study-notes' ? 'maelezo' : activeTab === 'past-papers' ? 'karatasi za zamani' : 'vitabu'}...` : `Search ${activeTab.replace('-', ' ')}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Class Filter */}
              <div className="w-full lg:w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isKiswahili ? 'Chuja kwa Darasa' : 'Filter by Class'}
                  {userCurrentClass && (
                    <span className="ml-2 text-xs text-primary-600 font-medium">
                      ({isKiswahili ? 'Darasa lako: ' : 'Your class: '}{userLevelLower === 'primary' || userLevelLower === 'primary_kiswahili' ? (isKiswahili ? `Darasa la ${userCurrentClass}` : `Class ${userCurrentClass}`) : `Form ${userCurrentClass}`})
                    </span>
                  )}
                </label>
                <div className="relative">
                  <button
                    onClick={toggleClassSelector}
                    className="w-full input-modern flex items-center justify-between"
                  >
                    <span className="flex items-center space-x-2">
                      <TbSchool className="w-4 h-4 text-gray-400" />
                      <span>
                        {selectedClass === 'all' ? 'All Classes' :
                          userLevelLower === 'primary'
                            ? `Class ${selectedClass}`
                            : `Form ${selectedClass}`
                        }
                      </span>
                      {selectedClass === userCurrentClass && (
                        <span className="badge-primary text-xs">Current</span>
                      )}
                    </span>
                    <TbChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${showClassSelector ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showClassSelector && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
                      >
                        <button
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedClass === 'all' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                          }`}
                          onClick={() => handleClassChange('all')}
                        >
                          All Classes
                        </button>
                        {availableClasses.map((className, index) => (
                          <button
                            key={index}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                              selectedClass === className ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                            }`}
                            onClick={() => handleClassChange(className)}
                          >
                            <span>
                              {userLevelLower === 'primary' ? `Class ${className}` : `Form ${className}`}
                            </span>
                            {className === userCurrentClass && (
                              <span className="badge-success text-xs">Your Class</span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Subject Filter */}
              <div className="w-full lg:w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isKiswahili ? 'Chuja kwa Somo' : 'Filter by Subject'}
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="input-modern"
                >
                  <option value="all">{isKiswahili ? 'Masomo Yote' : 'All Subjects'}</option>
                  {subjectsList.map((subject, index) => (
                    <option key={index} value={subject}>
                      {getSubjectName(subject)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="w-full lg:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isKiswahili ? 'Panga kwa' : 'Sort by'}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-modern"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">By Title</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedClass("all");
                  setSelectedSubject("all");
                  setSortBy("newest");
                }}
              >
                Clear Filters
              </button>
            </div>

            {/* Results Count */}
            {(searchTerm || selectedClass !== "all" || selectedSubject !== "all") && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-600">
                  Showing {filteredAndSortedMaterials.length} of {materials.length} {activeTab.replace('-', ' ')}
                </span>
              </div>
            )}
          </div>
        </motion.div>

      {/* Materials Display */}
      <div className="materials-section">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading materials...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <FaTimes className="error-icon" />
            <h3>Error Loading Materials</h3>
            <p>{error}</p>
            <button
              className="retry-btn"
              onClick={() => {
                setError(null);
                fetchMaterials();
              }}
            >
              Try Again
            </button>
          </div>
        ) : filteredAndSortedMaterials.length > 0 ? (
          <div className={activeTab === 'past-papers'
            ? "flex flex-wrap gap-3 justify-start"
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          }>
            {filteredAndSortedMaterials.map((material, index) => (
              <div key={index} className={activeTab === 'past-papers'
                ? "past-paper-square-card"
                : "study-card"
              }>
                {activeTab === 'past-papers' ? (
                  // Past Papers Layout - Buttons below tags
                  <>
                    <div className="study-card-header">
                      <div className="study-card-meta">
                        <FaFileAlt />
                        <span>{isKiswahili ? 'Karatasi ya Zamani' : 'Past Paper'}</span>
                      </div>
                      <div className="study-card-title">
                        {material.title}
                      </div>
                    </div>

                    <div className="card-content">
                      <div className="material-meta">
                        <span className="material-subject">{material.subject}</span>
                        {material.className && (
                          <span className="material-class">
                            {userLevelLower === 'primary' ? `Class ${material.className}` : `Form ${material.className}`}
                          </span>
                        )}
                        {material.year && (
                          <span className="badge badge-secondary">{material.year}</span>
                        )}
                      </div>
                    </div>

                    <div className="card-actions">
                      {material.documentUrl ? (
                        <>
                          <button
                            className="btn-primary"
                            onClick={() => handleDocumentPreview(material.documentUrl)}
                          >
                            <FaEye /> {isKiswahili ? 'Ona' : 'View'}
                          </button>
                          <button
                            className="btn-primary"
                            onClick={() => handleDocumentDownload(material.documentUrl)}
                          >
                            <FaDownload /> {isKiswahili ? 'Pakua' : 'Download'}
                          </button>
                        </>
                      ) : (
                        <span className="unavailable">{isKiswahili ? 'Haipatikani' : 'Not available'}</span>
                      )}
                    </div>
                  </>
                ) : (
                  // Regular Layout for other tabs
                  <>
                    <div className="study-card-header">
                      <div className="study-card-meta">
                        {activeTab === 'study-notes' && <FaFileAlt />}
                        {activeTab === 'books' && <FaBook />}
                        <span>
                          {activeTab === 'study-notes' ? (isKiswahili ? 'Maelezo' : 'Note') :
                           (isKiswahili ? 'Kitabu' : 'Book')}
                        </span>
                      </div>
                      <div className="study-card-title">
                        {material.title}
                      </div>
                      {material.year && (
                        <span className="badge badge-secondary mt-2">{material.year}</span>
                      )}
                    </div>

                    <div className="card-content">
                      <h3 className="material-title">{material.title}</h3>
                      <div className="material-meta">
                        <span className="material-subject">{material.subject}</span>
                        {material.className && (
                          <span className="material-class">
                            {userLevelLower === 'primary' ? `Class ${material.className}` : `Form ${material.className}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="card-actions">
                      {material.documentUrl ? (
                        <>
                          <button
                            className="action-btn secondary"
                            onClick={() => handleDocumentPreview(material.documentUrl)}
                          >
                            <FaEye /> {isKiswahili ? 'Ona' : 'View'}
                          </button>
                          <button
                            className="action-btn primary"
                            onClick={() => handleDocumentDownload(material.documentUrl)}
                          >
                            <FaDownload /> {isKiswahili ? 'Pakua' : 'Download'}
                          </button>
                        </>
                      ) : (
                        <span className="unavailable">{isKiswahili ? 'Haipatikani' : 'Not available'}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FaGraduationCap className="empty-icon" />
            <h3>No Materials Found</h3>
            <p>No study materials are available for your current selection.</p>
            <p className="suggestion">Try selecting a different class or subject.</p>
          </div>
        )}
      </div>




      {/* PDF Modal */}
      <PDFModal
        modalIsOpen={modalIsOpen}
        closeModal={() => {
          setModalIsOpen(false);
          setDocumentUrl("");
        }}
        documentUrl={documentUrl}
      />
      </div>
    </div>
  );
}

export default StudyMaterial;

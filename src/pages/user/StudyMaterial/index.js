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
  FaCertificate,
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

  // Simplified CSS - no header conflicts
  const inlineStyles = `
    /* Mobile Layout Fixes for Study Materials */
    @media (max-width: 768px) {
      /* Reduce Bell Icon Size */
      .notification-bell-button .w-5,
      .notification-bell-button .h-5 {
        width: 14px !important;
        height: 14px !important;
      }

      /* Study Materials content positioning - no header conflicts */
      .study-material-modern,
      .container-modern {
        padding-top: 16px !important;
      }

      /* Tabs positioning */
      .ant-tabs-nav {
        margin-bottom: 8px !important;
      }
    }

    }
  `;

  // Add styles to document head
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = inlineStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

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

  // Simplified state management - initialize with "all" to show all materials by default
  const [activeTab, setActiveTab] = useState("study-notes");
  const [selectedClass, setSelectedClass] = useState("all");
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
        // Use subject filter for past papers and notes, always "all" for books and literature
        subject: (activeTab === 'past-papers' || activeTab === 'study-notes') ? selectedSubject : 'all',
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
    // Only fetch if we have a valid activeTab and user (allow "all" for selectedClass)
    if (user && userLevel && activeTab && selectedClass !== "default") {
      fetchMaterials();
    }
  }, [user, userLevel, activeTab, selectedClass, selectedSubject, fetchMaterials]);

  // Handler functions
  const handleTabChange = (tab) => {
    setMaterials([]);
    setActiveTab(tab);
    setSearchTerm("");
    setSortBy("newest");
    // Reset subject filter when switching to tabs that don't use it
    if (tab !== 'past-papers' && tab !== 'study-notes') {
      setSelectedSubject("all");
    }
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

    // Filter by search term (title, subject, or year) - For past papers and notes
    if ((activeTab === 'past-papers' || activeTab === 'study-notes') && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(searchLower) ||
        material.subject.toLowerCase().includes(searchLower) ||
        (material.year && material.year.toLowerCase().includes(searchLower))
      );
    }

    // Sort by year, creation date, or title - For past papers and notes
    if (activeTab === 'past-papers' || activeTab === 'study-notes') {
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
    } else {
      // For other tabs, just sort by title alphabetically
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }



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
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50"
      style={{
        marginTop: window.innerWidth <= 768 ? '48px' : '0px',
        paddingTop: window.innerWidth <= 768 ? '0px' : '0px'
      }}
    >
      {/* Header removed - using ProtectedRoute header only */}

      <div
        className="container-modern py-8"
        style={{
          paddingTop: window.innerWidth <= 768 ? '8px' : '32px',
          marginTop: window.innerWidth <= 768 ? '0px' : '0px'
        }}
      >
        {/* Study Material Tabs */}
        <div className="mb-6">
          <div className="study-tabs">
            {[
              { key: 'study-notes', label: isKiswahili ? 'Maelezo' : 'Notes', icon: TbFileText },
              { key: 'past-papers', label: isKiswahili ? 'Karatasi za Zamani' : 'Past Papers', icon: TbCertificate },
              { key: 'books', label: isKiswahili ? 'Vitabu' : 'Books', icon: TbBookIcon },
              // Only show for secondary level
              ...(userLevelLower === 'secondary' ? [{
                key: 'literature',
                label: isKiswahili ? 'Mchezo, Riwaya na Mashairi' : 'Plays, Novel and Poetry',
                icon: TbBookIcon
              }] : [])
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
          <div className="card filter-card p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-end">
              {/* Search - For past papers and notes */}
              {(activeTab === 'past-papers' || activeTab === 'study-notes') && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isKiswahili ? 'Tafuta Vifaa' : 'Search Materials'}
                  </label>
                  <input
                    placeholder={
                      activeTab === 'past-papers'
                        ? (isKiswahili ? 'Tafuta karatasi za zamani...' : 'Search past papers...')
                        : (isKiswahili ? 'Tafuta maelezo...' : 'Search notes...')
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                  />
                </div>
              )}

              {/* Class Filter */}
              <div className={`w-full lg:w-64 class-filter-container ${showClassSelector ? 'dropdown-open' : ''}`}>
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
                            : selectedClass.replace('Form-', '')
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
                      <>
                        <div
                          className="dropdown-backdrop"
                          onClick={() => setShowClassSelector(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="class-selector-dropdown"
                        >
                        <button
                          className={`class-option ${selectedClass === 'all' ? 'selected' : ''}`}
                          onClick={() => handleClassChange('all')}
                        >
                          All Classes
                        </button>
                        {availableClasses.map((className, index) => (
                          <button
                            key={index}
                            className={`class-option ${selectedClass === className ? 'selected' : ''} ${className === userCurrentClass ? 'current' : ''}`}
                            onClick={() => handleClassChange(className)}
                          >
                            <span>
                              {userLevelLower === 'primary' ? `Class ${className}` : className.replace('Form-', '')}
                            </span>
                            {className === userCurrentClass && (
                              <span className="badge-success text-xs">Your Class</span>
                            )}
                          </button>
                        ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Subject Filter - For past papers and notes */}
              {(activeTab === 'past-papers' || activeTab === 'study-notes') && (
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
              )}

              {/* Sort - For past papers and notes */}
              {(activeTab === 'past-papers' || activeTab === 'study-notes') && (
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
              )}

              {/* Clear Filters - For past papers and notes */}
              {(activeTab === 'past-papers' || activeTab === 'study-notes') && (
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
              )}
            </div>

            {/* Results Count - For past papers and notes */}
            {(activeTab === 'past-papers' || activeTab === 'study-notes') && (searchTerm || selectedClass !== "all" || selectedSubject !== "all") && (
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
          <div className={`materials-grid ${activeTab === 'past-papers'
            ? "flex flex-wrap gap-3 justify-start"
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          }`}>
            {filteredAndSortedMaterials.map((material, index) => (
              <div key={index} className={
                activeTab === 'past-papers'
                  ? "past-paper-square-card"
                  : (activeTab === 'books' || activeTab === 'literature')
                    ? "study-card has-thumbnail"
                    : "study-card"
              }>
                {/* Unified Layout for All Materials */}
                <>
                  {/* Thumbnail section for books and literature */}
                  {(activeTab === 'books' || activeTab === 'literature') && (
                    <div className="study-card-thumbnail">
                      {material.thumbnail ? (
                        <img
                          src={material.thumbnail}
                          alt={material.title}
                          className="thumbnail-image"
                        />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <div style={{ textAlign: 'center', color: '#495057', padding: '20px' }}>
                            <FaBook style={{ fontSize: '48px', marginBottom: '12px', color: '#6c757d' }} />
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              lineHeight: '1.3',
                              marginBottom: '8px',
                              maxWidth: '180px'
                            }}>
                              {material.title}
                            </div>
                            {material.author && (
                              <div style={{
                                fontSize: '12px',
                                fontStyle: 'italic',
                                color: '#6c757d',
                                lineHeight: '1.2'
                              }}>
                                by {material.author}
                              </div>
                            )}
                            {material.genre && (
                              <div style={{
                                fontSize: '10px',
                                marginTop: '8px',
                                padding: '2px 8px',
                                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                                color: '#007bff',
                                borderRadius: '12px',
                                display: 'inline-block',
                                textTransform: 'capitalize'
                              }}>
                                {material.genre}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content wrapper for horizontal layout */}
                  <div className={(activeTab === 'books' || activeTab === 'literature') ? "study-card-content" : ""}>
                    <div className="study-card-header">
                    <div className="study-card-meta">
                      {activeTab === 'study-notes' && <FaFileAlt />}
                      {activeTab === 'past-papers' && <FaCertificate />}
                      {activeTab === 'books' && <FaBook />}
                      {activeTab === 'literature' && <FaBook />}
                      <span>
                        {activeTab === 'study-notes' ? (isKiswahili ? 'Maelezo' : 'Note') :
                         activeTab === 'past-papers' ? (isKiswahili ? 'Karatasi ya Zamani' : 'Past Paper') :
                         activeTab === 'literature' ? (isKiswahili ? 'Fasihi' : 'Literature') :
                         (isKiswahili ? 'Kitabu' : 'Book')}
                      </span>
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
                      {material.author && activeTab === 'literature' && (
                        <span className="material-author">
                          {isKiswahili ? 'Mwandishi' : 'Author'}: {material.author}
                        </span>
                      )}
                      {material.genre && activeTab === 'literature' && (
                        <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                          {material.genre}
                        </span>
                      )}
                      {/* Show multiple class tags for literature */}
                      {activeTab === 'literature' && material.additionalClasses && material.additionalClasses.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>
                            {isKiswahili ? 'Madarasa mengine:' : 'Also for:'}
                          </span>
                          {material.additionalClasses.map((cls, index) => (
                            <span
                              key={index}
                              className="badge badge-outline-primary"
                              style={{
                                fontSize: '10px',
                                marginRight: '4px',
                                border: '1px solid #007bff',
                                color: '#007bff',
                                backgroundColor: 'transparent'
                              }}
                            >
                              Form {cls}
                            </span>
                          ))}
                        </div>
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
                          <FaEye /> {isKiswahili ? 'Soma' : 'Read'}
                        </button>
                        {/* Show download button for past-papers and books only */}
                        {(activeTab === 'past-papers' || activeTab === 'books') && (
                          <button
                            className="btn-primary"
                            onClick={() => handleDocumentDownload(material.documentUrl)}
                          >
                            <FaDownload /> {isKiswahili ? 'Pakua' : 'Download'}
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="unavailable">{isKiswahili ? 'Haipatikani' : 'Not available'}</span>
                    )}
                  </div>
                  </div> {/* Close study-card-content wrapper */}
                </>

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

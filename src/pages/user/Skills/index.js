import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { message } from "antd";
import { useLanguage } from "../../../contexts/LanguageContext";
import { getAllSkills, getFeaturedSkills, markSkillCompleted } from "../../../apicalls/skills";
import {
  FaSearch,
  FaFilter,
  FaPlay,
  FaStar,
  FaClock,
  FaUser,
  FaEye,
  FaTimes,
  FaExpand,
  FaCompress,
  FaCheck
} from "react-icons/fa";
import "./Skills.css";

const Skills = () => {
  const { user } = useSelector((state) => state.user);
  const { t, isKiswahili } = useLanguage();
  
  // State management
  const [skills, setSkills] = useState([]);
  const [featuredSkills, setFeaturedSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  // Video player state
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [videoError, setVideoError] = useState(null);

  // Skill levels with translations
  const skillLevels = [
    { value: "all", label: isKiswahili ? "Viwango Vyote" : "All Levels" },
    { value: "beginner", label: isKiswahili ? "Mwanzo" : "Beginner", color: "green" },
    { value: "amateur", label: isKiswahili ? "Wastani" : "Amateur", color: "blue" },
    { value: "professional", label: isKiswahili ? "Kitaalamu" : "Professional", color: "orange" },
    { value: "expert", label: isKiswahili ? "Mtaalamu" : "Expert", color: "red" }
  ];

  // Fetch skills data
  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        targetAudience: user?.level || "all",
        limit: 50,
        sortBy: sortBy === "newest" ? "createdAt" : sortBy,
        sortOrder: "desc"
      };

      if (selectedLevel !== "all") {
        params.level = selectedLevel;
      }

      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await getAllSkills(params);
      
      if (response.success) {
        setSkills(response.data);
      } else {
        setError(response.message || "Failed to fetch skills");
      }
    } catch (error) {
      setError("Error fetching skills");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.level, selectedLevel, selectedCategory, searchTerm, sortBy]);

  // Fetch featured skills
  const fetchFeaturedSkills = useCallback(async () => {
    try {
      const response = await getFeaturedSkills(6);
      if (response.success) {
        setFeaturedSkills(response.data);
      }
    } catch (error) {
      console.error("Error fetching featured skills:", error);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
    fetchFeaturedSkills();
  }, [fetchSkills, fetchFeaturedSkills]);

  // Get unique categories from skills
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(skills.map(skill => skill.category))];
    return [
      { value: "all", label: isKiswahili ? "Makundi Yote" : "All Categories" },
      ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
    ];
  }, [skills, isKiswahili]);

  // Handle skill video play
  const handlePlaySkill = (skill) => {
    setSelectedSkill(skill);
    setShowVideoModal(true);
    setVideoError(null);
  };

  // Handle skill completion
  const handleMarkCompleted = async (skillId) => {
    try {
      const response = await markSkillCompleted(skillId);
      if (response.success) {
        message.success(isKiswahili ? "Ujuzi umekamilika!" : "Skill completed!");
      }
    } catch (error) {
      message.error(isKiswahili ? "Hitilafu ya kukamilisha ujuzi" : "Error marking skill as completed");
    }
  };

  // Close video modal
  const handleCloseVideo = () => {
    setShowVideoModal(false);
    setSelectedSkill(null);
    setIsVideoExpanded(false);
    setVideoError(null);
  };

  // Toggle video expand
  const toggleVideoExpand = () => {
    setIsVideoExpanded(!isVideoExpanded);
  };

  // Get skill level badge
  const getSkillLevelBadge = (level) => {
    const levelConfig = skillLevels.find(l => l.value === level);
    return levelConfig || { label: level, color: "default" };
  };

  // Format duration
  const formatDuration = (duration) => {
    if (!duration) return isKiswahili ? "Muda haujaainishwa" : "Duration not specified";
    return duration;
  };

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    let filtered = skills.filter(skill => {
      const matchesSearch = !searchTerm || 
        skill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLevel = selectedLevel === "all" || skill.level === selectedLevel;
      const matchesCategory = selectedCategory === "all" || skill.category === selectedCategory;
      
      return matchesSearch && matchesLevel && matchesCategory;
    });

    // Sort skills
    if (sortBy === "popular") {
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filtered;
  }, [skills, searchTerm, selectedLevel, selectedCategory, sortBy]);

  return (
    <div className="skills-container">
      {/* Header removed - using ProtectedRoute header only */}

      {/* Featured Skills */}
      {featuredSkills.length > 0 && (
        <div className="featured-section">
          <h2 className="section-title">
            <FaStar className="section-icon" />
            {isKiswahili ? "Ujuzi Maalum" : "Featured Skills"}
          </h2>
          <div className="featured-grid">
            {featuredSkills.map((skill) => (
              <div key={skill._id} className="featured-skill-card" onClick={() => handlePlaySkill(skill)}>
                <div className="skill-thumbnail">
                  <img
                    src={skill.thumbnailUrl || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNEE5MEUyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJyYWlud2F2ZSBTa2lsbDwvdGV4dD48L3N2Zz4="}
                    alt={skill.title}
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNEE5MEUyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJyYWlud2F2ZSBTa2lsbDwvdGV4dD48L3N2Zz4=";
                    }}
                  />
                  <div className="play-overlay">
                    <FaPlay className="play-icon" />
                  </div>
                  <div className="skill-level-badge" style={{backgroundColor: getSkillLevelBadge(skill.level).color}}>
                    {getSkillLevelBadge(skill.level).label}
                  </div>
                </div>
                <div className="skill-info">
                  <h3 className="skill-title">{skill.title}</h3>
                  <p className="skill-category">{skill.category}</p>
                  <div className="skill-meta">
                    <span className="skill-duration">
                      <FaClock /> {formatDuration(skill.duration)}
                    </span>
                    <span className="skill-views">
                      <FaEye /> {skill.viewCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="skills-controls">
        <div className="search-section">
          <div className="search-input-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder={isKiswahili ? "Tafuta ujuzi..." : "Search skills..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label className="filter-label">
              <FaFilter />
              {isKiswahili ? "Kiwango" : "Level"}
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="filter-select"
            >
              {skillLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              {isKiswahili ? "Kundi" : "Category"}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              {isKiswahili ? "Panga kwa" : "Sort by"}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">{isKiswahili ? "Mpya zaidi" : "Newest"}</option>
              <option value="popular">{isKiswahili ? "Maarufu" : "Most Popular"}</option>
              <option value="rating">{isKiswahili ? "Kiwango cha Juu" : "Highest Rated"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="skills-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>{isKiswahili ? "Inapakia ujuzi..." : "Loading skills..."}</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <h3>{isKiswahili ? "Hitilafu ya Kupakia" : "Error Loading Skills"}</h3>
            <p>{error}</p>
            <button onClick={fetchSkills} className="retry-btn">
              {isKiswahili ? "Jaribu Tena" : "Try Again"}
            </button>
          </div>
        ) : filteredSkills.length > 0 ? (
          <div className="skills-grid">
            {filteredSkills.map((skill) => (
              <div key={skill._id} className="skill-card" onClick={() => handlePlaySkill(skill)}>
                <div className="skill-thumbnail">
                  <img
                    src={skill.thumbnailUrl || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNEE5MEUyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJyYWlud2F2ZSBTa2lsbDwvdGV4dD48L3N2Zz4="}
                    alt={skill.title}
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNEE5MEUyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJyYWlud2F2ZSBTa2lsbDwvdGV4dD48L3N2Zz4=";
                    }}
                  />
                  <div className="play-overlay">
                    <FaPlay className="play-icon" />
                  </div>
                  <div className="skill-level-badge" style={{backgroundColor: getSkillLevelBadge(skill.level).color}}>
                    {getSkillLevelBadge(skill.level).label}
                  </div>
                  {skill.difficulty && (
                    <div className="difficulty-badge">
                      {"⭐".repeat(skill.difficulty)}
                    </div>
                  )}
                </div>
                <div className="skill-content">
                  <h3 className="skill-title">{skill.title}</h3>
                  <p className="skill-description">{skill.description}</p>
                  <div className="skill-tags">
                    <span className="skill-category">{skill.category}</span>
                    {skill.estimatedTime && (
                      <span className="estimated-time">
                        <FaClock /> {skill.estimatedTime}
                      </span>
                    )}
                  </div>
                  <div className="skill-footer">
                    <div className="skill-stats">
                      <span className="skill-views">
                        <FaEye /> {skill.viewCount || 0}
                      </span>
                      {skill.averageRating > 0 && (
                        <span className="skill-rating">
                          <FaStar /> {skill.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <button
                      className="complete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkCompleted(skill._id);
                      }}
                    >
                      <FaCheck />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FaUser className="empty-icon" />
            <h3>{isKiswahili ? "Hakuna Ujuzi Uliopatikana" : "No Skills Found"}</h3>
            <p>
              {isKiswahili 
                ? "Hakuna ujuzi unaolingana na utafutaji wako. Jaribu kubadilisha vigezo vya utafutaji."
                : "No skills match your search criteria. Try adjusting your search filters."}
            </p>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {showVideoModal && selectedSkill && (
        <div className={`video-modal-overlay ${isVideoExpanded ? 'expanded' : ''}`} onClick={handleCloseVideo}>
          <div className={`video-modal ${isVideoExpanded ? 'expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="video-header">
              <h3 className="video-title">{selectedSkill.title}</h3>
              <div className="video-controls">
                <button onClick={toggleVideoExpand} className="expand-btn">
                  {isVideoExpanded ? <FaCompress /> : <FaExpand />}
                </button>
                <button onClick={handleCloseVideo} className="close-btn">
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="video-container">
              {selectedSkill.videoUrl ? (
                <video
                  controls
                  autoPlay
                  width="100%"
                  height="400"
                  onError={() => setVideoError("Failed to load video")}
                >
                  <source src={selectedSkill.videoUrl} type="video/mp4" />
                  {isKiswahili ? "Kivinjari chako hakitumii video." : "Your browser does not support the video tag."}
                </video>
              ) : (
                <div className="video-error">
                  <h4>{isKiswahili ? "Video Haipatikani" : "Video Unavailable"}</h4>
                  <p>{isKiswahili ? "Video hii haiwezi kuchezwa kwa sasa." : "This video cannot be played at the moment."}</p>
                </div>
              )}
            </div>

            <div className="video-info">
              <div className="skill-details">
                <div className="skill-meta-info">
                  <span className="skill-level" style={{backgroundColor: getSkillLevelBadge(selectedSkill.level).color}}>
                    {getSkillLevelBadge(selectedSkill.level).label}
                  </span>
                  <span className="skill-category">{selectedSkill.category}</span>
                  {selectedSkill.difficulty && (
                    <span className="difficulty">
                      {"⭐".repeat(selectedSkill.difficulty)}
                    </span>
                  )}
                </div>
                <p className="skill-description">{selectedSkill.description}</p>
                {selectedSkill.learningOutcomes && selectedSkill.learningOutcomes.length > 0 && (
                  <div className="learning-outcomes">
                    <h4>{isKiswahili ? "Utakachojifunza:" : "What you'll learn:"}</h4>
                    <ul>
                      {selectedSkill.learningOutcomes.map((outcome, index) => (
                        <li key={index}>{outcome}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="video-actions">
                <button
                  onClick={() => handleMarkCompleted(selectedSkill._id)}
                  className="complete-skill-btn"
                >
                  <FaCheck />
                  {isKiswahili ? "Kamilisha Ujuzi" : "Mark as Completed"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Skills;

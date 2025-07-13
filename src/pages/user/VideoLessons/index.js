import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "./index.css";
import { motion, AnimatePresence } from "framer-motion";
import { getStudyMaterial } from "../../../apicalls/study";
import { getVideoComments, addVideoComment, addCommentReply, likeComment, deleteVideoComment } from "../../../apicalls/videoComments";
import { useDispatch, useSelector } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { message } from "antd";
import { primarySubjects, primaryKiswahiliSubjects, secondarySubjects, advanceSubjects } from "../../../data/Subjects.jsx";
import { useLanguage } from "../../../contexts/LanguageContext";
import { MdVerified } from 'react-icons/md';

// Temporary fix: Use simple text/symbols instead of React Icons to avoid chunk loading issues
const IconComponents = {
  FaPlayCircle: () => <span style={{fontSize: '24px'}}>▶️</span>,
  FaGraduationCap: () => <span style={{fontSize: '24px'}}>🎓</span>,
  FaTimes: () => <span style={{fontSize: '18px'}}>✕</span>,
  FaExpand: () => <span style={{fontSize: '18px'}}>⛶</span>,
  FaCompress: () => <span style={{fontSize: '18px'}}>⛶</span>,
  TbVideo: () => <span style={{fontSize: '24px'}}>📹</span>,
  TbFilter: () => <span style={{fontSize: '18px'}}>🔍</span>,
  TbSortAscending: () => <span style={{fontSize: '18px'}}>↑</span>,
  TbSearch: () => <span style={{fontSize: '18px'}}>🔍</span>,
  TbX: () => <span style={{fontSize: '16px'}}>✕</span>,
  TbDownload: () => <span style={{fontSize: '18px'}}>↻</span>,
  TbAlertTriangle: () => <span style={{fontSize: '24px', color: '#ff6b6b'}}>⚠️</span>,
  TbInfoCircle: () => <span style={{fontSize: '18px'}}>ℹ️</span>
};

// Destructure for easy use
const {
  FaPlayCircle,
  FaGraduationCap,
  FaTimes,
  FaExpand,
  FaCompress,
  TbVideo,
  TbFilter,
  TbSortAscending,
  TbSearch,
  TbX,
  TbDownload,
  TbAlertTriangle,
  TbInfoCircle
} = IconComponents;

function VideoLessons() {
  const { user } = useSelector((state) => state.user);
  const { t, isKiswahili, getClassName, getSubjectName } = useLanguage();
  const dispatch = useDispatch();

  // State management with localStorage persistence
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(user?.level || "primary");
  const [selectedClass, setSelectedClass] = useState(() => {
    // Restore from localStorage or use user's class as default
    return localStorage.getItem('video-lessons-selected-class') || user?.class || "all";
  });
  const [selectedSubject, setSelectedSubject] = useState(() => {
    // Restore from localStorage
    return localStorage.getItem('video-lessons-selected-subject') || "all";
  });
  const [searchTerm, setSearchTerm] = useState(() => {
    // Restore from localStorage
    return localStorage.getItem('video-lessons-search-term') || "";
  });
  const [sortBy, setSortBy] = useState(() => {
    // Restore from localStorage
    return localStorage.getItem('video-lessons-sort-by') || "newest";
  });

  // Video player state
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  const [showVideoIndices, setShowVideoIndices] = useState([]);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [videoRef, setVideoRef] = useState(null);

  // Comments state - store comments per video
  const [videoComments, setVideoComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showComments, setShowComments] = useState(true);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  // Get comments for current video
  const getCurrentVideoComments = () => {
    if (currentVideoIndex === null) return [];
    const currentVideo = filteredAndSortedVideos[currentVideoIndex];
    if (!currentVideo) return [];

    // Try both id and _id fields
    const videoId = currentVideo.id || currentVideo._id;
    return videoComments[videoId] || [];
  };

  // Set comments for current video
  const setCurrentVideoComments = (comments) => {
    if (currentVideoIndex === null) return;
    const currentVideo = filteredAndSortedVideos[currentVideoIndex];
    if (!currentVideo) return;

    // Use the same videoId logic as getCurrentVideoComments
    const videoId = currentVideo.id || currentVideo._id;
    setVideoComments(prev => ({
      ...prev,
      [videoId]: comments
    }));
  };

  // Available classes based on level
  const availableClasses = useMemo(() => {
    if (selectedLevel === "primary" || selectedLevel === "primary_kiswahili") return ["1", "2", "3", "4", "5", "6", "7"];
    if (selectedLevel === "secondary") return ["1", "2", "3", "4"];
    if (selectedLevel === "advance") return ["5", "6"];
    return [];
  }, [selectedLevel]);

  // Available subjects based on level
  const availableSubjects = useMemo(() => {
    if (selectedLevel === "primary") return primarySubjects;
    if (selectedLevel === "primary_kiswahili") return primaryKiswahiliSubjects;
    if (selectedLevel === "secondary") return secondarySubjects;
    if (selectedLevel === "advance") return advanceSubjects;
    return [];
  }, [selectedLevel]);

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      dispatch(ShowLoading());

      const filters = {
        level: selectedLevel,
        className: "all", // Get all classes for the level
        subject: "all", // Get all subjects for the level
        content: "videos"
      };

      const response = await getStudyMaterial(filters);

      if (response?.data?.success) {
        const videoData = response.data.data || [];
        setVideos(videoData);

        // Load comments for all videos
        await loadAllVideoComments(videoData);
      } else {
        setError(response?.data?.message || "Failed to fetch videos");
        setVideos([]);
      }
    } catch (error) {
      console.error("❌ Error fetching videos:", error);
      setError("Failed to load videos. Please try again.");
      setVideos([]);
    } finally {
      setLoading(false);
      dispatch(HideLoading());
    }
  }, [selectedLevel, dispatch]);

  // Filter and sort videos
  const filteredAndSortedVideos = useMemo(() => {


    let filtered = videos;

    // Apply level filter
    filtered = filtered.filter(video => video.level === selectedLevel);

    // Apply class filter
    if (selectedClass !== "all") {
      filtered = filtered.filter(video => {
        // Check both className and class fields for compatibility
        const videoClass = video.className || video.class;
        return videoClass === selectedClass;
      });
    }

    // Apply subject filter
    if (selectedSubject !== "all") {
      filtered = filtered.filter(video => video.subject === selectedSubject);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(video =>
        video.title?.toLowerCase().includes(searchLower) ||
        video.subject?.toLowerCase().includes(searchLower) ||
        video.topic?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "oldest":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "subject":
          return (a.subject || "").localeCompare(b.subject || "");
        default:
          return 0;
      }
    });

    console.log('✅ Final filtered videos:', sorted.length);
    if (sorted.length > 0) {
      console.log('📹 Sample filtered video:', sorted[0]);
    }

    return sorted;
  }, [videos, searchTerm, sortBy, selectedLevel, selectedClass, selectedSubject]);

  // Video handlers
  const handleShowVideo = async (index) => {
    const video = filteredAndSortedVideos[index];

    setCurrentVideoIndex(index);
    setShowVideoIndices([index]);
    setIsVideoExpanded(false);
    setVideoError(null);

    // Load comments for this video if not already loaded
    const videoId = video?.id || video?._id;
    if (videoId && !videoComments[videoId]) {
      loadVideoComments(videoId);
    }

    // Get signed URL for S3 videos if needed
    if (video?.videoUrl && (video.videoUrl.includes('amazonaws.com') || video.videoUrl.includes('s3.'))) {
      try {
        const signedUrl = await getSignedVideoUrl(video.videoUrl);
        video.signedVideoUrl = signedUrl;
      } catch (error) {
        console.warn('Failed to get signed URL, using original URL');
        video.signedVideoUrl = video.videoUrl;
      }
    }
  };

  const handleHideVideo = () => {
    setShowVideoIndices([]);
    setCurrentVideoIndex(null);
    setIsVideoExpanded(false);
    setVideoError(null);
    if (videoRef) {
      videoRef.pause();
    }
  };

  const toggleVideoExpansion = () => {
    setIsVideoExpanded(!isVideoExpanded);
  };

  // Get signed URL for S3 videos to ensure access
  const getSignedVideoUrl = async (videoUrl) => {
    if (!videoUrl) return videoUrl;

    // For AWS S3 URLs, get signed URL from backend
    if (videoUrl.includes('amazonaws.com') || videoUrl.includes('s3.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/study/video-signed-url?videoUrl=${encodeURIComponent(videoUrl)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.signedUrl) {
          console.log('✅ Got signed URL for S3 video');
          return data.signedUrl;
        } else {
          console.warn('⚠️ Invalid response from signed URL endpoint:', data);
          return videoUrl;
        }
      } catch (error) {
        console.error('❌ Error getting signed URL:', error);
        return videoUrl;
      }
    }

    return videoUrl;
  };

  // Get thumbnail URL
  const getThumbnailUrl = (video) => {
    if (video.thumbnail) {
      return video.thumbnail;
    }
    
    if (video.videoID && !video.videoID.includes('amazonaws.com')) {
      let videoId = video.videoID;
      if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
        const match = videoId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        videoId = match ? match[1] : videoId;
      }
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    
    return '/api/placeholder/400/225';
  };

  // Effects
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Handle filter changes with localStorage persistence
  const handleClassChange = (value) => {
    setSelectedClass(value);
    localStorage.setItem('video-lessons-selected-class', value);
  };

  const handleSubjectChange = (value) => {
    setSelectedSubject(value);
    localStorage.setItem('video-lessons-selected-subject', value);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    localStorage.setItem('video-lessons-search-term', value);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    localStorage.setItem('video-lessons-sort-by', value);
  };

  useEffect(() => {
    if (user?.level) {
      setSelectedLevel(user.level);
    }
    // Only set user's class as default if no saved preference exists
    if (user?.class && !localStorage.getItem('video-lessons-selected-class')) {
      handleClassChange(user.class);
    }
  }, [user]);

  // Clear search and refresh
  const handleClearSearch = () => {
    handleSearchChange("");
  };

  const handleRefresh = () => {
    // Only refresh data, don't clear filters or search
    fetchVideos();
  };

  const handleClearAll = () => {
    handleSearchChange("");
    handleSubjectChange("all");
    handleClassChange("all");
    handleSortChange("newest");
    fetchVideos();
  };

  // Load comments for all videos
  const loadAllVideoComments = async (videoList) => {
    try {
      console.log('📹 Loading comments for all videos:', videoList.length);
      const commentsMap = {};

      // Load comments for each video
      for (const video of videoList) {
        const videoId = video.id || video._id;
        if (videoId) {
          try {
            const response = await getVideoComments(videoId);
            if (response.success) {
              commentsMap[videoId] = response.data.comments;
              console.log(`📝 Loaded ${response.data.comments.length} comments for video ${videoId}`);
            }
          } catch (error) {
            console.error(`Error loading comments for video ${videoId}:`, error);
          }
        }
      }

      setVideoComments(commentsMap);
      console.log('✅ All video comments loaded:', commentsMap);
    } catch (error) {
      console.error("Error loading all video comments:", error);
    }
  };

  // Load comments for current video
  const loadVideoComments = async (videoId) => {
    try {
      const response = await getVideoComments(videoId);
      if (response.success) {
        setVideoComments(prev => ({
          ...prev,
          [videoId]: response.data.comments
        }));
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  // Comment functions
  const handleAddComment = async () => {
    if (newComment.trim()) {
      const currentVideo = filteredAndSortedVideos[currentVideoIndex];
      if (!currentVideo) return;

      try {
        console.log('📹 Current video object:', currentVideo);
        console.log('📹 Video keys:', Object.keys(currentVideo || {}));
        console.log('📹 Video id field:', currentVideo?.id);
        console.log('📹 Video _id field:', currentVideo?._id);

        // Use _id if id doesn't exist
        const videoId = currentVideo.id || currentVideo._id;

        const commentData = {
          videoId: videoId,
          text: newComment.trim()
        };

        console.log('📝 Sending video comment:', commentData);
        console.log('📝 Comment data keys:', Object.keys(commentData));
        console.log('📝 videoId value:', videoId, '(type:', typeof videoId, ')');
        console.log('📝 text value:', newComment.trim(), '(type:', typeof newComment.trim(), ')');

        const response = await addVideoComment(commentData);

        if (response.success) {
          // Add comment to local state immediately for better UX
          const comment = {
            _id: response.data._id,
            text: response.data.text,
            author: response.data.author,
            avatar: response.data.avatar,
            createdAt: response.data.createdAt,
            replies: [],
            likes: 0,
            likedBy: []
          };
          const currentComments = getCurrentVideoComments();
          setCurrentVideoComments([comment, ...currentComments]);
          setNewComment("");
          message.success("Comment added successfully!");
        } else {
          message.error(response.message || "Failed to add comment");
        }
      } catch (error) {
        console.error("Error adding comment:", error);
        message.error("Failed to add comment");
      }
    }
  };



  const handleAddReply = async (commentId) => {
    if (replyText.trim()) {
      try {
        const response = await addCommentReply(commentId, {
          text: replyText.trim()
        });

        if (response.success) {
          // Update local state with the new reply
          const currentComments = getCurrentVideoComments();
          const updatedComments = currentComments.map(comment =>
            comment._id === commentId || comment.id === commentId
              ? { ...comment, replies: response.data.replies }
              : comment
          );
          setCurrentVideoComments(updatedComments);
          setReplyText("");
          setReplyingTo(null);
          message.success("Reply added successfully!");
        } else {
          message.error(response.message || "Failed to add reply");
        }
      } catch (error) {
        console.error("Error adding reply:", error);
        message.error("Failed to add reply");
      }
    }
  };

  const handleLikeComment = async (commentId, isReply = false, replyId = null) => {
    try {
      const response = await likeComment(commentId, {
        isReply,
        replyId
      });

      if (response.success) {
        // Update local state with the updated comment
        const currentComments = getCurrentVideoComments();
        const updatedComments = currentComments.map(comment =>
          comment._id === commentId || comment.id === commentId
            ? response.data
            : comment
        );
        setCurrentVideoComments(updatedComments);
      } else {
        message.error(response.message || "Failed to update like");
      }
    } catch (error) {
      console.error("Error updating like:", error);
      message.error("Failed to update like");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await deleteVideoComment(commentId);

      if (response.success) {
        // Remove comment from local state
        const currentComments = getCurrentVideoComments();
        const updatedComments = currentComments.filter(comment =>
          comment._id !== commentId && comment.id !== commentId
        );
        setCurrentVideoComments(updatedComments);
        message.success("Comment deleted successfully!");
      } else {
        message.error(response.message || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      message.error("Failed to delete comment");
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment._id || comment.id);
    setEditCommentText(comment.text);
  };

  const handleSaveEditComment = async () => {
    if (!editCommentText.trim()) {
      message.error("Comment cannot be empty");
      return;
    }

    try {
      // TODO: Add API call to update comment
      // const response = await updateVideoComment(editingComment, { text: editCommentText.trim() });

      // For now, update local state
      const currentComments = getCurrentVideoComments();
      const updatedComments = currentComments.map(comment => {
        if ((comment._id || comment.id) === editingComment) {
          return { ...comment, text: editCommentText.trim() };
        }
        return comment;
      });
      setCurrentVideoComments(updatedComments);

      setEditingComment(null);
      setEditCommentText("");
      message.success("Comment updated successfully!");
    } catch (error) {
      console.error("Error updating comment:", error);
      message.error("Failed to update comment");
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditCommentText("");
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="video-lessons-container">
      {/* Enhanced Header with Level Display */}
      <div className="video-lessons-header">
        <div className="header-content">
          <div className="header-main">
            <div className="header-icon">
              <TbVideo />
            </div>
            <div className="header-text">
              <h1>Video Lessons</h1>
              <p>Watch educational videos to enhance your learning</p>
            </div>
          </div>

          {/* Level and Class Display */}
          <div className="level-display">
            <div className="current-level">
              <span className="level-label">Level:</span>
              <span className="level-value">{selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)}</span>
            </div>
            <div className="current-class">
              <span className="class-label">Your Class:</span>
              <span className="class-value">
                {user?.level === 'primary' ? `Class ${user?.class || 'N/A'}` :
                 user?.level === 'secondary' ? `Form ${user?.class || 'N/A'}` :
                 user?.level === 'advance' ? `Form ${user?.class || 'N/A'}` :
                 'Not Set'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="video-lessons-content">
        {/* Enhanced Filters and Controls */}
        <div className="video-controls">
          <div className="controls-row">
            {/* Class Filter */}
            <div className="control-group">
              <label className="control-label">
                <TbFilter />
                {isKiswahili ? 'Chuja kwa Darasa' : 'Filter by Class'}
              </label>
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="control-select class-select"
              >
                <option value="all">{isKiswahili ? 'Madarasa Yote' : 'All Classes'}</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {selectedLevel === 'primary' || selectedLevel === 'primary_kiswahili' ?
                      (isKiswahili ? `Darasa la ${cls}` : `Class ${cls}`) :
                      `Form ${cls}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div className="control-group">
              <label className="control-label">
                <TbFilter />
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="control-select subject-select"
              >
                <option value="all">All Subjects</option>
                {availableSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="control-group">
              <label className="control-label">
                <TbSortAscending />
                Sort
              </label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="control-select sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
                <option value="subject">Subject A-Z</option>
              </select>
            </div>
          </div>

          {/* Search Row */}
          <div className="search-row">
            <div className="search-container">
              <TbSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search videos by title, subject, or topic..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={handleClearSearch} className="clear-search-btn">
                  <TbX />
                  Clear Search
                </button>
              )}
            </div>

            <button onClick={handleRefresh} className="refresh-btn">
              <TbDownload />
              Refresh All
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>{isKiswahili ? 'Inapakia video...' : 'Loading videos...'}</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <TbAlertTriangle className="error-icon" />
            <h3>{isKiswahili ? 'Hitilafu ya Kupakia Video' : 'Error Loading Videos'}</h3>
            <p>{error}</p>
            <button onClick={fetchVideos} className="retry-btn">
              {isKiswahili ? 'Jaribu Tena' : 'Try Again'}
            </button>
          </div>
        ) : filteredAndSortedVideos.length > 0 ? (
          <div className="videos-grid">
            {filteredAndSortedVideos.map((video, index) => (
              <div key={index} className="video-card" onClick={() => handleShowVideo(index)}>
                <div className="video-card-thumbnail">
                  <img
                    src={getThumbnailUrl(video)}
                    alt={video.title}
                    className="thumbnail-image"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback logic for failed thumbnails
                      if (video.videoID && !video.videoID.includes('amazonaws.com')) {
                        // For YouTube videos, try different quality thumbnails
                        let videoId = video.videoID;
                        if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
                          const match = videoId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                          videoId = match ? match[1] : videoId;
                        }

                        const fallbacks = [
                          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                          `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                          `https://img.youtube.com/vi/${videoId}/default.jpg`,
                          '/api/placeholder/320/180'
                        ];

                        const currentSrc = e.target.src;
                        const currentIndex = fallbacks.findIndex(url => currentSrc.includes(url.split('/').pop()));

                        if (currentIndex < fallbacks.length - 1) {
                          e.target.src = fallbacks[currentIndex + 1];
                        }
                      } else {
                        e.target.src = '/api/placeholder/320/180';
                      }
                    }}
                  />
                  <div className="play-overlay">
                    <FaPlayCircle className="play-icon" />
                  </div>
                  <div className="video-duration">
                    {video.duration || "Video"}
                  </div>
                  {video.subtitles && video.subtitles.length > 0 && (
                    <div className="subtitle-badge">
                      <TbInfoCircle />
                      CC
                    </div>
                  )}
                </div>

                <div className="video-card-content">
                  <h3 className="video-title">{video.title}</h3>
                  <div className="video-meta">
                    <span className="video-subject">{getSubjectName(video.subject)}</span>
                    <span className="video-class">
                      {selectedLevel === 'primary' || selectedLevel === 'primary_kiswahili' ?
                        (isKiswahili ? `Darasa la ${video.className || video.class}` : `Class ${video.className || video.class}`) :
                        `Form ${video.className || video.class}`}
                    </span>
                  </div>
                  <div className="video-tags">
                    {video.topic && <span className="topic-tag">{video.topic}</span>}
                    {video.sharedFromClass && video.sharedFromClass !== (video.className || video.class) && (
                      <span className="shared-tag">
                        {isKiswahili ? 'Kushirikiwa kutoka ' : 'Shared from '}{selectedLevel === 'primary' || selectedLevel === 'primary_kiswahili' ?
                          (isKiswahili ? `Darasa la ${video.sharedFromClass}` : `Class ${video.sharedFromClass}`) :
                          `Form ${video.sharedFromClass}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FaGraduationCap className="empty-icon" />
            <h3>{isKiswahili ? 'Hakuna Video Zilizopatikana' : 'No Videos Found'}</h3>
            <p>{isKiswahili ? 'Hakuna masomo ya video yanayopatikana kwa uchaguzi wako wa sasa.' : 'No video lessons are available for your current selection.'}</p>
            <p className="suggestion">{isKiswahili ? 'Jaribu kuchagua darasa au somo tofauti.' : 'Try selecting a different class or subject.'}</p>
          </div>
        )}
      </div>

      {/* Enhanced Video Display */}
      {showVideoIndices.length > 0 && currentVideoIndex !== null && (
        <div className={`video-overlay ${isVideoExpanded ? 'expanded' : ''}`} onClick={(e) => {
          if (e.target === e.currentTarget) handleHideVideo();
        }}>
          <div className={`video-modal ${isVideoExpanded ? 'expanded' : ''}`}>
            {(() => {
              const video = filteredAndSortedVideos[currentVideoIndex];
              if (!video) return <div>Video not found</div>;

              return (
                <div className="video-content">
                  <div className="video-header">
                    <div className="video-info">
                      <h3 className="video-title">{video.title}</h3>
                      <div className="video-meta">
                        <span className="video-subject">{video.subject}</span>
                        <span className="video-class">Class {video.className}</span>
                        {video.level && <span className="video-level">{video.level}</span>}
                      </div>
                    </div>
                    <div className="video-controls">
                      <button
                        className="control-btn add-comment-btn"
                        onClick={() => {
                          setCommentsExpanded(!commentsExpanded);
                          if (!commentsExpanded && !isVideoExpanded) {
                            toggleVideoExpansion();
                          }
                        }}
                        title="Add Comment"
                      >
                        <span className="btn-icon">💬</span>
                        <span className="btn-text">Comment</span>
                      </button>
                      {(isVideoExpanded && commentsExpanded) && (
                        <button
                          className="control-btn close-comment-btn"
                          onClick={() => {
                            setCommentsExpanded(false);
                            toggleVideoExpansion();
                          }}
                          title="Close Comments"
                        >
                          <span className="btn-icon">✕</span>
                          <span className="btn-text">Close</span>
                        </button>
                      )}
                      <button
                        className="control-btn close-btn"
                        onClick={handleHideVideo}
                        title="Close video"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>

                  {/* Video and Comments Layout */}
                  <div className={`video-main-layout ${isVideoExpanded ? 'expanded-layout' : 'normal-layout'}`}>
                    {/* Video Container */}
                    <div className="video-container">
                    {video.videoUrl ? (
                      <div style={{ padding: '15px', background: '#000', borderRadius: '8px' }}>
                          <video
                            ref={(ref) => setVideoRef(ref)}
                            controls
                            playsInline
                            preload="none"
                            width="100%"
                            height="400"
                            poster={getThumbnailUrl(video)}
                            style={{
                              width: '100%',
                              height: '400px',
                              backgroundColor: '#000'
                            }}
                            loading="lazy"
                            onError={(e) => {
                              setVideoError(`Failed to load video: ${video.title}. Please try refreshing the page.`);
                            }}
                            onCanPlay={() => {
                              setVideoError(null);
                            }}
                            onLoadStart={() => {
                              console.log('🎬 Video loading started');
                            }}
                            crossOrigin="anonymous"
                          >
                            {/* Use signed URL if available, otherwise use original URL */}
                            <source src={video.signedVideoUrl || video.videoUrl} type="video/mp4" />

                            {/* Add subtitle tracks if available */}
                            {video.subtitles && video.subtitles.length > 0 && video.subtitles.map((subtitle, index) => (
                              <track
                                key={`${subtitle.language}-${index}`}
                                kind="subtitles"
                                src={subtitle.url}
                                srcLang={subtitle.language}
                                label={subtitle.languageName}
                                default={subtitle.isDefault || index === 0}
                              />
                            ))}

                            Your browser does not support the video tag.
                          </video>

                          {/* Subtitle indicator */}
                          {video.subtitles && video.subtitles.length > 0 && (
                            <div className="subtitle-indicator">
                              <TbInfoCircle className="subtitle-icon" />
                              <span>Subtitles available in {video.subtitles.length} language(s)</span>
                            </div>
                          )}

                          {/* Video error display */}
                          {videoError && (
                            <div className="video-error-overlay">
                              <div className="error-content">
                                <TbAlertTriangle className="error-icon" />
                                <p>{videoError}</p>
                                <button onClick={() => setVideoError(null)} className="dismiss-error-btn">
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                    ) : video.videoID ? (
                      // Fallback to YouTube embed if no videoUrl
                      <iframe
                        src={`https://www.youtube.com/embed/${video.videoID}?autoplay=1&rel=0`}
                        title={video.title}
                        frameBorder="0"
                        allowFullScreen
                        className="video-iframe"
                        onLoad={() => console.log('✅ YouTube iframe loaded')}
                      ></iframe>
                    ) : (
                      <div className="video-error">
                        <div className="error-icon">⚠️</div>
                        <h3>Video Unavailable</h3>
                        <p>{videoError || "This video cannot be played at the moment."}</p>
                        <div className="error-actions">
                          <a
                            href={video.signedVideoUrl || video.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link-btn"
                          >
                            📱 Open in New Tab
                          </a>
                        </div>
                      </div>
                    )}
                    </div>

                    {/* Comments Section - Always visible */}
                    <div className={`comments-section-below ${isVideoExpanded ? 'expanded-comments' : 'normal-comments'}`}>
                      {/* Comments Count - Always visible at top */}
                      <div className="comments-count-header">
                        <div className="comments-count-display">
                          <TbInfoCircle />
                          <span>{getCurrentVideoComments().length} {getCurrentVideoComments().length === 1 ? 'comment' : 'comments'}</span>
                        </div>
                        {!isVideoExpanded || !commentsExpanded ? (
                          <button
                            onClick={() => {
                              setCommentsExpanded(true);
                              if (!isVideoExpanded) {
                                toggleVideoExpansion();
                              }
                            }}
                            className="view-comments-btn"
                          >
                            <span className="btn-icon">👁️</span>
                            <span className="btn-text">View</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setCommentsExpanded(false)}
                            className="comments-toggle-btn"
                          >
                            ▼ Minimize
                          </button>
                        )}
                      </div>

                      {/* Comments Content - Show when expanded */}
                      {(isVideoExpanded && commentsExpanded) && (
                        <div className="comments-content maximized">
                            {/* Add Comment */}
                            <div className="add-comment">
                              <div className="comment-input-container">
                                <div className="user-avatar">
                                  {user?.name?.charAt(0)?.toUpperCase() || "A"}
                                </div>
                                <div className="comment-input-wrapper">
                                  <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Share your thoughts about this video..."
                                    className="comment-input"
                                    rows="3"
                                    autoFocus
                                  />
                                  <button
                                    onClick={handleAddComment}
                                    className="comment-submit-btn"
                                    disabled={!newComment.trim()}
                                  >
                                    <span>💬</span> Post Comment
                                  </button>
                                </div>
                              </div>
                            </div>

                      {/* Comments List */}
                      <div className="comments-list">
                        {getCurrentVideoComments().length === 0 ? (
                          <div className="no-comments">
                            <div className="no-comments-icon">💬</div>
                            <p>No comments yet. Be the first to share your thoughts!</p>
                          </div>
                        ) : (
                          getCurrentVideoComments().map((comment) => (
                            <div key={comment._id || comment.id} className="comment">
                              <div className="comment-main">
                                <div className="comment-avatar">
                                  {comment.avatar || comment.author?.charAt(0)?.toUpperCase() || "A"}
                                </div>
                                <div className="comment-content">
                                  <div className="comment-header">
                                    <div className="comment-author-info">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span className="comment-author">{comment.author}</span>
                                        {(comment.userRole === 'admin' || comment.isAdmin) && (
                                          <MdVerified style={{ color: '#1d9bf0', fontSize: '14px' }} title="Verified Admin" />
                                        )}
                                      </div>
                                      {comment.user && (
                                        <div className="author-details">
                                          {comment.userLevel && (
                                            <span className="user-level" style={{
                                              fontSize: '10px',
                                              background: '#e3f2fd',
                                              color: '#1976d2',
                                              padding: '2px 6px',
                                              borderRadius: '10px',
                                              marginLeft: '8px'
                                            }}>
                                              {comment.userLevel}
                                            </span>
                                          )}
                                          {comment.userClass && (
                                            <span className="user-class" style={{
                                              fontSize: '10px',
                                              background: '#f3e5f5',
                                              color: '#7b1fa2',
                                              padding: '2px 6px',
                                              borderRadius: '10px',
                                              marginLeft: '4px'
                                            }}>
                                              Class {comment.userClass}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <span className="comment-time">
                                      {formatTimeAgo(comment.createdAt || comment.timestamp)}
                                    </span>
                                  </div>
                                  {/* Comment Text - Editable */}
                                  {editingComment === (comment._id || comment.id) ? (
                                    <div className="edit-comment-container" style={{ marginBottom: '12px' }}>
                                      <textarea
                                        value={editCommentText}
                                        onChange={(e) => setEditCommentText(e.target.value)}
                                        className="comment-input"
                                        rows="3"
                                        style={{
                                          width: '100%',
                                          padding: '8px 12px',
                                          border: '1px solid #ddd',
                                          borderRadius: '8px',
                                          fontSize: '14px',
                                          resize: 'vertical',
                                          minHeight: '60px'
                                        }}
                                      />
                                      <div className="edit-comment-actions" style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                        <button
                                          onClick={handleSaveEditComment}
                                          style={{
                                            background: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          style={{
                                            background: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="comment-text">{comment.text}</div>
                                  )}

                                  <div className="comment-actions">
                                    <button
                                      onClick={() => handleLikeComment(comment._id || comment.id)}
                                      className={`like-btn ${comment.likedBy?.includes(user?._id) ? 'liked' : ''}`}
                                    >
                                      <span>{comment.likedBy?.includes(user?._id) ? '❤️' : '🤍'}</span>
                                      {comment.likes > 0 && <span className="like-count">{comment.likes}</span>}
                                    </button>
                                    <button
                                      onClick={() => setReplyingTo(replyingTo === (comment._id || comment.id) ? null : (comment._id || comment.id))}
                                      className="reply-btn"
                                    >
                                      <span>💬</span> Reply
                                    </button>
                                    {/* Edit button - only show for comment author */}
                                    {comment.user === user?._id && editingComment !== (comment._id || comment.id) && (
                                      <button
                                        onClick={() => handleEditComment(comment)}
                                        className="edit-btn"
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#007bff',
                                          cursor: 'pointer',
                                          padding: '4px 8px',
                                          borderRadius: '4px',
                                          fontSize: '12px',
                                          marginLeft: '8px'
                                        }}
                                      >
                                        <span>✏️</span> Edit
                                      </button>
                                    )}
                                    {/* Delete button - only show for comment author or admin */}
                                    {(comment.user === user?._id || user?.isAdmin) && (
                                      <button
                                        onClick={() => {
                                          if (window.confirm('Are you sure you want to delete this comment?')) {
                                            handleDeleteComment(comment._id || comment.id);
                                          }
                                        }}
                                        className="delete-btn"
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#ef4444',
                                          cursor: 'pointer',
                                          padding: '4px 8px',
                                          borderRadius: '4px',
                                          fontSize: '12px',
                                          marginLeft: '8px'
                                        }}
                                      >
                                        <span>🗑️</span> Delete
                                      </button>
                                    )}
                                    {comment.replies.length > 0 && (
                                      <span className="replies-count">
                                        {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Reply Input */}
                              {replyingTo === (comment._id || comment.id) && (
                                <div className="reply-input-container">
                                  <div className="reply-input-wrapper">
                                    <div className="user-avatar small">
                                      {user?.name?.charAt(0)?.toUpperCase() || "A"}
                                    </div>
                                    <div className="reply-input-content">
                                      <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={`Reply to ${comment.author}...`}
                                        className="reply-input"
                                        rows="2"
                                        autoFocus
                                      />
                                      <div className="reply-actions">
                                        <button
                                          onClick={() => handleAddReply(comment._id || comment.id)}
                                          className="reply-submit-btn"
                                          disabled={!replyText.trim()}
                                        >
                                          <span>💬</span> Reply
                                        </button>
                                        <button
                                          onClick={() => {
                                            setReplyingTo(null);
                                            setReplyText("");
                                          }}
                                          className="reply-cancel-btn"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Replies */}
                              {comment.replies.length > 0 && (
                                <div className="replies">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="reply">
                                      <div className="reply-main">
                                        <div className="reply-avatar">
                                          {reply.avatar || reply.author?.charAt(0)?.toUpperCase() || "A"}
                                        </div>
                                        <div className="reply-content">
                                          <div className="reply-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <span className="reply-author">{reply.author}</span>
                                              {(reply.userRole === 'admin' || reply.isAdmin) && (
                                                <MdVerified style={{ color: '#1d9bf0', fontSize: '12px' }} title="Verified Admin" />
                                              )}
                                            </div>
                                            <span className="reply-time">
                                              {formatTimeAgo(reply.timestamp)}
                                            </span>
                                          </div>
                                          <div className="reply-text">{reply.text}</div>
                                          <div className="reply-actions">
                                            <button
                                              onClick={() => handleLikeComment(reply.id, true, comment.id)}
                                              className={`like-btn small ${reply.liked ? 'liked' : ''}`}
                                            >
                                              <span>{reply.liked ? '❤️' : '🤍'}</span>
                                              {reply.likes > 0 && <span className="like-count">{reply.likes}</span>}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* End of video-main-layout */}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoLessons;

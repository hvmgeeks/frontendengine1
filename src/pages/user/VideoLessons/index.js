import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "./index.css";
import { motion, AnimatePresence } from "framer-motion";
import { getStudyMaterial, likeVideo } from "../../../apicalls/study";
import { getVideoComments, addVideoComment, addCommentReply, likeComment, deleteVideoComment } from "../../../apicalls/videoComments";
import { useDispatch, useSelector } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { message } from "antd";
import { primarySubjects, primaryKiswahiliSubjects, secondarySubjects, advanceSubjects } from "../../../data/Subjects.jsx";
import { useLanguage } from "../../../contexts/LanguageContext";
import { MdVerified } from 'react-icons/md';
import VideoGrid from './VideoGrid';
import { getAllDownloadedVideos } from '../../../utils/offlineVideo';

// Temporary fix: Use simple text/symbols instead of React Icons to avoid chunk loading issues
const IconComponents = {
  FaPlayCircle: () => <span style={{fontSize: '24px'}}>▶️</span>,
  FaGraduationCap: () => <span style={{fontSize: '24px'}}>🎓</span>,
  FaTimes: () => <span style={{fontSize: '18px'}}>✕</span>,
  FaExpand: () => <span style={{fontSize: '18px'}}>⛶</span>,
  FaCompress: () => <span style={{fontSize: '18px'}}>⛶</span>,
  TbVideo: () => <span style={{fontSize: '24px'}}>📹</span>,
  TbInfoCircle: () => <span style={{fontSize: '16px'}}>ℹ️</span>,
  TbAlertTriangle: () => <span style={{fontSize: '16px'}}>⚠️</span>,
  TbFilter: () => <span style={{fontSize: '18px'}}>🔍</span>,
  TbSortAscending: () => <span style={{fontSize: '18px'}}>↑</span>,
  TbSearch: () => <span style={{fontSize: '18px'}}>🔍</span>,
  TbX: () => <span style={{fontSize: '16px'}}>✕</span>,
  TbDownload: () => <span style={{fontSize: '18px'}}>↻</span>
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

  // Inline CSS fixes for mobile issues
  const inlineStyles = `
    /* Mobile Layout Fixes */
    @media (max-width: 768px) {
      /* Reduce Bell Icon Size */
      .notification-bell-button .w-5,
      .notification-bell-button .h-5 {
        width: 14px !important;
        height: 14px !important;
      }

      /* All header and sidebar styles removed - using ProtectedRoute only */
      .video-lessons-container {
        padding-top: 16px !important;
      }
    }

    /* Center Quiz Marking Modal */
    .ant-modal,
    .quiz-modal,
    .marking-modal,
    .result-modal,
    .quiz-result-modal {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      top: 0 !important;
      padding-top: 0 !important;
    }

    .ant-modal-content,
    .quiz-modal-content,
    .marking-modal-content,
    .result-modal-content {
      margin: 0 auto !important;
      position: relative !important;
      top: auto !important;
      transform: none !important;
    }

    .ant-modal-wrap {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 100vh !important;
    }

    /* Specific Quiz Result Modal Centering */
    .quiz-result-overlay,
    .quiz-marking-overlay {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 10000 !important;
      padding: 20px !important;
      box-sizing: border-box !important;
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

  // State management with localStorage persistence
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoCache, setVideoCache] = useState({}); // Cache for video data and metadata
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [videosPerPage, setVideosPerPage] = useState(12);
  const [totalVideos, setTotalVideos] = useState(0);

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
    const currentVideo = paginatedVideos[currentVideoIndex];
    if (!currentVideo) return [];

    // Try both id and _id fields
    const videoId = currentVideo.id || currentVideo._id;
    return videoComments[videoId] || [];
  };

  // Set comments for current video
  const setCurrentVideoComments = (comments) => {
    if (currentVideoIndex === null) return;
    const currentVideo = paginatedVideos[currentVideoIndex];
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

  // Optimized video fetching with caching - load videos immediately, comments on demand
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      dispatch(ShowLoading());

      const startTime = performance.now();
      console.log('🚀 Starting video fetch...');

      // Check if offline - load from IndexedDB
      const isOnline = navigator.onLine;
      if (!isOnline) {
        console.log('📡 Offline mode detected - loading downloaded videos from IndexedDB...');
        try {
          const offlineVideos = await getAllDownloadedVideos();
          console.log('📦 Offline videos from IndexedDB:', offlineVideos);

          if (offlineVideos && offlineVideos.length > 0) {
            console.log(`✅ Loaded ${offlineVideos.length} videos from offline storage`);

            // Extract video details from offline storage
            const formattedVideos = offlineVideos.map((item, index) => {
              // Handle both old format (just blob) and new format (with details)
              if (item.details) {
                return {
                  ...item.details,
                  _id: item.details._id || item.details.id || `offline_${index}`,
                  isOffline: true,
                  offlineUrl: item.url
                };
              } else {
                // Fallback for old format without details
                return {
                  _id: `offline_${index}`,
                  title: item.title || 'Offline Video',
                  videoUrl: item.url,
                  isOffline: true,
                  offlineUrl: item.url
                };
              }
            });

            console.log('📹 Formatted offline videos:', formattedVideos);
            setVideos(formattedVideos);
            setLoading(false);
            dispatch(HideLoading());
            message.info('📡 Offline mode: Showing downloaded videos only');
            return;
          } else {
            message.warning('📡 No videos available offline. Please download videos when online.');
            setVideos([]);
            setLoading(false);
            dispatch(HideLoading());
            return;
          }
        } catch (error) {
          console.error('Error loading offline videos:', error);
          message.error('Failed to load offline videos');
          setVideos([]);
          setLoading(false);
          dispatch(HideLoading());
          return;
        }
      }

      // Check cache first for instant loading (when online)
      const cacheKey = `videos_${selectedLevel}`;
      const cachedData = videoCache[cacheKey];
      const localCachedData = localStorage.getItem(cacheKey);

      // Use cache if available and less than 10 minutes old
      if (cachedData && (Date.now() - cachedData.timestamp) < 600000) {
        setVideos(cachedData.data);
        setLoading(false);
        dispatch(HideLoading());
        const cacheTime = performance.now() - startTime;
        console.log(`⚡ Videos loaded from memory cache in ${cacheTime.toFixed(1)}ms - ${cachedData.data.length} videos`);
        return;
      }

      // Try localStorage cache
      if (localCachedData) {
        try {
          const parsedCache = JSON.parse(localCachedData);
          if (parsedCache && (Date.now() - parsedCache.timestamp) < 600000) {
            setVideos(parsedCache.data);
            setVideoCache(prev => ({ ...prev, [cacheKey]: parsedCache }));
            setLoading(false);
            dispatch(HideLoading());
            const cacheTime = performance.now() - startTime;
            console.log(`📦 Videos loaded from localStorage cache in ${cacheTime.toFixed(1)}ms - ${parsedCache.data.length} videos`);
            return;
          }
        } catch (error) {
          console.warn('Failed to parse cached video data:', error);
        }
      }

      // Fetch from API when online
      console.log('🌐 Loading videos from API...');
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

        // Cache video data for faster subsequent loads
        const cacheKey = `videos_${selectedLevel}`;
        const cacheData = {
          data: videoData,
          timestamp: Date.now(),
          level: selectedLevel
        };
        setVideoCache(prev => ({ ...prev, [cacheKey]: cacheData }));

        // Also cache in localStorage for persistence
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
          console.warn('Failed to cache videos in localStorage:', error);
        }

        const loadTime = performance.now() - startTime;
        console.log(`✅ Videos loaded and cached in ${loadTime.toFixed(1)}ms - ${videoData.length} videos`);

        // Don't load all comments immediately - load on demand for better performance
        console.log('📹 Videos ready for display - comments will load on demand');
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
  }, [selectedLevel, dispatch, videoCache]);

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

    // Update total count
    setTotalVideos(sorted.length);

    console.log('✅ Final filtered videos:', sorted.length);
    if (sorted.length > 0) {
      console.log('📹 Sample filtered video:', sorted[0]);
    }

    return sorted;
  }, [videos, searchTerm, sortBy, selectedLevel, selectedClass, selectedSubject]);

  // Paginated videos
  const paginatedVideos = useMemo(() => {
    const startIndex = (currentPage - 1) * videosPerPage;
    const endIndex = startIndex + videosPerPage;
    return filteredAndSortedVideos.slice(startIndex, endIndex);
  }, [filteredAndSortedVideos, currentPage, videosPerPage]);

  // Pagination calculations
  const totalPages = Math.ceil(totalVideos / videosPerPage);
  const startItem = (currentPage - 1) * videosPerPage + 1;
  const endItem = Math.min(currentPage * videosPerPage, totalVideos);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setCurrentVideoIndex(null); // Close any open video when changing pages
  };

  const handlePageSizeChange = (newSize) => {
    setVideosPerPage(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Video handlers
  const handleShowVideo = async (index) => {
    const video = paginatedVideos[index];

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
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/study/video-signed-url?videoUrl=${encodeURIComponent(videoUrl)}`, {
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
    
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNEE5MEUyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJyYWlud2F2ZSBWaWRlbzwvdGV4dD48L3N2Zz4=';
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

  // Optimized lazy comment loading with caching
  const loadAllVideoComments = async (videoList) => {
    // This function is now deprecated - comments load on demand for better performance
    console.log('📹 Skipping bulk comment loading for better performance');
    console.log('📝 Comments will load on-demand when videos are viewed');
  };

  // Optimized comment loading with caching and performance tracking
  const loadVideoComments = async (videoId) => {
    try {
      // Check if comments are already cached
      if (videoComments[videoId]) {
        console.log(`📝 Comments for video ${videoId} already cached`);
        return;
      }

      const startTime = performance.now();
      console.log(`📝 Loading comments for video ${videoId}...`);

      const response = await getVideoComments(videoId);
      if (response.success) {
        setVideoComments(prev => ({
          ...prev,
          [videoId]: response.data.comments
        }));

        const loadTime = performance.now() - startTime;
        console.log(`✅ Comments loaded in ${loadTime.toFixed(1)}ms - ${response.data.comments.length} comments`);
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

  const handleLikeVideo = async (videoId) => {
    try {
      const response = await likeVideo(videoId);

      if (response.success) {
        // Update the video in the local state
        setVideos(prevVideos =>
          prevVideos.map(video =>
            (video._id === videoId || video.id === videoId)
              ? { ...video, likes: response.data.likes, likedBy: response.data.likedBy }
              : video
          )
        );
        message.success(response.message || "Video liked successfully!");
      } else {
        message.error(response.message || "Failed to like video");
      }
    } catch (error) {
      console.error("Error liking video:", error);
      message.error("Failed to like video");
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

  // Render loading state
  const renderLoadingState = () => (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>{isKiswahili ? 'Inapakia video...' : 'Loading videos...'}</p>
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="error-state">
      <TbAlertTriangle className="error-icon" />
      <h3>{isKiswahili ? 'Hitilafu ya Kupakia Video' : 'Error Loading Videos'}</h3>
      <p>{error}</p>
      <button onClick={fetchVideos} className="retry-btn">
        {isKiswahili ? 'Jaribu Tena' : 'Try Again'}
      </button>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="empty-state">
      <FaGraduationCap className="empty-icon" />
      <h3>{isKiswahili ? 'Hakuna Video Zilizopatikana' : 'No Videos Found'}</h3>
      <p>{isKiswahili ? 'Hakuna masomo ya video yanayopatikana kwa uchaguzi wako wa sasa.' : 'No video lessons are available for your current selection.'}</p>
      <p className="suggestion">{isKiswahili ? 'Jaribu kuchagua darasa au somo tofauti.' : 'Try selecting a different class or subject.'}</p>
    </div>
  );

  return (
    <div className="video-lessons-container">
      {/* Header removed - using ProtectedRoute header only */}

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

        {/* Main Content Area */}
        {loading && renderLoadingState()}
        {!loading && error && renderErrorState()}
        {!loading && !error && (
          <>
            {/* Top Pagination Controls */}
            {totalVideos > 0 && (
              <div className="pagination-container pagination-top">
                <div className="pagination-controls" style={{ gap: 0, flexWrap: 'nowrap' }}>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      minWidth: window.innerWidth <= 320 ? '28px' : window.innerWidth <= 375 ? '30px' : window.innerWidth <= 425 ? '32px' : '40px',
                      padding: window.innerWidth <= 320 ? '0.3rem 0.4rem' : window.innerWidth <= 375 ? '0.35rem 0.45rem' : window.innerWidth <= 425 ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
                      fontSize: window.innerWidth <= 320 ? '0.7rem' : window.innerWidth <= 375 ? '0.72rem' : window.innerWidth <= 425 ? '0.75rem' : '0.8rem',
                      margin: 0
                    }}
                  >
                    Previous
                  </button>

                  {(() => {
                    // Show only 3 page numbers on small screens, 5 on larger screens
                    const maxButtons = window.innerWidth <= 425 ? 3 : 5;
                    let startPage, endPage;

                    if (totalPages <= maxButtons) {
                      startPage = 1;
                      endPage = totalPages;
                    } else {
                      const halfButtons = Math.floor(maxButtons / 2);

                      if (currentPage <= halfButtons + 1) {
                        startPage = 1;
                        endPage = maxButtons;
                      } else if (currentPage >= totalPages - halfButtons) {
                        startPage = totalPages - maxButtons + 1;
                        endPage = totalPages;
                      } else {
                        startPage = currentPage - halfButtons;
                        endPage = currentPage + halfButtons;
                      }
                    }

                    return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                      const pageNum = startPage + i;
                      return (
                        <button
                          key={pageNum}
                          className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                          style={{
                            minWidth: window.innerWidth <= 320 ? '28px' : window.innerWidth <= 375 ? '30px' : window.innerWidth <= 425 ? '32px' : '40px',
                            padding: window.innerWidth <= 320 ? '0.3rem 0.4rem' : window.innerWidth <= 375 ? '0.35rem 0.45rem' : window.innerWidth <= 425 ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
                            fontSize: window.innerWidth <= 320 ? '0.7rem' : window.innerWidth <= 375 ? '0.72rem' : window.innerWidth <= 425 ? '0.75rem' : '0.8rem',
                            margin: 0
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    });
                  })()}

                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      minWidth: window.innerWidth <= 320 ? '28px' : window.innerWidth <= 375 ? '30px' : window.innerWidth <= 425 ? '32px' : '40px',
                      padding: window.innerWidth <= 320 ? '0.3rem 0.4rem' : window.innerWidth <= 375 ? '0.35rem 0.45rem' : window.innerWidth <= 425 ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
                      fontSize: window.innerWidth <= 320 ? '0.7rem' : window.innerWidth <= 375 ? '0.72rem' : window.innerWidth <= 425 ? '0.75rem' : '0.8rem',
                      margin: 0
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            <VideoGrid
              paginatedVideos={paginatedVideos}
              currentVideoIndex={currentVideoIndex}
              handleShowVideo={handleShowVideo}
              getThumbnailUrl={getThumbnailUrl}
              getSubjectName={getSubjectName}
              selectedLevel={selectedLevel}
              isKiswahili={isKiswahili}
              setVideoRef={setVideoRef}
              setVideoError={setVideoError}
              videoError={videoError}
              setCurrentVideoIndex={setCurrentVideoIndex}
              commentsExpanded={commentsExpanded}
              setCommentsExpanded={setCommentsExpanded}
              getCurrentVideoComments={getCurrentVideoComments}
              newComment={newComment}
              setNewComment={setNewComment}
              handleAddComment={handleAddComment}
              handleLikeComment={handleLikeComment}
              handleDeleteComment={handleDeleteComment}
              formatTimeAgo={formatTimeAgo}
              user={user}
              handleLikeVideo={handleLikeVideo}
            />



    {/* Pagination Controls */}
    {totalVideos > 0 && (
      <div className="pagination-container">
        <div className="pagination-controls" style={{ gap: 0, flexWrap: 'nowrap' }}>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              minWidth: window.innerWidth <= 320 ? '28px' : window.innerWidth <= 375 ? '30px' : window.innerWidth <= 425 ? '32px' : '40px',
              padding: window.innerWidth <= 320 ? '0.3rem 0.4rem' : window.innerWidth <= 375 ? '0.35rem 0.45rem' : window.innerWidth <= 425 ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
              fontSize: window.innerWidth <= 320 ? '0.7rem' : window.innerWidth <= 375 ? '0.72rem' : window.innerWidth <= 425 ? '0.75rem' : '0.8rem',
              margin: 0
            }}
          >
            Previous
          </button>

          {(() => {
            // Show only 3 page numbers on small screens, 5 on larger screens
            const maxButtons = window.innerWidth <= 425 ? 3 : 5;
            let startPage, endPage;

            if (totalPages <= maxButtons) {
              startPage = 1;
              endPage = totalPages;
            } else {
              const halfButtons = Math.floor(maxButtons / 2);

              if (currentPage <= halfButtons + 1) {
                startPage = 1;
                endPage = maxButtons;
              } else if (currentPage >= totalPages - halfButtons) {
                startPage = totalPages - maxButtons + 1;
                endPage = totalPages;
              } else {
                startPage = currentPage - halfButtons;
                endPage = currentPage + halfButtons;
              }
            }

            return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
              const pageNum = startPage + i;
              return (
                <button
                  key={pageNum}
                  className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                  style={{
                    minWidth: window.innerWidth <= 320 ? '28px' : window.innerWidth <= 375 ? '30px' : window.innerWidth <= 425 ? '32px' : '40px',
                    padding: window.innerWidth <= 320 ? '0.3rem 0.4rem' : window.innerWidth <= 375 ? '0.35rem 0.45rem' : window.innerWidth <= 425 ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
                    fontSize: window.innerWidth <= 320 ? '0.7rem' : window.innerWidth <= 375 ? '0.72rem' : window.innerWidth <= 425 ? '0.75rem' : '0.8rem',
                    margin: 0
                  }}
                >
                  {pageNum}
                </button>
              );
            });
          })()}

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              minWidth: window.innerWidth <= 320 ? '28px' : window.innerWidth <= 375 ? '30px' : window.innerWidth <= 425 ? '32px' : '40px',
              padding: window.innerWidth <= 320 ? '0.3rem 0.4rem' : window.innerWidth <= 375 ? '0.35rem 0.45rem' : window.innerWidth <= 425 ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
              fontSize: window.innerWidth <= 320 ? '0.7rem' : window.innerWidth <= 375 ? '0.72rem' : window.innerWidth <= 425 ? '0.75rem' : '0.8rem',
              margin: 0
            }}
          >
            Next
          </button>
        </div>
      </div>
    )}
  </>
)}
</div>
</div>
);
}

export default VideoLessons;

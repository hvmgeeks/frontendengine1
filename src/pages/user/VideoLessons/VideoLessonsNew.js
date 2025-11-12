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

  // Optimized video fetching - load videos immediately, comments on demand
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      dispatch(ShowLoading());

      const startTime = performance.now();
      console.log('🚀 Starting video fetch (New)...');

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

        const loadTime = performance.now() - startTime;
        console.log(`✅ Videos loaded in ${loadTime.toFixed(1)}ms - ${videoData.length} videos (New)`);

        // Don't load all comments immediately - load on demand for better performance
        console.log('📹 Videos ready for display - comments will load on demand (New)');
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

export default VideoLessons;

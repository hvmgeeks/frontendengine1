import React, { useState, useEffect } from 'react';
import { FaPlayCircle, FaGraduationCap, FaDownload, FaCheckCircle, FaTrash } from 'react-icons/fa';
import { TbInfoCircle } from 'react-icons/tb';
import { MdVerified } from 'react-icons/md';
import { Avatar, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import {
  downloadVideoForOffline,
  isVideoDownloaded,
  deleteOfflineVideo,
  getOfflineVideo
} from '../../../utils/offlineVideo';

const VideoGrid = ({
  paginatedVideos,
  currentVideoIndex,
  handleShowVideo,
  getThumbnailUrl,
  getSubjectName,
  selectedLevel,
  isKiswahili,
  setVideoRef,
  setVideoError,
  videoError,
  setCurrentVideoIndex,
  commentsExpanded,
  setCommentsExpanded,
  getCurrentVideoComments,
  newComment,
  setNewComment,
  handleAddComment,
  handleLikeComment,
  handleDeleteComment,
  formatTimeAgo,
  user,
  handleLikeVideo
}) => {
  // Mobile detection state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  // Download states
  const [downloadedVideos, setDownloadedVideos] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [downloading, setDownloading] = useState({});
  const [offlineVideoUrls, setOfflineVideoUrls] = useState({}); // Store offline blob URLs

  // Update mobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check which videos are downloaded and load offline URLs
  useEffect(() => {
    const checkDownloadedVideos = async () => {
      const downloaded = {};
      const offlineUrls = {};

      for (const video of paginatedVideos) {
        if (video.videoUrl) {
          const isDownloaded = await isVideoDownloaded(video.videoUrl);
          downloaded[video.videoUrl] = isDownloaded;

          // If downloaded, get the offline blob URL
          if (isDownloaded) {
            try {
              const offlineUrl = await getOfflineVideo(video.videoUrl);
              if (offlineUrl) {
                offlineUrls[video.videoUrl] = offlineUrl;
                console.log('✅ Loaded offline video:', video.title);
              }
            } catch (error) {
              console.error('Failed to load offline video:', error);
            }
          }
        }
      }

      setDownloadedVideos(downloaded);
      setOfflineVideoUrls(offlineUrls);
    };

    checkDownloadedVideos();
  }, [paginatedVideos]);

  // Handle video download
  const handleDownloadVideo = async (video) => {
    if (!video.videoUrl) {
      message.error('Video URL not available');
      return;
    }

    // Check if already downloaded
    if (downloadedVideos[video.videoUrl]) {
      message.info('Video already downloaded for offline viewing');
      return;
    }

    setDownloading(prev => ({ ...prev, [video.videoUrl]: true }));
    setDownloadProgress(prev => ({ ...prev, [video.videoUrl]: 0 }));

    try {
      await downloadVideoForOffline(
        video.videoUrl,
        video.title,
        (progress) => {
          setDownloadProgress(prev => ({ ...prev, [video.videoUrl]: progress }));
        },
        () => {
          message.success(`${video.title} downloaded for offline viewing!`);
          setDownloadedVideos(prev => ({ ...prev, [video.videoUrl]: true }));
          setDownloading(prev => ({ ...prev, [video.videoUrl]: false }));
          setDownloadProgress(prev => ({ ...prev, [video.videoUrl]: 0 }));

          // Reload offline blob URL
          getOfflineVideo(video.videoUrl).then(offlineUrl => {
            if (offlineUrl) {
              setOfflineVideoUrls(prev => ({ ...prev, [video.videoUrl]: offlineUrl }));
            }
          });
        },
        (error) => {
          message.error(`Download failed: ${error}`);
          setDownloading(prev => ({ ...prev, [video.videoUrl]: false }));
          setDownloadProgress(prev => ({ ...prev, [video.videoUrl]: 0 }));
        },
        video // Pass complete video details for offline storage
      );
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Handle delete offline video
  const handleDeleteOfflineVideo = async (video) => {
    try {
      await deleteOfflineVideo(video.videoUrl);
      setDownloadedVideos(prev => ({ ...prev, [video.videoUrl]: false }));
      message.success('Offline video deleted');
    } catch (error) {
      message.error('Failed to delete offline video');
    }
  };
  return (
    <div className="videos-grid">
      {paginatedVideos.length > 0 ? (
        <>
          {paginatedVideos.map((video, index) => (
            <React.Fragment key={index}>
              <div className="video-item">
                <div className="video-card">
                  {/* Show thumbnail only if this video is NOT currently playing */}
                  {currentVideoIndex !== index ? (
                    <div onClick={() => handleShowVideo(index)}>
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
                                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNEE5MEUyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJyYWlud2F2ZSBWaWRlbzwvdGV4dD48L3N2Zz4='
                              ];

                              const currentSrc = e.target.src;
                              const currentIndex = fallbacks.findIndex(url => currentSrc.includes(url.split('/').pop()));

                              if (currentIndex < fallbacks.length - 1) {
                                e.target.src = fallbacks[currentIndex + 1];
                              }
                            } else {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNEE5MEUyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJyYWlud2F2ZSBWaWRlbzwvdGV4dD48L3N2Zz4=';
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
                  ) : (
                    /* Show video player in place of thumbnail when this video is playing */
                  <div className="inline-video-player">
                    {video.videoUrl ? (
                      <video
                        ref={(ref) => setVideoRef(ref)}
                        controls
                        autoPlay
                        playsInline
                        preload="metadata"
                        width="100%"
                        height="100%"
                        poster={getThumbnailUrl(video)}
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#000',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          setVideoError(`Failed to load video: ${video.title}. Please try refreshing the page.`);
                        }}
                        onCanPlay={() => {
                          setVideoError(null);
                        }}
                        crossOrigin="anonymous"
                      >
                        {/* Use offline video URL if available, otherwise use signed/original URL */}
                        <source
                          src={offlineVideoUrls[video.videoUrl] || video.signedVideoUrl || video.videoUrl}
                          type="video/mp4"
                        />
                        {video.subtitles && video.subtitles.length > 0 && video.subtitles.map((subtitle, subIndex) => (
                          <track
                            key={`${subtitle.language}-${subIndex}`}
                            kind="subtitles"
                            src={subtitle.url}
                            srcLang={subtitle.language}
                            label={subtitle.languageName}
                            default={subtitle.isDefault || subIndex === 0}
                          />
                        ))}
                        Your browser does not support the video tag.
                      </video>
                    ) : video.videoID ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${video.videoID}?autoplay=1&rel=0`}
                        title={video.title}
                        frameBorder="0"
                        allowFullScreen
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          border: 'none'
                        }}
                      ></iframe>
                    ) : (
                      <div className="video-error">
                        <div className="error-icon">⚠️</div>
                        <h3>Video Unavailable</h3>
                        <p>{videoError || "This video cannot be played at the moment."}</p>
                      </div>
                    )}
                    
                    {/* Horizontal Action Buttons */}
                    <div className="youtube-video-actions-horizontal">
                      <button
                        className={`youtube-action-btn-small ${commentsExpanded ? 'active' : ''}`}
                        onClick={() => setCommentsExpanded(!commentsExpanded)}
                      >
                        💬 Comments ({getCurrentVideoComments().length})
                      </button>
                      <button
                        className={`youtube-action-btn-small ${video.likedBy?.includes(user?._id) ? 'liked' : ''}`}
                        onClick={() => handleLikeVideo(video._id || video.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{video.likedBy?.includes(user?._id) ? '👍' : '👍'}</span>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#ffffff',
                          backgroundColor: '#000000',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          minWidth: '30px',
                          textAlign: 'center'
                        }}>
                          {video.likes || 0}
                        </span>
                      </button>

                      {/* Download Button for Offline Viewing */}
                      {video.videoUrl && !video.videoUrl.includes('youtube.com') && !video.videoUrl.includes('youtu.be') && (
                        <>
                          {downloadedVideos[video.videoUrl] ? (
                            <button
                              className="youtube-action-btn-small downloaded-btn"
                              onClick={() => handleDeleteOfflineVideo(video)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: '#10b981',
                                color: 'white'
                              }}
                            >
                              <FaCheckCircle style={{ fontSize: '14px' }} />
                              <span>Downloaded</span>
                              <FaTrash style={{ fontSize: '12px', marginLeft: '4px', opacity: 0.7 }} />
                            </button>
                          ) : downloading[video.videoUrl] ? (
                            <button
                              className="youtube-action-btn-small downloading-btn"
                              disabled
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                cursor: 'not-allowed'
                              }}
                            >
                              <span>📥 {downloadProgress[video.videoUrl] || 0}%</span>
                            </button>
                          ) : (
                            <button
                              className="youtube-action-btn-small download-btn"
                              onClick={() => handleDownloadVideo(video)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <FaDownload style={{ fontSize: '14px' }} />
                              <span>Download</span>
                            </button>
                          )}
                        </>
                      )}

                      <button
                        className="youtube-action-btn-small close-btn"
                        onClick={() => setCurrentVideoIndex(null)}
                      >
                        ✕ Close
                      </button>
                    </div>

                    {/* Comments Section */}
                    {(commentsExpanded || isMobile) && currentVideoIndex === index && (
                      <div className="youtube-comments-section">
                        <div className="youtube-comments-header">
                          <span>{getCurrentVideoComments().length} Comments</span>
                        </div>

                        {/* Add Comment */}
                        <div className="youtube-comment-input">
                          <div className="youtube-comment-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || "A"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <textarea
                              className="youtube-comment-input-field"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder={isKiswahili ? "Andika maoni yako..." : "Add a comment..."}
                              rows="1"
                              style={{
                                minHeight: '20px',
                                resize: 'none',
                                overflow: 'hidden'
                              }}
                              onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                              }}
                            />
                            {newComment.trim() && (
                              <div className="youtube-comment-actions">
                                <button
                                  className="youtube-comment-btn cancel"
                                  onClick={() => setNewComment('')}
                                >
                                  {isKiswahili ? 'Ghairi' : 'Cancel'}
                                </button>
                                <button
                                  className="youtube-comment-btn submit"
                                  onClick={handleAddComment}
                                  disabled={!newComment.trim()}
                                >
                                  {isKiswahili ? 'Tuma' : 'Comment'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Comments List */}
                        <div className="youtube-comments-list">
                          {getCurrentVideoComments().length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#606060' }}>
                              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                              <p>{isKiswahili ? 'Hakuna maoni bado. Kuwa wa kwanza kushiriki mawazo yako!' : 'No comments yet. Be the first to share your thoughts!'}</p>
                            </div>
                          ) : (
                            getCurrentVideoComments().map((comment) => (
                              <div key={comment._id || comment.id} className="youtube-comment">
                                <Avatar
                                  src={comment.user?.profileImage || comment.avatar}
                                  alt="profile"
                                  size={40}
                                  icon={<UserOutlined />}
                                  style={{
                                    flexShrink: 0,
                                    backgroundColor: !comment.user?.profileImage && !comment.avatar ? '#667eea' : undefined
                                  }}
                                >
                                  {!comment.user?.profileImage && !comment.avatar && (comment.author?.charAt(0)?.toUpperCase() || "A")}
                                </Avatar>
                                <div className="youtube-comment-content">
                                  <div className="youtube-comment-header">
                                    <span className="youtube-comment-author">{comment.author}</span>
                                    {(comment.user?.isAdmin || comment.userRole === 'admin' || comment.isAdmin) && (
                                      <MdVerified style={{ color: '#1d9bf0', fontSize: '12px', marginLeft: '4px' }} title="Verified Admin" />
                                    )}
                                    <span className="youtube-comment-time">
                                      {formatTimeAgo(comment.createdAt || comment.timestamp)}
                                    </span>
                                  </div>
                                  <div className="youtube-comment-text">
                                    {comment.text}
                                  </div>
                                  <div className="youtube-comment-actions">
                                    <button
                                      onClick={() => handleLikeComment(comment._id || comment.id)}
                                      className={`youtube-comment-action ${comment.likedBy?.includes(user?._id) ? 'liked' : ''}`}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}
                                    >
                                      <span style={{ fontSize: '16px' }}>{comment.likedBy?.includes(user?._id) ? '👍' : '👍'}</span>
                                      <span style={{
                                        marginLeft: '2px',
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        color: '#ffffff',
                                        backgroundColor: comment.likedBy?.includes(user?._id) ? 'rgba(59, 130, 246, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        minWidth: '30px',
                                        textAlign: 'center',
                                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
                                      }}>
                                        {comment.likes || 0}
                                      </span>
                                    </button>
                                    <button className="youtube-comment-action">
                                      {isKiswahili ? 'Jibu' : 'Reply'}
                                    </button>
                                    {comment.user === user?._id && (
                                      <button
                                        className="youtube-comment-action"
                                        onClick={() => {
                                          if (window.confirm(isKiswahili ? 'Una uhakika unataka kufuta maoni haya?' : 'Are you sure you want to delete this comment?')) {
                                            handleDeleteComment(comment._id || comment.id);
                                          }
                                        }}
                                      >
                                        {isKiswahili ? 'Futa' : 'Delete'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}
        </>
      ) : (
        <div className="empty-state">
          <FaGraduationCap className="empty-icon" />
          <h3>{isKiswahili ? 'Hakuna Video Zilizopatikana' : 'No Videos Found'}</h3>
          <p>{isKiswahili ? 'Hakuna masomo ya video yanayopatikana kwa uchaguzi wako wa sasa.' : 'No video lessons are available for your current selection.'}</p>
          <p className="suggestion">{isKiswahili ? 'Jaribu kuchagua darasa au somo tofauti.' : 'Try selecting a different class or subject.'}</p>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;

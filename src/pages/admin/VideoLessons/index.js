import React, { useState, useEffect } from 'react';
import { message, Card, Button, Badge, Tooltip, Spin } from 'antd';
import { TbVideo, TbEye, TbCheck, TbX, TbMessageCircle } from 'react-icons/tb';
import { MdVerified } from 'react-icons/md';
import PageTitle from '../../../components/PageTitle';
import { useDispatch } from 'react-redux';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';
import { getVideoComments, approveVideoComment } from '../../../apicalls/videoComments';

const AdminVideoLessons = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedVideos, setExpandedVideos] = useState({});
  const [stats, setStats] = useState({
    totalComments: 0,
    pendingComments: 0,
    approvedComments: 0
  });
  const dispatch = useDispatch();

  // Mock video data - replace with actual API call
  const mockVideos = [
    {
      _id: '1',
      title: 'Introduction to Mathematics',
      subject: 'Mathematics',
      className: '1',
      level: 'Primary',
      comments: [
        {
          _id: 'c1',
          text: 'Great explanation! Very helpful.',
          author: 'John Doe',
          userRole: 'student',
          isApproved: false,
          createdAt: new Date().toISOString(),
          likes: 5,
          replies: []
        },
        {
          _id: 'c2',
          text: 'Could you explain the second part again?',
          author: 'Jane Smith',
          userRole: 'student',
          isApproved: true,
          createdAt: new Date().toISOString(),
          likes: 2,
          replies: [
            {
              id: 'r1',
              text: 'Sure! Let me clarify that for you.',
              author: 'Admin User',
              userRole: 'admin',
              timestamp: new Date().toISOString()
            }
          ]
        }
      ]
    },
    {
      _id: '2',
      title: 'English Grammar Basics',
      subject: 'English',
      className: '2',
      level: 'Primary',
      comments: [
        {
          _id: 'c3',
          text: 'This video helped me understand grammar better.',
          author: 'Mike Johnson',
          userRole: 'student',
          isApproved: false,
          createdAt: new Date().toISOString(),
          likes: 8,
          replies: []
        }
      ]
    }
  ];

  useEffect(() => {
    fetchVideoComments();
  }, []);

  const fetchVideoComments = async () => {
    setLoading(true);
    dispatch(ShowLoading());
    try {
      // TODO: Replace with actual API call
      // const response = await getVideoComments();
      setComments(mockVideos);
      calculateStats(mockVideos);
    } catch (error) {
      message.error('Failed to fetch video comments');
    } finally {
      setLoading(false);
      dispatch(HideLoading());
    }
  };

  const calculateStats = (videosData) => {
    let totalComments = 0;
    let pendingComments = 0;
    let approvedComments = 0;

    videosData.forEach(video => {
      if (video.comments && Array.isArray(video.comments)) {
        totalComments += video.comments.length;
        video.comments.forEach(comment => {
          if (comment.isApproved) {
            approvedComments++;
          } else {
            pendingComments++;
          }
        });
      }
    });

    setStats({
      totalComments,
      pendingComments,
      approvedComments
    });
  };

  const handleApproveComment = async (videoId, commentId, approve) => {
    try {
      // TODO: Replace with actual API call
      // const response = await approveVideoComment(videoId, commentId, approve);
      
      // Update local state
      setComments(prevComments =>
        prevComments.map(video =>
          video._id === videoId
            ? {
                ...video,
                comments: video.comments.map(comment =>
                  comment._id === commentId
                    ? { ...comment, isApproved: approve }
                    : comment
                )
              }
            : video
        )
      );

      message.success(approve ? 'Comment approved successfully' : 'Comment disapproved successfully');
      calculateStats(comments);
    } catch (error) {
      message.error('Failed to update comment status');
    }
  };

  const toggleVideo = (videoId) => {
    setExpandedVideos(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <Card className="text-center">
      <div className={`inline-flex items-center justify-center w-12 h-12 ${bgColor} rounded-lg mb-3`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-gray-600">{title}</p>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <PageTitle title="Video Lessons Management" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Lessons Management</h1>
          <p className="text-gray-600">Manage and approve video lesson comments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Comments"
            value={stats.totalComments}
            icon={TbMessageCircle}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            title="Pending Approval"
            value={stats.pendingComments}
            icon={TbEye}
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
          <StatCard
            title="Approved Comments"
            value={stats.approvedComments}
            icon={TbCheck}
            color="text-green-600"
            bgColor="bg-green-100"
          />
        </div>

        {/* Videos List */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          ) : (
            comments.map((video) => (
              <Card key={video._id} className="shadow-lg">
                <div className="p-6">
                  {/* Video Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <TbVideo className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{video.title}</h3>
                        <p className="text-sm text-gray-500">
                          {video.subject} • {video.level} - Class {video.className}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge count={video.comments.length} showZero>
                        <Button
                          icon={<TbEye />}
                          onClick={() => toggleVideo(video._id)}
                          type={expandedVideos[video._id] ? "primary" : "default"}
                        >
                          {expandedVideos[video._id] ? "Hide" : "View"} Comments
                        </Button>
                      </Badge>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {expandedVideos[video._id] && (
                    <div className="mt-6 space-y-4 bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">
                        Comments ({video.comments.length})
                      </h4>
                      {video.comments.map((comment) => (
                        <div
                          key={comment._id}
                          className="bg-white rounded-lg p-4 border-l-4"
                          style={{
                            borderLeftColor: comment.isApproved ? '#22c55e' : '#f59e0b',
                            backgroundColor: comment.isApproved ? '#f0fdf4' : '#fffbeb'
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {comment.author.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="flex items-center space-x-1">
                                    <h5 className="font-semibold text-gray-900">{comment.author}</h5>
                                    {comment.userRole === 'admin' && (
                                      <MdVerified className="w-4 h-4 text-blue-500" title="Verified Admin" />
                                    )}
                                  </div>
                                  {comment.isApproved ? (
                                    <Badge color="green" text="Approved" />
                                  ) : (
                                    <Badge color="orange" text="Pending" />
                                  )}
                                </div>
                                <p className="text-sm mb-2 text-gray-700">{comment.text}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>{formatTimeAgo(comment.createdAt)}</span>
                                  <span>❤️ {comment.likes}</span>
                                  {comment.replies.length > 0 && (
                                    <span>💬 {comment.replies.length} replies</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Admin Actions */}
                            {comment.userRole !== 'admin' && (
                              <div className="flex space-x-2">
                                <Tooltip title={comment.isApproved ? "Disapprove Comment" : "Approve Comment"}>
                                  <Button
                                    size="small"
                                    type={comment.isApproved ? "danger" : "primary"}
                                    icon={comment.isApproved ? <TbX /> : <TbCheck />}
                                    onClick={() =>
                                      handleApproveComment(
                                        video._id,
                                        comment._id,
                                        !comment.isApproved
                                      )
                                    }
                                  >
                                    {comment.isApproved ? "Disapprove" : "Approve"}
                                  </Button>
                                </Tooltip>
                              </div>
                            )}
                          </div>

                          {/* Replies */}
                          {comment.replies.length > 0 && (
                            <div className="mt-4 ml-8 space-y-2">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="bg-gray-100 rounded-lg p-3">
                                  <div className="flex items-start space-x-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                      {reply.author.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-1 mb-1">
                                        <span className="font-semibold text-sm text-gray-900">{reply.author}</span>
                                        {reply.userRole === 'admin' && (
                                          <MdVerified className="w-3 h-3 text-blue-500" title="Verified Admin" />
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-700">{reply.text}</p>
                                      <span className="text-xs text-gray-500">{formatTimeAgo(reply.timestamp)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {comments.length === 0 && !loading && (
          <div className="text-center py-12">
            <TbVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No video lessons found</h3>
            <p className="text-gray-500">Video lessons with comments will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVideoLessons;

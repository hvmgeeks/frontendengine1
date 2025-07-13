import React, { useState, useEffect } from "react";
import { message, Button, Input, Form, Card, Badge, Tooltip } from "antd";
import PageTitle from "../../../components/PageTitle";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import ProfilePicture from "../../../components/common/ProfilePicture";
import {
  getAllQuestions,
  deleteQuestion,
  updateReplyStatus,
} from "../../../apicalls/forum";
import { FaCheck, FaTimes, FaEye, FaTrash } from "react-icons/fa";
import { MdMessage, MdVerified, MdPending } from "react-icons/md";

const AdminForum = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalReplies: 0,
    pendingReplies: 0,
    verifiedReplies: 0
  });
  const dispatch = useDispatch();

  const fetchQuestions = async () => {
    setLoading(true);
    dispatch(ShowLoading());
    try {
      const response = await getAllQuestions({ page: 1, limit: 100 });
      if (response.success) {
        setQuestions(response.data);
        calculateStats(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
      dispatch(HideLoading());
    }
  };

  const calculateStats = (questionsData) => {
    let totalReplies = 0;
    let pendingReplies = 0;
    let verifiedReplies = 0;

    questionsData.forEach(question => {
      if (question.replies && Array.isArray(question.replies)) {
        totalReplies += question.replies.length;
        question.replies.forEach(reply => {
          if (reply.user && !reply.user.isAdmin) {
            if (reply.isVerified) {
              verifiedReplies++;
            } else {
              pendingReplies++;
            }
          }
        });
      }
    });

    setStats({
      totalQuestions: questionsData.length,
      totalReplies,
      pendingReplies,
      verifiedReplies
    });
  };

  const handleUpdateStatus = async (questionId, replyId, status) => {
    try {
      const response = await updateReplyStatus({
        replyId,
        status: status,
      }, questionId);
      if (response.success) {
        message.success(status ? "Reply approved successfully" : "Reply disapproved successfully");
        fetchQuestions();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      const response = await deleteQuestion(questionId);
      if (response.success) {
        message.success("Question deleted successfully");
        fetchQuestions();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

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
      <PageTitle title="Forum Management" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forum Management</h1>
          <p className="text-gray-600">Manage community questions and verify user replies</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Questions"
            value={stats.totalQuestions}
            icon={MdMessage}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            title="Total Replies"
            value={stats.totalReplies}
            icon={MdMessage}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            title="Pending Approval"
            value={stats.pendingReplies}
            icon={MdPending}
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
          <StatCard
            title="Verified Replies"
            value={stats.verifiedReplies}
            icon={MdVerified}
            color="text-green-600"
            bgColor="bg-green-100"
          />
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {questions.filter(question => question && question.user).map((question) => (
            <Card key={question._id} className="shadow-lg">
              <div className="p-6">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <ProfilePicture
                      user={question.user}
                      size="xs"
                      showOnlineStatus={false}
                      style={{
                        width: '32px',
                        height: '32px'
                      }}
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{question.user?.name || 'Unknown User'}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(question.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge count={question.replies.length} showZero>
                      <Button
                        icon={<FaEye />}
                        onClick={() => toggleQuestion(question._id)}
                        type={expandedQuestions[question._id] ? "primary" : "default"}
                      >
                        {expandedQuestions[question._id] ? "Hide" : "View"} Replies
                      </Button>
                    </Badge>
                    <Button
                      icon={<FaTrash />}
                      danger
                      onClick={() => handleDeleteQuestion(question._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Question Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{question.title}</h3>
                <p className="text-gray-700 mb-4">{question.body}</p>

                {/* Replies Section */}
                {expandedQuestions[question._id] && (
                  <div className="mt-6 space-y-4 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Replies ({question.replies.filter(reply => reply && reply.user).length})
                    </h4>
                    {question.replies.filter(reply => reply && reply.user).map((reply) => (
                      <div
                        key={reply._id}
                        className={`bg-white rounded-lg p-4 border-l-4 ${
                          reply.user?.isAdmin
                            ? "border-purple-500 bg-purple-50"
                            : reply.isVerified
                            ? "border-green-500 bg-green-50"
                            : "border-orange-500 bg-orange-50"
                        }`}
                        style={{
                          backgroundColor: reply.isVerified && !reply.user?.isAdmin
                            ? '#f0fdf4'
                            : reply.user?.isAdmin
                            ? '#faf5ff'
                            : '#fffbeb',
                          borderLeftColor: reply.isVerified && !reply.user?.isAdmin
                            ? '#22c55e'
                            : reply.user?.isAdmin
                            ? '#a855f7'
                            : '#f59e0b',
                          borderLeftWidth: '4px'
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2">
                            <ProfilePicture
                              user={reply.user}
                              size="xs"
                              showOnlineStatus={false}
                              style={{
                                width: '24px',
                                height: '24px'
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-semibold text-gray-900">{reply.user?.name || 'Unknown User'}</h5>
                                {reply.user?.isAdmin && (
                                  <Badge color="purple" text="Admin" />
                                )}
                                {reply.isVerified && !reply.user?.isAdmin && (
                                  <Badge color="green" text="Verified" />
                                )}
                                {!reply.isVerified && !reply.user?.isAdmin && (
                                  <Badge color="orange" text="Pending" />
                                )}
                              </div>
                              <p className={`text-sm mb-2 ${
                                reply.isVerified && !reply.user?.isAdmin
                                  ? 'text-green-800 font-medium'
                                  : reply.user?.isAdmin
                                  ? 'text-purple-800 font-medium'
                                  : 'text-gray-700'
                              }`}>
                                {reply.text}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(() => {
                                  try {
                                    const date = new Date(reply.createdAt);
                                    if (isNaN(date.getTime())) {
                                      return 'Invalid date';
                                    }
                                    return date.toLocaleDateString('en-US', {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    });
                                  } catch (error) {
                                    return 'Invalid date';
                                  }
                                })()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Admin Actions */}
                          {!reply.user?.isAdmin && (
                            <div className="flex space-x-2">
                              <Tooltip title={reply.isVerified ? "Disapprove Reply" : "Approve Reply"}>
                                <Button
                                  size="small"
                                  type={reply.isVerified ? "danger" : "primary"}
                                  icon={reply.isVerified ? <FaTimes /> : <FaCheck />}
                                  onClick={() =>
                                    handleUpdateStatus(
                                      question._id,
                                      reply._id,
                                      !reply.isVerified
                                    )
                                  }
                                >
                                  {reply.isVerified ? "Disapprove" : "Approve"}
                                </Button>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {questions.length === 0 && !loading && (
          <div className="text-center py-12">
            <MdMessage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-500">Questions will appear here when users post them.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminForum;

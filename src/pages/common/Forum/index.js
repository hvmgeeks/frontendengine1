import React, { useState, useEffect, useRef } from "react";
import "./index.css";
import { getUserInfo } from "../../../apicalls/users";
import { message, Button, Input, Form, Avatar, Pagination } from "antd";
import PageTitle from "../../../components/PageTitle";
import { useDispatch, useSelector } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import ProfilePicture from "../../../components/common/ProfilePicture";
import OnlineStatusIndicator from "../../../components/common/OnlineStatusIndicator";
import { useLanguage } from "../../../contexts/LanguageContext";
import { MdVerified } from 'react-icons/md';
import ContentRenderer from "../../../components/ContentRenderer";
import {
  addQuestion,
  addReply,
  getAllQuestions,
  deleteQuestion,
  updateQuestion,
  updateReplyStatus,
} from "../../../apicalls/forum";
import image from "../../../assets/person.png";
import { FaPencilAlt } from "react-icons/fa";
import { MdDelete, MdMessage } from "react-icons/md";
import { FaCheck } from "react-icons/fa";

const Forum = () => {
  const { user } = useSelector((state) => state.user);
  const { t, isKiswahili } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState("");
  const [questions, setQuestions] = useState([]);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [askQuestionVisible, setAskQuestionVisible] = useState(false);
  const [replyQuestionId, setReplyQuestionId] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  const [form] = Form.useForm();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const dispatch = useDispatch();

  // Skeleton loader component
  const ForumSkeleton = () => (
    <div className="forum-container">
      <div className="forum-header">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        <div className="h-10 bg-blue-100 rounded w-32 animate-pulse"></div>
      </div>
      <div className="forum-content">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="question-card mb-4 p-4 border rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-3 animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-full mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  const [form2] = Form.useForm();
  const [replyRefs, setReplyRefs] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Function to clear all forum caches
  const clearAllForumCaches = () => {
    const allLevels = ['primary', 'secondary', 'advance'];
    allLevels.forEach(level => {
      for (let p = 1; p <= 20; p++) { // Clear up to 20 pages
        localStorage.removeItem(`forum_questions_${level}_${p}_${limit}`);
        localStorage.removeItem(`forum_questions_${level}_${p}_${limit}_time`);
      }
    });
  };

  const fetchQuestions = async (page) => {
    try {
      // Clear caches for other levels to prevent contamination
      const userLevel = userData?.level || 'primary';
      const allLevels = ['primary', 'secondary', 'advance'];
      allLevels.forEach(level => {
        if (level !== userLevel) {
          // Clear cache for other levels
          for (let p = 1; p <= 10; p++) { // Clear up to 10 pages
            localStorage.removeItem(`forum_questions_${level}_${p}_${limit}`);
            localStorage.removeItem(`forum_questions_${level}_${p}_${limit}_time`);
          }
        }
      });

      // Check cache first - make it level-specific to prevent cross-level contamination
      const cacheKey = `forum_questions_${userLevel}_${page}_${limit}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}_time`);
      const now = Date.now();

      // Use cache if less than 5 minutes old
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 300000) {
        const cached = JSON.parse(cachedData);
        setQuestions(cached.questions);
        setTotalQuestions(cached.totalQuestions);
        setTotalPages(cached.totalPages);
        return;
      }

      dispatch(ShowLoading());
      const response = await getAllQuestions({ page, limit }); // Pass query params to API call
      if (response.success) {
        console.log(response.data);
        setQuestions(response.data); // No need to reverse as backend will handle order
        setTotalQuestions(response.totalQuestions);
        setTotalPages(response.totalPages);

        // Cache the data with level-specific key
        localStorage.setItem(cacheKey, JSON.stringify({
          questions: response.data,
          totalQuestions: response.totalQuestions,
          totalPages: response.totalPages
        }));
        localStorage.setItem(`${cacheKey}_time`, now.toString());
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(HideLoading());
    }
  };

  useEffect(() => {
    // Clear caches for other levels when component mounts or page changes
    clearAllForumCaches();
    fetchQuestions(currentPage).finally(() => {
      setIsInitialLoad(false);
    });
  }, [currentPage, limit]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getUserData = async () => {
    dispatch(ShowLoading());
    try {
      const response = await getUserInfo();
      if (response.success) {
        if (response.data.isAdmin) {
          setIsAdmin(true);
          setUserData(response.data);
          await fetchQuestions();
        } else {
          setIsAdmin(false);
          setUserData(response.data);
          await fetchQuestions();
        }
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      getUserData();
    }
  }, []);

  const toggleReplies = (questionId) => {
    setExpandedReplies((prevExpandedReplies) => ({
      ...prevExpandedReplies,
      [questionId]: !prevExpandedReplies[questionId],
    }));
  };

  const handleAskQuestion = async (values) => {
    try {
      // Create optimistic question object
      const optimisticQuestion = {
        _id: `temp_${Date.now()}`,
        title: values.title,
        body: values.body,
        user: {
          _id: userData._id,
          name: userData.name,
          email: userData.email
        },
        replies: [],
        createdAt: new Date().toISOString(),
        level: userData.level,
        isOptimistic: true // Flag to identify optimistic updates
      };

      // Add question optimistically to the UI
      setQuestions(prevQuestions => [optimisticQuestion, ...prevQuestions]);

      // Close form and reset immediately
      setAskQuestionVisible(false);
      form.resetFields();
      message.success("Question posted successfully!");

      // Send to server in background
      const response = await addQuestion(values);
      if (response.success) {
        // Replace optimistic question with real one from server
        setQuestions(prevQuestions =>
          prevQuestions.map(q =>
            q._id === optimisticQuestion._id ? response.data : q
          )
        );
        // Clear cache for next refresh
        clearAllForumCaches();
      } else {
        // Remove optimistic question on failure
        setQuestions(prevQuestions =>
          prevQuestions.filter(q => q._id !== optimisticQuestion._id)
        );
        message.error(response.message);
      }
    } catch (error) {
      // Remove optimistic question on error
      setQuestions(prevQuestions =>
        prevQuestions.filter(q => !q.isOptimistic)
      );
      message.error(error.message);
    }
  };



  const handleReply = (questionId) => {
    setReplyQuestionId(questionId);
  };

  const handleReplySubmit = async (values) => {
    try {
      // Create optimistic reply object
      const optimisticReply = {
        _id: `temp_reply_${Date.now()}`,
        text: values.text,
        user: {
          _id: userData._id,
          name: userData.name,
          email: userData.email
        },
        createdAt: new Date().toISOString(),
        level: userData.level,
        isVerified: false,
        isOptimistic: true
      };

      // Add reply optimistically to the UI
      setQuestions(prevQuestions =>
        prevQuestions.map(question =>
          question._id === replyQuestionId
            ? { ...question, replies: [...question.replies, optimisticReply] }
            : question
        )
      );

      // Close reply form immediately
      setReplyQuestionId(null);
      form.resetFields();
      message.success("Reply posted successfully!");

      // Send to server in background
      const payload = {
        questionId: replyQuestionId,
        text: values.text,
      };
      const response = await addReply(payload);
      if (response.success) {
        // Keep the optimistic reply, just clear cache for next refresh
        clearAllForumCaches();
        // No need to refetch all questions, the optimistic reply is already showing
      } else {
        // Remove optimistic reply on failure
        setQuestions(prevQuestions =>
          prevQuestions.map(question =>
            question._id === replyQuestionId
              ? {
                  ...question,
                  replies: question.replies.filter(reply => reply._id !== optimisticReply._id)
                }
              : question
          )
        );
        message.error(response.message);
      }
    } catch (error) {
      // Remove optimistic replies on error
      setQuestions(prevQuestions =>
        prevQuestions.map(question => ({
          ...question,
          replies: question.replies.filter(reply => !reply.isOptimistic)
        }))
      );
      message.error(error.message);
    }
  };

  useEffect(() => {
    if (replyQuestionId && !replyRefs[replyQuestionId]) {
      setReplyRefs((prevRefs) => ({
        ...prevRefs,
        [replyQuestionId]: React.createRef(),
      }));
    }
  }, [replyQuestionId, replyRefs]);

  useEffect(() => {
    if (replyQuestionId && replyRefs[replyQuestionId]) {
      replyRefs[replyQuestionId].current.scrollIntoView({ behavior: "smooth" });
    }
  }, [replyQuestionId, replyRefs]);

  const handleEdit = (question) => {
    setEditQuestion(question);
  };

  const handleDelete = async (question) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this question?"
      );
      if (!confirmDelete) {
        return;
      }
      const response = await deleteQuestion(question._id);
      if (response.success) {
        message.success(response.message);
        clearAllForumCaches(); // Clear cache when question is deleted
        await fetchQuestions();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleUpdateQuestion = async (values) => {
    try {
      const response = await updateQuestion(values, editQuestion._id);
      if (response.success) {
        message.success(response.message);
        setEditQuestion(null);
        clearAllForumCaches(); // Clear cache when question is updated
        await fetchQuestions();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleCancelUpdate = () => {
    setEditQuestion("");
  };
  const handleCancelAdd = () => {
    setAskQuestionVisible(false);
    form.resetFields();
  };

  useEffect(() => {
    if (editQuestion) {
      form2.setFieldsValue({
        title: editQuestion.title,
        body: editQuestion.body,
      });
    } else {
      form2.resetFields();
    }
  }, [editQuestion]);

  const handleUpdateStatus = async (questionId, replyId, status) => {
    try {
      const response = await updateReplyStatus({ replyId, status }, questionId);
      if (response.success) {
        message.success(response.message);
        clearAllForumCaches(); // Clear cache when reply status is updated
        await fetchQuestions();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  // Show skeleton on initial load
  if (isInitialLoad && questions.length === 0) {
    return <ForumSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" style={{ scrollBehavior: 'smooth' }}>
      <div className="Forum max-w-4xl mx-auto" style={{ scrollBehavior: 'smooth' }}>
        {/* Modern Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Community Forum
                </h1>
                <p className="text-gray-600 mt-1">
                  Connect, learn, and grow together
                </p>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">{questions.length} discussions</span>
              </div>
            </div>
          </div>

          {/* Ask Question Button */}
          <button
            onClick={() => setAskQuestionVisible(true)}
            className="inline-flex items-center px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
          >
            <i className="ri-add-line text-lg sm:text-xl mr-2"></i>
            Ask a Question
          </button>
        </div>

        {/* Modern Ask Question Form */}
        {askQuestionVisible && (
          <div className="bg-white rounded-2xl shadow-xl mx-4 sm:mx-6 lg:mx-8 mb-8 border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">Ask a Question</h2>
                </div>
                <button
                  onClick={() => setAskQuestionVisible(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <Form form={form} onFinish={handleAskQuestion} layout="vertical" className="modern-form">
              <Form.Item
                name="title"
                label="Question Title"
                rules={[{ required: true, message: "Please enter a descriptive title" }]}
              >
                <Input
                  placeholder="What would you like to know?"
                  className="h-12 text-lg"
                />
              </Form.Item>
              <Form.Item
                name="body"
                label="Question Details"
                rules={[{ required: true, message: "Please provide more details about your question" }]}
              >
                <div className="space-y-3">
                  <Input.TextArea
                    rows={6}
                    placeholder="Describe your question in detail. For math formulas, use LaTeX: \\(x^2 + y^2 = z^2\\) for inline or \\[E = mc^2\\] for block equations"
                    className="text-base"
                  />

                  {/* Math Formula Help */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">📐 Mathematical Formula Support</h4>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p><strong>Inline math:</strong> \\(x^2 + 3x + 2\\) - Use \\(...\\)</p>
                      <p><strong>Block math:</strong> \\[E = mc^2\\] - Use \\[...\\]</p>
                      <p><strong>Examples:</strong> \\(\\frac&#123;a&#125;&#123;b&#125;\\) (fraction), \\(\\sqrt&#123;x&#125;\\) (square root), \\(x^2\\) (superscript), \\(x_&#123;sub&#125;\\) (subscript)</p>
                    </div>
                  </div>
                </div>
              </Form.Item>
              <Form.Item className="mb-0">
                <div className="flex items-center space-x-4">
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 border-none rounded-lg font-semibold text-base"
                  >
                    <i className="ri-send-plane-line mr-2"></i>
                    Post Question
                  </Button>
                  <Button
                    onClick={handleCancelAdd}
                    className="h-12 px-6 border-gray-300 rounded-lg font-semibold text-base hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </Form.Item>
              </Form>
            </div>
          </div>
        )}

        {/* Loading State */}
        {questions.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <i className="ri-loader-4-line text-2xl text-gray-400 animate-spin"></i>
            </div>
            <p className="text-gray-500">Loading discussions...</p>
          </div>
        )}

        {/* Questions Grid */}
        <div className="grid gap-6 mx-4 sm:mx-6 lg:mx-8 pb-8">
          {questions.filter(question => question && question.user).map((question) => (
            <div key={question._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
              {/* Question Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="relative">
                      <ProfilePicture
                        user={question.user}
                        size="sm"
                        showOnlineStatus={false}
                        style={{
                          width: '32px',
                          height: '32px'
                        }}
                      />
                      {/* Only show online dot if user exists and is actually online */}
                      {question.user && question.user.isOnline && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '12px',
                            height: '12px',
                            backgroundColor: '#22c55e',
                            borderRadius: '50%',
                            border: '2px solid #ffffff',
                            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.6)',
                            zIndex: 10
                          }}
                          title="Online"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{question.user?.name || 'Unknown User'}</h4>
                        {(question.user?.role === 'admin' || question.user?.isAdmin) && (
                          <MdVerified className="w-4 h-4 text-blue-500 flex-shrink-0" title="Verified Admin" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {new Date(question.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                    {(userData._id === question.user?._id || userData.isAdmin) && (
                      <>
                        <button
                          onClick={() => handleEdit(question)}
                          className="flex items-center px-2 py-2 sm:px-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <FaPencilAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(question)}
                          className="flex items-center px-2 py-2 sm:px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <MdDelete className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 leading-tight">
                  <ContentRenderer text={question.title} />
                </h3>
                <div className="text-gray-700 leading-relaxed mb-6">
                  <ContentRenderer text={question.body} />
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleReplies(question._id)}
                      className="flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.291-4.678l-.709 2.122a.5.5 0 01-.948-.316L4.82 13.5a.5.5 0 01.316-.948l3.628.732a.5.5 0 01.316.948l-2.122-.709A8 8 0 1021 12z" />
                      </svg>
                      {question.replies?.length || 0} Replies
                    </button>
                    <button
                      onClick={() => handleReply(question._id)}
                      className="flex items-center px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 text-sm"
                    >
                      <i className="ri-reply-line mr-1 sm:mr-2 text-sm sm:text-base"></i>
                      Reply
                    </button>
                  </div>

                  <div className="flex items-center px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-50 rounded-lg self-start sm:self-auto">
                    <MdMessage className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{question.replies.length}</span>
                  </div>
                </div>
              </div>

              {/* Edit Question Form */}
              {editQuestion && editQuestion._id === question._id && (
                <Form
                form={form2}
                onFinish={handleUpdateQuestion}
                layout="vertical"
                initialValues={{
                  title: editQuestion.title,
                  body: editQuestion.body,
                }}
              >
                <Form.Item
                  name="title"
                  label="Title"
                  rules={[
                    { required: true, message: "Please enter the title" },
                  ]}
                >
                  <Input style={{ padding: "18px 12px" }} />
                </Form.Item>
                <Form.Item
                  name="body"
                  label="Body"
                  rules={[{ required: true, message: "Please enter the body" }]}
                >
                  <Input.TextArea />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Update Question
                  </Button>
                  <Button
                    onClick={handleCancelUpdate}
                    style={{ marginLeft: 10 }}
                  >
                    Cancel
                  </Button>
                </Form.Item>
              </Form>
              )}
            {expandedReplies[question._id] && (
              <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                  <i className="ri-chat-3-line mr-2 text-blue-600 text-sm sm:text-base"></i>
                  Replies ({question.replies.filter(reply => reply && reply.user).length})
                </h4>
                {question.replies.filter(reply => reply && reply.user).map((reply, index) => (
                  <div
                    key={reply._id}
                    className={`bg-white rounded-lg p-3 sm:p-4 shadow-sm border-l-4 ${
                      reply.user?.isAdmin
                        ? "border-purple-500 bg-purple-50"
                        : reply.isVerified
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      {/* Avatar with Online Status */}
                      <div className="flex-shrink-0 relative">
                        <ProfilePicture
                          user={reply.user}
                          size="xs"
                          showOnlineStatus={false}
                          style={{
                            width: '20px',
                            height: '20px'
                          }}
                          className="sm:w-6 sm:h-6"
                        />
                        {/* Only show online dot if user exists and is actually online */}
                        {reply.user && reply.user.isOnline && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '-1px',
                              right: '-1px',
                              width: '6px',
                              height: '6px',
                              backgroundColor: '#22c55e',
                              borderRadius: '50%',
                              border: '1px solid #ffffff',
                              boxShadow: '0 1px 4px rgba(34, 197, 94, 0.6)',
                              zIndex: 10
                            }}
                            className="sm:w-2 sm:h-2"
                            title="Online"
                          />
                        )}
                      </div>

                      {/* Reply Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start sm:items-center justify-between mb-2 gap-2">
                          <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
                            <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{reply.user?.name || 'Unknown User'}</h5>
                            {(reply.user?.role === 'admin' || reply.user?.isAdmin) && (
                              <MdVerified className="w-4 h-4 text-blue-500 flex-shrink-0" title="Verified Admin" />
                            )}
                            {reply.user?.isAdmin && (
                              <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full whitespace-nowrap">
                                Admin
                              </span>
                            )}
                            {reply.isVerified && !reply.user?.isAdmin && (
                              <div className="flex items-center space-x-1">
                                <FaCheck className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full whitespace-nowrap">
                                  Verified
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
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
                          </span>
                        </div>

                        {/* Reply Text */}
                        <div
                          className={`leading-relaxed mb-3 text-sm sm:text-base ${
                            reply.isVerified && !reply.user?.isAdmin
                              ? 'text-green-800 font-medium'
                              : reply.user?.isAdmin
                              ? 'text-purple-800 font-medium'
                              : 'text-gray-700'
                          }`}
                          style={{
                            backgroundColor: reply.isVerified && !reply.user?.isAdmin
                              ? '#dcfce7'
                              : reply.user?.isAdmin
                              ? '#f3e8ff'
                              : 'transparent',
                            padding: reply.isVerified || reply.user?.isAdmin ? '8px 12px' : '0',
                            borderRadius: reply.isVerified || reply.user?.isAdmin ? '8px' : '0',
                            border: reply.isVerified && !reply.user?.isAdmin
                              ? '1px solid #22c55e'
                              : reply.user?.isAdmin
                              ? '1px solid #a855f7'
                              : 'none'
                          }}
                        >
                          {reply.text}
                        </div>

                        {/* Admin Actions */}
                        {isAdmin && !reply.user?.isAdmin && (
                          <div className="flex justify-end">
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  question._id,
                                  reply._id,
                                  !reply.isVerified
                                )
                              }
                              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 ${
                                reply.isVerified
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-green-100 text-green-700 hover:bg-green-200"
                              }`}
                            >
                              {reply.isVerified ? "Disapprove" : "Approve"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div ref={replyRefs[question._id]} className="mt-4 sm:mt-6">
              {replyQuestionId === question._id && (
                <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
                  <Form
                    form={form}
                    onFinish={handleReplySubmit}
                    layout="vertical"
                  >
                    <Form.Item
                      name="text"
                      label={<span className="text-sm sm:text-base font-medium">Your Reply</span>}
                      rules={[
                        { required: true, message: "Please enter your reply" },
                      ]}
                    >
                      <Input.TextArea
                        rows={3}
                        className="text-sm sm:text-base"
                        placeholder="Write your reply here..."
                      />
                    </Form.Item>
                    <Form.Item className="mb-0">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button
                          type="primary"
                          htmlType="submit"
                          className="w-full sm:w-auto"
                          size="large"
                        >
                          Submit Reply
                        </Button>
                        <Button
                          onClick={() => setReplyQuestionId(null)}
                          className="w-full sm:w-auto"
                          size="large"
                        >
                          Cancel
                        </Button>
                      </div>
                    </Form.Item>
                  </Form>
                </div>
              )}
            </div>
            </div>
          ))}

        </div>

        <Pagination
          current={currentPage}
          total={totalQuestions}
          pageSize={limit}
          onChange={handlePageChange}
          style={{ marginTop: "20px", textAlign: "center" }}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default Forum;

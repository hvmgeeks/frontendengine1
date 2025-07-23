import React, { useState, useEffect, useRef } from "react";
import './index.css';
import { getUserInfo } from "../../../apicalls/users";
import { message, Button, Input, Form, Avatar, Badge, Tag } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { addQuestion, addReply, getAllQuestions } from "../../../apicalls/forum";
import image from '../../../assets/person.png';
import { PlusOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons';

const Forum = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [userData, setUserData] = useState('');
    const [questions, setQuestions] = useState([]);
    const [askQuestionVisible, setAskQuestionVisible] = useState(false);
    const [replyQuestionId, setReplyQuestionId] = useState(null);
    const [form] = Form.useForm();
    const dispatch = useDispatch();


    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [questionsPerPage] = useState(5);
    const [totalQuestions, setTotalQuestions] = useState(0);

    const fetchQuestions = async (page = currentPage) => {
        try {
            dispatch(ShowLoading());
            const response = await getAllQuestions({ page, limit: questionsPerPage });
            if (response.success) {
                // Sort by creation date (newest first) instead of reversing
                const sortedQuestions = response.data.sort((a, b) =>
                    new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id)
                );
                setQuestions(sortedQuestions);
                setTotalQuestions(response.totalQuestions || response.data.length);
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        } finally {
            dispatch(HideLoading());
        }
    };

    const getUserData = async () => {
        try {
            dispatch(ShowLoading());
            const response = await getUserInfo();
            if (response.success) {
                if (response.data.isAdmin) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                    setUserData(response.data);
                    // fetchQuestions will be called by useEffect when userData changes
                }
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
        if (localStorage.getItem("token")) {
            getUserData();
        }
    }, []);

    // Fetch questions when component mounts or page changes
    useEffect(() => {
        if (!isAdmin && userData) {
            fetchQuestions(currentPage);
        }
    }, [currentPage, isAdmin, userData]);



    const handleAskQuestion = async (values) => {
        try {
            dispatch(ShowLoading());
            const response = await addQuestion(values);
            if (response.success) {
                message.success(response.message);
                setAskQuestionVisible(false);
                form.resetFields();
                // Reset to first page to see the new question
                setCurrentPage(1);
                await fetchQuestions(1);
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        } finally {
            dispatch(HideLoading());
        }
    };

    const handleReply = (questionId) => {
        // Toggle reply form - if already open for this question, close it
        if (replyQuestionId === questionId) {
            setReplyQuestionId(null);
            form.resetFields();
        } else {
            setReplyQuestionId(questionId);
            form.resetFields();
            // Scroll to the reply form after it's rendered
            setTimeout(() => {
                const replyElement = document.getElementById(`reply-form-${questionId}`);
                if (replyElement) {
                    replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    };

    const handleReplySubmit = async (values) => {
        try {
            dispatch(ShowLoading());
            const payload = {
                questionId: replyQuestionId,
                text: values.text
            };
            const response = await addReply(payload);
            if (response.success) {
                message.success(response.message);
                setReplyQuestionId(null);
                form.resetFields();
                // Refresh current page to show the new reply
                await fetchQuestions(currentPage);
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        } finally {
            dispatch(HideLoading());
        }
    };



    // Pagination calculations - use all questions since we're fetching by page
    const totalPages = Math.ceil(totalQuestions / questionsPerPage);
    const startItem = (currentPage - 1) * questionsPerPage + 1;
    const endItem = Math.min(currentPage * questionsPerPage, totalQuestions);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchQuestions(page);
    };

    // Extract date from MongoDB ObjectId as fallback
    const extractDateFromObjectId = (objectId) => {
        if (!objectId || typeof objectId !== 'string') return null;
        try {
            // MongoDB ObjectId first 4 bytes represent timestamp
            const timestamp = parseInt(objectId.substring(0, 8), 16) * 1000;
            return new Date(timestamp);
        } catch (error) {
            return null;
        }
    };

    // Format date and time
    const formatDateTime = (dateString) => {
        if (!dateString) return 'Just now';

        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Just now';
        }

        const now = new Date();
        const diffInMinutes = (now - date) / (1000 * 60);
        const diffInHours = diffInMinutes / 60;
        const diffInDays = diffInHours / 24;

        // Less than 1 minute
        if (diffInMinutes < 1) {
            return 'Just now';
        }
        // Less than 1 hour
        else if (diffInMinutes < 60) {
            return `${Math.floor(diffInMinutes)}m ago`;
        }
        // Less than 24 hours
        else if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
        // Less than 7 days
        else if (diffInDays < 7) {
            return `${Math.floor(diffInDays)}d ago`;
        }
        // More than 7 days
        else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    // Format user class based on level
    const formatUserClass = (userClass, userLevel) => {
        if (!userClass) return 'N/A';

        switch (userLevel) {
            case 'primary':
                return `Class ${userClass}`;
            case 'primary_kiswahili':
                return `Darasa la ${userClass}`;
            case 'secondary':
                return userClass.toString().startsWith('Form') ? userClass : `Form ${userClass}`;
            case 'advance':
                return userClass.toString().startsWith('Form') ? userClass : `Form ${userClass}`;
            default:
                return userClass.toString();
        }
    };

    return (
        <div>
            {!isAdmin && (
                <div className="modern-forum">
                    {/* Header Section */}
                    <div className="forum-header">
                        <div className="forum-header-content">
                            <h1 className="forum-title">Community Forum</h1>
                            <p className="forum-description">
                                Connect with fellow learners, ask questions, and share knowledge.
                                Join our vibrant community discussion!
                            </p>
                            {/* Ask Question Button in Header */}
                            <div className="header-ask-btn">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setAskQuestionVisible(true)}
                                    className="ask-question-header"
                                    size="large"
                                >
                                    Ask Question
                                </Button>
                            </div>
                        </div>
                    </div>



                    {/* Ask Question Form - Below Header */}
                    {askQuestionVisible && (
                        <div className="ask-question-section">
                            <div className="ask-question-form-inline">
                                <h3 className="form-title-inline">Ask a Question</h3>
                                <Form form={form} onFinish={handleAskQuestion} layout="vertical">
                                    <Form.Item
                                        name="title"
                                        label="Question Title"
                                        rules={[{ required: true, message: 'Please enter the title' }]}
                                    >
                                        <Input
                                            placeholder="What's your question about?"
                                            className="modern-input"
                                            size="large"
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="body"
                                        label="Question Details"
                                        rules={[{ required: true, message: 'Please enter the question details' }]}
                                    >
                                        <Input.TextArea
                                            rows={4}
                                            placeholder="Provide more details about your question..."
                                            className="modern-textarea"
                                        />
                                    </Form.Item>
                                    <Form.Item className="form-actions-inline">
                                        <Button type="primary" htmlType="submit" className="submit-btn-inline">
                                            Post Question
                                        </Button>
                                        <Button onClick={() => setAskQuestionVisible(false)} className="cancel-btn-inline">
                                            Cancel
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </div>
                        </div>
                    )}

                    {/* Questions List */}
                    <div className="questions-container">
                        {questions.map((question) => (
                            <div key={question._id} className="modern-question-card">
                                {/* Question Header */}
                                <div className="question-header">
                                    <div className="user-info">
                                        <div className="user-avatar-container">
                                            <Avatar
                                                src={question.user?.profileImage ? question.user.profileImage : image}
                                                alt="profile"
                                                size={48}
                                                icon={<UserOutlined />}
                                            />
                                            {/* Online Status Indicator - Only show if explicitly online */}
                                            {question.user?.isOnline === true && (
                                                <div
                                                    className="online-status-forum"
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '-2px',
                                                        right: '-2px',
                                                        width: '16px',
                                                        height: '16px',
                                                        backgroundColor: '#22c55e',
                                                        borderRadius: '50%',
                                                        border: '3px solid #ffffff',
                                                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.6), 0 2px 4px rgba(0, 0, 0, 0.2)',
                                                        zIndex: 10,
                                                        animation: 'pulse 2s infinite'
                                                    }}
                                                    title="Online"
                                                />
                                            )}
                                        </div>
                                        <div className="user-details">
                                            <span className="username">{question.user?.name || 'Anonymous'}</span>
                                            <div className="question-meta">
                                                <span className="question-datetime">
                                                    {formatDateTime(question.createdAt)}
                                                </span>
                                                <Tag color="blue" className="subject-tag">
                                                    {formatUserClass(question.user?.class, question.user?.level)}
                                                </Tag>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge
                                        count={question.replies?.length || 0}
                                        className="reply-badge"
                                        showZero
                                        style={{
                                            backgroundColor: '#f3f4f6',
                                            color: '#6b7280',
                                            borderRadius: '20px',
                                            padding: '0.25rem 0.75rem',
                                            fontSize: '0.8rem',
                                            fontWeight: '600'
                                        }}
                                    />
                                </div>

                                {/* Question Content */}
                                <div className="question-content">
                                    <h3 className="question-title">{question.title}</h3>
                                    <p className="question-body">{question.body}</p>
                                </div>

                                {/* Replies Section - Always Visible */}
                                <div className="replies-section">
                                    {question.replies?.length > 0 ? (
                                        <>
                                            <div className="replies-header">
                                                <span className="replies-count">
                                                    {question.replies.length} {question.replies.length === 1 ? 'Reply' : 'Replies'}
                                                </span>
                                            </div>
                                            {question.replies.map((reply) => (
                                                <div key={reply._id} className="modern-reply">
                                                    <div className="reply-header">
                                                        <div className="reply-avatar-container">
                                                            <Avatar
                                                                src={reply.user?.profileImage ? reply.user.profileImage : image}
                                                                alt="profile"
                                                                size={32}
                                                                icon={<UserOutlined />}
                                                            />
                                                            {/* Online Status Indicator for Reply - Only show if explicitly online */}
                                                            {reply.user?.isOnline === true && (
                                                                <div
                                                                    className="online-status-reply"
                                                                    style={{
                                                                        position: 'absolute',
                                                                        bottom: '-1px',
                                                                        right: '-1px',
                                                                        width: '12px',
                                                                        height: '12px',
                                                                        backgroundColor: '#22c55e',
                                                                        borderRadius: '50%',
                                                                        border: '2px solid #ffffff',
                                                                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.6)',
                                                                        zIndex: 10,
                                                                        animation: 'pulse 2s infinite'
                                                                    }}
                                                                    title="Online"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="reply-user-info">
                                                            <div className="reply-user-details">
                                                                <span className="reply-username">{reply.user?.name || 'Anonymous'}</span>
                                                                <Tag color="green" className="reply-class-tag" size="small">
                                                                    {formatUserClass(reply.user?.class, reply.user?.level)}
                                                                </Tag>
                                                            </div>
                                                            <span className="reply-datetime">
                                                                {formatDateTime(reply.createdAt || reply.timestamp || extractDateFromObjectId(reply._id))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="reply-content">{reply.text}</div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <p className="no-replies">No replies yet. Be the first to reply!</p>
                                    )}
                                </div>

                                {/* Reply Form - Appears when Reply button is clicked */}
                                {replyQuestionId === question._id && (
                                    <div id={`reply-form-${question._id}`} className="reply-form-section">
                                        <h4 className="reply-form-title">Reply to this question</h4>
                                        <Form form={form} onFinish={handleReplySubmit} layout="vertical">
                                            <Form.Item
                                                name="text"
                                                label="Your Reply"
                                                rules={[{ required: true, message: 'Please enter your reply' }]}
                                            >
                                                <Input.TextArea
                                                    rows={3}
                                                    placeholder="Write your reply..."
                                                    className="modern-textarea"
                                                    autoFocus
                                                />
                                            </Form.Item>
                                            <Form.Item className="reply-actions">
                                                <Button type="primary" htmlType="submit" className="submit-reply-btn">
                                                    Submit Reply
                                                </Button>
                                                <Button onClick={() => setReplyQuestionId(null)} className="cancel-reply-btn">
                                                    Cancel
                                                </Button>
                                            </Form.Item>
                                        </Form>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="question-actions">
                                    <Button
                                        icon={<MessageOutlined />}
                                        onClick={() => handleReply(question._id)}
                                        className="action-btn reply-btn"
                                        type={replyQuestionId === question._id ? "default" : "primary"}
                                    >
                                        {replyQuestionId === question._id ? "Cancel Reply" : "Reply"}
                                    </Button>
                                    <Button
                                        icon={<MessageOutlined />}
                                        className="action-btn view-btn"
                                        disabled
                                        style={{ opacity: 0.7 }}
                                    >
                                        {question.replies?.length || 0} Replies
                                    </Button>
                                </div>


                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalQuestions > 0 && (
                        <div className="forum-pagination">
                            <div className="pagination-info">
                                <span className="pagination-text">
                                    Showing {startItem}-{endItem} of {totalQuestions} questions
                                </span>
                                {totalPages > 1 && (
                                    <span className="pagination-pages">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                )}
                            </div>
                            {totalPages > 1 && (
                                <div className="pagination-controls">
                                    <Button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="pagination-btn"
                                    >
                                        Previous
                                    </Button>

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}

                                    <Button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="pagination-btn"
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Forum;

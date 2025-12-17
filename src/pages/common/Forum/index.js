import React, { useState, useEffect } from "react";
import './index.css';
import { getUserInfo } from "../../../apicalls/users";
import { message, Button, Input, Form, Avatar, Badge, Tag } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { addQuestion, addReply, getAllQuestions, deleteQuestion, deleteReply } from "../../../apicalls/forum";
import image from '../../../assets/person.png';
import { PlusOutlined, MessageOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { MdVerified, MdCheckCircle } from 'react-icons/md';

const Forum = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [userData, setUserData] = useState('');
    const [questions, setQuestions] = useState([]);
    const [askQuestionVisible, setAskQuestionVisible] = useState(false);
    const [replyQuestionId, setReplyQuestionId] = useState(null);
    const [form] = Form.useForm();

    // Delete confirmation modal states
    const [deleteModal, setDeleteModal] = useState({
        visible: false,
        type: null, // 'question' or 'reply'
        questionId: null,
        replyId: null,
        position: { top: 0, left: 0 } // Store button position
    });
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
                    setUserData(response.data); // Set userData for admins too
                } else {
                    setIsAdmin(false);
                    setUserData(response.data);
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
        if (userData || isAdmin) {
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

    // Show delete confirmation modal
    const showDeleteModal = (type, questionId, replyId = null, event) => {
        // Get the button's position
        const buttonRect = event.currentTarget.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        setDeleteModal({
            visible: true,
            type,
            questionId,
            replyId,
            position: {
                top: buttonRect.top + scrollTop,
                left: buttonRect.left + scrollLeft,
                buttonWidth: buttonRect.width,
                buttonHeight: buttonRect.height
            }
        });
    };

    // Hide delete confirmation modal
    const hideDeleteModal = () => {
        setDeleteModal({
            visible: false,
            type: null,
            questionId: null,
            replyId: null,
            position: { top: 0, left: 0 }
        });
    };

    // Confirm delete action
    const confirmDelete = async () => {
        if (deleteModal.type === 'question') {
            await handleDeleteQuestion(deleteModal.questionId);
        } else if (deleteModal.type === 'reply') {
            await handleDeleteReply(deleteModal.questionId, deleteModal.replyId);
        }
        hideDeleteModal();
    };

    const handleDeleteQuestion = async (questionId) => {
        try {
            dispatch(ShowLoading());
            const response = await deleteQuestion(questionId);
            if (response.success) {
                message.success(response.message);
                // Refresh current page
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

    const handleDeleteReply = async (questionId, replyId) => {
        try {
            dispatch(ShowLoading());
            const response = await deleteReply(questionId, replyId);
            if (response.success) {
                message.success(response.message);
                // Refresh current page
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
                                            <span className="username">
                                                {question.user?.name || 'Anonymous'}
                                                {question.user?.isAdmin && (
                                                    <MdVerified
                                                        style={{
                                                            marginLeft: '6px',
                                                            color: '#1DA1F2',
                                                            fontSize: '16px'
                                                        }}
                                                        title="Verified Admin"
                                                    />
                                                )}
                                            </span>
                                            <div className="question-meta">
                                                <span className="question-datetime">
                                                    {formatDateTime(question.createdAt)}
                                                </span>
                                                <Tag color={question.user?.isAdmin ? "purple" : "blue"} className="subject-tag">
                                                    {question.user?.isAdmin ? "Administrator" : formatUserClass(question.user?.class, question.user?.level)}
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
                                                <div key={reply._id} className={`modern-reply ${reply.isVerified ? 'verified-reply' : ''}`}>
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
                                                                <span className="reply-username">
                                                                    {reply.user?.name || 'Anonymous'}
                                                                    {reply.user?.isAdmin && (
                                                                        <MdVerified
                                                                            style={{
                                                                                marginLeft: '4px',
                                                                                color: '#1DA1F2',
                                                                                fontSize: '14px'
                                                                            }}
                                                                            title="Verified Admin"
                                                                        />
                                                                    )}
                                                                    {reply.isVerified && (
                                                                        <MdCheckCircle
                                                                            style={{
                                                                                marginLeft: '4px',
                                                                                color: '#10b981',
                                                                                fontSize: '14px'
                                                                            }}
                                                                            title="Verified Answer"
                                                                        />
                                                                    )}
                                                                </span>
                                                                <Tag color={reply.user?.isAdmin ? "purple" : reply.isVerified ? "success" : "green"} className="reply-class-tag" size="small">
                                                                    {reply.user?.isAdmin ? "Administrator" : reply.isVerified ? "Verified Answer" : formatUserClass(reply.user?.class, reply.user?.level)}
                                                                </Tag>
                                                            </div>
                                                            <span className="reply-datetime">
                                                                {formatDateTime(reply.createdAt || reply.timestamp || extractDateFromObjectId(reply._id))}
                                                            </span>
                                                        </div>
                                                        {/* Delete button for reply - only show if user is reply author or admin */}
                                                        {(userData._id === reply.user?._id || isAdmin) && (
                                                            <Button
                                                                icon={<DeleteOutlined />}
                                                                size="small"
                                                                danger
                                                                type="text"
                                                                className="reply-delete-btn"
                                                                title="Delete reply"
                                                                onClick={(e) => showDeleteModal('reply', question._id, reply._id, e)}
                                                            />
                                                        )}
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
                                        {replyQuestionId === question._id ? "Cancel Reply" : `Reply (${question.replies?.length || 0})`}
                                    </Button>
                                    {/* Delete button - only show if user is question author or admin */}
                                    {(userData._id === question.user?._id || isAdmin) && (
                                        <Button
                                            icon={<DeleteOutlined />}
                                            className="action-btn delete-btn"
                                            danger
                                            onClick={(e) => showDeleteModal('question', question._id, null, e)}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </div>


                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalQuestions > 0 && totalPages > 1 && (
                        <div className="forum-pagination">
                            <div className="pagination-controls" style={{ gap: 0, flexWrap: 'nowrap' }}>
                                <Button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="pagination-btn"
                                    style={{
                                        minWidth: window.innerWidth <= 320 ? '28px' : window.innerWidth <= 375 ? '30px' : window.innerWidth <= 425 ? '32px' : '40px',
                                        padding: window.innerWidth <= 320 ? '0.3rem 0.4rem' : window.innerWidth <= 375 ? '0.35rem 0.45rem' : window.innerWidth <= 425 ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
                                        fontSize: window.innerWidth <= 320 ? '0.7rem' : window.innerWidth <= 375 ? '0.72rem' : window.innerWidth <= 425 ? '0.75rem' : '0.8rem',
                                        margin: 0
                                    }}
                                >
                                    Previous
                                </Button>

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
                                            <Button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                                style={{
                                                    minWidth: window.innerWidth <= 320 ? '28px' : window.innerWidth <= 375 ? '30px' : window.innerWidth <= 425 ? '32px' : '40px',
                                                    padding: window.innerWidth <= 320 ? '0.3rem 0.4rem' : window.innerWidth <= 375 ? '0.35rem 0.45rem' : window.innerWidth <= 425 ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
                                                    fontSize: window.innerWidth <= 320 ? '0.7rem' : window.innerWidth <= 375 ? '0.72rem' : window.innerWidth <= 425 ? '0.75rem' : '0.8rem',
                                                    margin: 0
                                                }}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    });
                                })()}

                                <Button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="pagination-btn"
                                    style={{
                                        minWidth: window.innerWidth <= 320 ? '28px' : window.innerWidth <= 375 ? '30px' : window.innerWidth <= 425 ? '32px' : '40px',
                                        padding: window.innerWidth <= 320 ? '0.3rem 0.4rem' : window.innerWidth <= 375 ? '0.35rem 0.45rem' : window.innerWidth <= 425 ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
                                        fontSize: window.innerWidth <= 320 ? '0.7rem' : window.innerWidth <= 375 ? '0.72rem' : window.innerWidth <= 425 ? '0.75rem' : '0.8rem',
                                        margin: 0
                                    }}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Custom Delete Confirmation Modal */}
                {deleteModal.visible && (
                    <div className="delete-modal-overlay" onClick={hideDeleteModal}>
                        <div
                            className="delete-modal-content"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: 'absolute',
                                top: `${deleteModal.position.top - 10}px`,
                                left: `${deleteModal.position.left}px`,
                                transform: 'translateY(-100%)'
                            }}
                        >
                            <div className="delete-modal-header">
                                <DeleteOutlined className="delete-modal-icon" />
                                <h3 className="delete-modal-title">
                                    {deleteModal.type === 'question' ? 'Delete Question' : 'Delete Reply'}
                                </h3>
                            </div>
                            <p className="delete-modal-description">
                                {deleteModal.type === 'question'
                                    ? 'Are you sure you want to delete this question? This action cannot be undone.'
                                    : 'Are you sure you want to delete this reply?'}
                            </p>
                            <div className="delete-modal-actions">
                                <button className="delete-modal-btn cancel-btn" onClick={hideDeleteModal}>
                                    Cancel
                                </button>
                                <button className="delete-modal-btn delete-btn" onClick={confirmDelete}>
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}

export default Forum;

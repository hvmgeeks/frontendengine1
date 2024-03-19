import React, { useState, useEffect, useRef } from "react";
import './index.css';
import { getUserInfo } from "../../../apicalls/users";
import { message, Button, Input, Form, Avatar } from "antd";
import PageTitle from "../../../components/PageTitle";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { addQuestion, addReply, getAllQuestions, deleteQuestion, updateQuestion, updateReplyStatus } from "../../../apicalls/forum";
import image from '../../../assets/person.png';
import { FaPencilAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { FaCheck } from "react-icons/fa";

const Forum = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [userData, setUserData] = useState('');
    const [questions, setQuestions] = useState([]);
    const [expandedReplies, setExpandedReplies] = useState({});
    const [askQuestionVisible, setAskQuestionVisible] = useState(false);
    const [replyQuestionId, setReplyQuestionId] = useState(null);
    const [editQuestion, setEditQuestion] = useState(null);
    const [form] = Form.useForm();
    const [form2] = Form.useForm();
    const dispatch = useDispatch();
    const [replyRefs, setReplyRefs] = useState({});

    const fetchQuestions = async () => {
        try {
            const response = await getAllQuestions();
            if (response.success) {
                console.log(response.data);
                setQuestions(response.data.reverse());
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        }
        console.log('Data Fetched');
        dispatch(HideLoading());
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
            const response = await addQuestion(values);
            if (response.success) {
                message.success(response.message);
                setAskQuestionVisible(false);
                form.resetFields();
                await fetchQuestions();
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        }
    };

    const handleReply = (questionId) => {
        setReplyQuestionId(questionId);
    };

    const handleReplySubmit = async (values) => {
        try {
            const payload = {
                questionId: replyQuestionId,
                text: values.text
            };
            const response = await addReply(payload);
            if (response.success) {
                message.success(response.message);
                setReplyQuestionId(null);
                form.resetFields();
                await fetchQuestions();
            } else {
                message.error(response.message);
            }
        } catch (error) {
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
            replyRefs[replyQuestionId].current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [replyQuestionId, replyRefs]);

    const handleEdit = (question) => {
        setEditQuestion(question);
    }

    const handleDelete = async (question) => {
        try {
            const confirmDelete = window.confirm('Are you sure you want to delete this question?');
            if (!confirmDelete) {
                return;
            }
            const response = await deleteQuestion(question._id);
            if (response.success) {
                message.success(response.message);
                await fetchQuestions();
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        }
    }

    const handleUpdateQuestion = async (values) => {
        try {
            const response = await updateQuestion(values, editQuestion._id);
            if (response.success) {
                message.success(response.message);
                setEditQuestion(null);
                await fetchQuestions();
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        }
    }

    const handleCancelUpdate = () => {
        setEditQuestion('');
    }
    const handleCancelAdd = () => {
        setAskQuestionVisible(false);
        form.resetFields();
    }

    useEffect(() => {
        if (editQuestion) {
            form2.setFieldsValue({
                title: editQuestion.title,
                body: editQuestion.body
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
                await fetchQuestions();
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        }
    }

    return (
        <div>
            <div className="Forum">
                <PageTitle title="Forum" />
                <div className="divider"></div>

                <div>
                    <p>Welcome to the forum! Feel free to ask questions, share your thoughts, and engage with the community.</p>
                    <Button onClick={() => setAskQuestionVisible(true)} style={{ marginBottom: 20 }}>
                        Ask a Question
                    </Button>
                </div>

                {askQuestionVisible && (
                    <Form form={form} onFinish={handleAskQuestion} layout="vertical">
                        <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter the title' }]}>
                            <Input style={{ padding: '18px 12px' }} />
                        </Form.Item>
                        <Form.Item name="body" label="Body" rules={[{ required: true, message: 'Please enter the body' }]}>
                            <Input.TextArea />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Ask Question
                            </Button>
                            <Button onClick={handleCancelAdd} style={{ marginLeft: 10 }}>
                                Cancel
                            </Button>
                        </Form.Item>
                    </Form>
                )}

                {questions.length === 0 &&
                    <div>Loading...</div>
                }

                {questions.map((question) => (
                    <div key={question._id} className="forum-question-container">
                        <div className="question">
                            <div className="profile-row">
                                <div className="profile-details">
                                    <Avatar src={question.user.profileImage ? question.user.profileImage : image} alt="profile" size={50} />
                                    <p>{question.user.name}</p>
                                    <p className="date">{new Date(question.createdAt).toLocaleString(undefined, { minute: 'numeric', hour: 'numeric', day: 'numeric', month: 'numeric', year: 'numeric' })}</p>
                                </div>
                                {(userData._id === question.user._id || userData.isAdmin) &&
                                    <div className="icons">
                                        <FaPencilAlt onClick={() => handleEdit(question)} />
                                        <MdDelete size={22} color="red" onClick={() => handleDelete(question)} />
                                    </div>
                                }
                            </div>
                            <div className="title">{question.title}</div>
                            <div className="body">{question.body}</div>
                            <Button onClick={() => toggleReplies(question._id)}>
                                {expandedReplies[question._id] ? "Collapse Replies" : "Expand Replies"}
                            </Button>
                            <Button onClick={() => handleReply(question._id)}>Reply</Button>
                        </div>
                        {(editQuestion && editQuestion._id === question._id) &&
                            <Form form={form2} onFinish={handleUpdateQuestion} layout="vertical" initialValues={{ title: editQuestion.title, body: editQuestion.body }}>
                                <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter the title' }]}>
                                    <Input style={{ padding: '18px 12px' }} />
                                </Form.Item>
                                <Form.Item name="body" label="Body" rules={[{ required: true, message: 'Please enter the body' }]}>
                                    <Input.TextArea />
                                </Form.Item>
                                <Form.Item>
                                    <Button type="primary" htmlType="submit">
                                        Update Question
                                    </Button>
                                    <Button onClick={handleCancelUpdate} style={{ marginLeft: 10 }}>
                                        Cancel
                                    </Button>
                                </Form.Item>
                            </Form>
                        }
                        {expandedReplies[question._id] && (
                            <div className="replies">
                                {question.replies.map((reply) => (
                                    <div key={reply._id} className={`reply ${reply.user.isAdmin ? 'admin-reply' : reply.isVerified ? 'verified-reply' : ''}`}>
                                        {reply.isVerified &&
                                            <FaCheck color="green" size={30} />
                                        }
                                        <div>
                                            <div className="profile-details">
                                                <Avatar src={reply.user.profileImage ? reply.user.profileImage : image} alt="profile" size={50} />
                                                <p>{reply.user.name}</p>
                                                <p className="date">{new Date(question.createdAt).toLocaleString(undefined, { minute: 'numeric', hour: 'numeric', day: 'numeric', month: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                            <div className="text">{reply.text}</div>
                                            {(isAdmin && !reply.user.isAdmin) &&
                                                <button className="verification-btn" onClick={() => handleUpdateStatus(question._id, reply._id, !reply.isVerified)}>{!reply.isVerified ? 'Approve Reply' : 'Disapprove Reply'}</button>
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div ref={replyRefs[question._id]}>
                            {replyQuestionId === question._id && (
                                <Form form={form} onFinish={handleReplySubmit} layout="vertical">
                                    <Form.Item name="text" label="Your Reply" rules={[{ required: true, message: 'Please enter your reply' }]}>
                                        <Input.TextArea rows={4} />
                                    </Form.Item>
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit">
                                            Submit Reply
                                        </Button>
                                        <Button onClick={() => setReplyQuestionId(null)} style={{ marginLeft: 10 }}>
                                            Cancel
                                        </Button>
                                    </Form.Item>
                                </Form>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
}

export default Forum;
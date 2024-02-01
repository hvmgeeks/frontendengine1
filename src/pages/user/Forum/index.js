import React, { useState, useEffect, useRef } from "react";
import './index.css';
import { getUserInfo } from "../../../apicalls/users";
import { message, Button, Input, Form, Avatar } from "antd";
import PageTitle from "../../../components/PageTitle";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { addQuestion, addReply, getAllQuestions } from "../../../apicalls/forum";
import image from '../../../assets/person.png';

const Forum = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [userData, setUserData] = useState('');
    const [questions, setQuestions] = useState([]);
    const [expandedReplies, setExpandedReplies] = useState({});
    const [askQuestionVisible, setAskQuestionVisible] = useState(false);
    const [replyQuestionId, setReplyQuestionId] = useState(null);
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const [replyRefs, setReplyRefs] = useState({});

    const fetchQuestions = async () => {
        try {
            const response = await getAllQuestions();
            if (response.success) {
                setQuestions(response.data.reverse());
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        }
    };

    const getUserData = async () => {
        try {
            const response = await getUserInfo();
            if (response.success) {
                if (response.data.isAdmin) {
                    setIsAdmin(true);
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
        dispatch(HideLoading());
    };

    useEffect(() => {
        if (localStorage.getItem("token")) {
            dispatch(ShowLoading());
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

    return (
        <div>
            {!isAdmin && (
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
                                <Button onClick={() => setAskQuestionVisible(false)} style={{ marginLeft: 10 }}>
                                    Cancel
                                </Button>
                            </Form.Item>
                        </Form>
                    )}

                    {questions.map((question) => (
                        <div key={question._id} className="forum-question-container">
                            <div className="question">
                                <div className="profile-row">
                                    <Avatar src={question.user.profileImage ? question.user.profileImage : image} alt="profile" size={50} />
                                    <p>{question.user.name}</p>
                                </div>
                                <div className="title">{question.title}</div>
                                <div className="body">{question.body}</div>
                                <Button onClick={() => toggleReplies(question._id)}>
                                    {expandedReplies[question._id] ? "Collapse Replies" : "Expand Replies"}
                                </Button>
                                <Button onClick={() => handleReply(question._id)}>Reply</Button>
                            </div>
                            {expandedReplies[question._id] && (
                                <div className="replies">
                                    {question.replies.map((reply) => (
                                        <div key={reply._id} className="reply">
                                            <div className="profile-row">
                                                <Avatar src={reply.user.profileImage ? reply.user.profileImage : image} alt="profile" size={50} />
                                                <p>{reply.user.name}</p>
                                            </div>
                                            <div className="text">{reply.text}</div>
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
            )}
        </div>
    );
}

export default Forum;

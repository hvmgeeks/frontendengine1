import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { message } from 'antd';
import { useLanguage } from '../contexts/LanguageContext';
import { getPastPaperAIResponse } from '../apicalls/aiResponse';
import {
  FaRobot,
  FaPaperPlane,
  FaTimes,
  FaExpand,
  FaCompress,
  FaUser,
  FaSpinner
} from 'react-icons/fa';
import './PastPaperDiscussion.css';

const PastPaperDiscussion = ({ 
  pastPaper, 
  isOpen, 
  onClose, 
  subject,
  className 
}) => {
  const { user } = useSelector((state) => state.user);
  const { t, isKiswahili } = useLanguage();
  
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: 'welcome',
        content: isKiswahili 
          ? `Hujambo! Mimi ni Brainwave AI. Nina tayari kukusaidia na karatasi ya mtihani "${pastPaper?.title}". Uliza chochote kuhusu maswali, majibu, au mada yoyote katika karatasi hii.`
          : `Hello! I'm Brainwave AI. I'm ready to help you with the past paper "${pastPaper?.title}". Ask me anything about questions, answers, or any topic in this paper.`,
        isAI: true,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, pastPaper, isKiswahili, messages.length]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      content: currentMessage,
      isAI: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const aiResponseData = {
        question: currentMessage,
        pastPaperTitle: pastPaper?.title,
        subject: subject,
        class: user?.class,
        userLevel: user?.level,
        language: isKiswahili ? 'kiswahili' : 'english'
      };

      const response = await getPastPaperAIResponse(aiResponseData);

      if (response.success) {
        const aiMessage = {
          id: Date.now() + 1,
          content: response.data.response,
          isAI: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('AI Response Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: isKiswahili 
          ? 'Samahani, kuna hitilafu katika kupata jibu. Jaribu tena.'
          : 'Sorry, there was an error getting a response. Please try again.',
        isAI: true,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear conversation
  const handleClearConversation = () => {
    setMessages([]);
    // Re-add welcome message
    const welcomeMessage = {
      id: 'welcome',
      content: isKiswahili 
        ? `Mazungumzo yamefutwa. Uliza swali jingine kuhusu karatasi ya mtihani "${pastPaper?.title}".`
        : `Conversation cleared. Ask another question about the past paper "${pastPaper?.title}".`,
      isAI: true,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  if (!isOpen) return null;

  return (
    <div className={`past-paper-discussion-overlay ${isExpanded ? 'expanded' : ''}`}>
      <div className={`past-paper-discussion ${isExpanded ? 'expanded' : ''}`}>
        {/* Header */}
        <div className="discussion-header">
          <div className="header-info">
            <FaRobot className="ai-icon" />
            <div className="header-text">
              <h3 className="discussion-title">
                {isKiswahili ? 'Jadili na Brainwave AI' : 'Discuss with Brainwave AI'}
              </h3>
              <p className="paper-title">{pastPaper?.title}</p>
            </div>
          </div>
          <div className="header-controls">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="expand-btn"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? <FaCompress /> : <FaExpand />}
            </button>
            <button 
              onClick={onClose}
              className="close-btn"
              title={isKiswahili ? 'Funga' : 'Close'}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="messages-container">
          <div className="messages-list">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`message ${msg.isAI ? 'ai-message' : 'user-message'} ${msg.isError ? 'error-message' : ''}`}
              >
                <div className="message-avatar">
                  {msg.isAI ? <FaRobot /> : <FaUser />}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  <div className="message-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message ai-message loading-message">
                <div className="message-avatar">
                  <FaSpinner className="spinning" />
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {isKiswahili ? 'Brainwave AI inafikiri...' : 'Brainwave AI is thinking...'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isKiswahili 
                ? 'Uliza swali kuhusu karatasi hii ya mtihani...' 
                : 'Ask a question about this past paper...'}
              className="message-input"
              rows="2"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading}
              className="send-btn"
              title={isKiswahili ? 'Tuma' : 'Send'}
            >
              <FaPaperPlane />
            </button>
          </div>
          
          {messages.length > 1 && (
            <div className="input-actions">
              <button
                onClick={handleClearConversation}
                className="clear-btn"
              >
                {isKiswahili ? 'Futa Mazungumzo' : 'Clear Conversation'}
              </button>
            </div>
          )}
        </div>

        {/* Paper Info */}
        <div className="paper-info">
          <div className="info-item">
            <strong>{isKiswahili ? 'Somo:' : 'Subject:'}</strong> {subject}
          </div>
          {className && (
            <div className="info-item">
              <strong>{isKiswahili ? 'Darasa:' : 'Class:'}</strong> {className}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PastPaperDiscussion;

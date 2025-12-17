import React, { useState, useRef, useEffect } from "react";
import "./index.css";

function BrainwaveAI() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm Brainwave AI. How can I help you?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setLoading(true);

    setMessages(prev => [...prev, { role: "user", content: userMsg }]);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: "I received your message: " + userMsg }]);
      setLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-page-container">
      <div className="chat-header">
        <h1 className="chat-title">Brainwave AI</h1>
        <p className="chat-subtitle">Your intelligent study assistant</p>
      </div>

      <div className="chat-messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.role}`}>
            <div className={`message-bubble ${msg.role}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-wrapper assistant">
            <div className="message-bubble assistant">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-wrapper">
        <div className="chat-input-inner">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="chat-textarea"
            rows="1"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="chat-send-button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <p className="chat-hint">
          Press Enter to send • Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}

export default BrainwaveAI;
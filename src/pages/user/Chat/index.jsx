import React, { useState } from "react";

function BrainwaveAI() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm Brainwave AI. How can I help you?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f9ff' }}>
      <div style={{ background: 'white', padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ margin: 0, color: '#1f2937', fontSize: '24px', fontWeight: 'bold' }}>Brainwave AI</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Your intelligent study assistant</p>
      </div>

      <div style={{ flex: 1, padding: '20px', overflow: 'auto', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '20px', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              background: msg.role === 'user' ? '#3b82f6' : 'white',
              color: msg.role === 'user' ? 'white' : '#1f2937',
              padding: '16px',
              borderRadius: '16px',
              maxWidth: '70%',
              border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
              boxShadow: msg.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              wordWrap: 'break-word'
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '16px',
              maxWidth: '70%',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              Typing...
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'white', padding: '20px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask me anything..."
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              outline: 'none',
              fontSize: '16px',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              padding: '12px 24px',
              background: loading || !input.trim() ? '#e5e7eb' : '#3b82f6',
              color: loading || !input.trim() ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              fontFamily: 'inherit'
            }}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
        <p style={{
          textAlign: 'center',
          margin: '12px 0 0 0',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          Press Enter to send your message
        </p>
      </div>
    </div>
  );
}

export default BrainwaveAI;
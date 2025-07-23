import React, { useState, useRef, useEffect } from 'react';
import { TbRobot, TbMinus, TbMaximize, TbX } from 'react-icons/tb';
import { chatWithChatGPT, uploadImg } from '../apicalls/chat';
import { useLanguage } from '../contexts/LanguageContext';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import ContentRenderer from './ContentRenderer';

const FloatingBrainwaveAI = () => {
  const { isKiswahili } = useLanguage();
  const { user } = useSelector(state => state.user);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const isMobile = window.innerWidth <= 768;

  // Load saved chat history on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('brainwave_chat_history');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('brainwave_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  // Memoize initial message to prevent unnecessary re-renders
  const initialMessage = React.useMemo(() => {
    const content = isKiswahili
      ? `Hujambo! Mimi ni Brainwave AI, msaidizi wako wa masomo. Niko hapa kukusaidia na maswali yoyote ya masomo. Je, una swali lolote?`
      : `Hello! I'm Brainwave AI, your educational assistant. I'm here to help you with any study questions you might have. What would you like to learn about today?`;

    return { role: "assistant", content };
  }, [isKiswahili]);

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMessage = input.trim();
    const imageFile = selectedImage;

    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    let imageUrl = null;
    if (imageFile) {
      try {
        setIsLoading(true);
        console.log('Uploading image:', imageFile.name, imageFile.size);

        // Create FormData for image upload
        const formData = new FormData();
        formData.append('image', imageFile);

        console.log('Sending image upload request...');
        const uploadResponse = await uploadImg(formData);
        console.log('Upload response:', uploadResponse);

        if (uploadResponse.success) {
          imageUrl = uploadResponse.data?.url || uploadResponse.url;
          console.log('Image uploaded successfully:', imageUrl);
        } else {
          throw new Error(uploadResponse.message || 'Image upload failed');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        const errorMessage = isKiswahili
          ? "Kuna tatizo la kupakia picha. Tafadhali jaribu tena."
          : "There was an error uploading the image. Please try again.";
        setMessages(prev => [...prev, { role: "assistant", content: errorMessage }]);
        setIsLoading(false);
        return;
      }
    }

    const newUserMessage = imageUrl
      ? {
          role: "user",
          content: [
            { type: "text", text: userMessage || "Please analyze this image" },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      : { role: "user", content: userMessage };

    setMessages(prev => [...prev, newUserMessage]);

    // Enhanced system prompt with formatting instructions
    const systemPrompt = isKiswahili
      ? 'Jibu kwa lugha ya Kiswahili tu. Wewe ni msaidizi wa masomo wa Tanzania. Tumia lugha rahisi na ya kielimu. Ikiwa ni swali la picha, soma picha kwa makini na ueleze hatua kwa hatua. Tumia:\n- Nukta za bullet (-) kwa orodha\n- Nambari (1., 2., 3.) kwa hatua\n- **Herufi nzito** kwa mambo muhimu\n- ## kwa vichwa vikuu'
      : 'You are an educational assistant for Tanzanian students. Be helpful and provide clear, step-by-step explanations. If this is an image question, carefully analyze the image content and provide detailed solutions. Format your responses using:\n- Bullet points (-) for lists\n- Numbers (1., 2., 3.) for steps\n- **Bold text** for important points\n- ## for main headings\n- Organize information clearly with proper spacing';

    const chatPayload = {
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        newUserMessage
      ]
    };

    try {
      setIsLoading(true);
      const response = await chatWithChatGPT(chatPayload);

      if (response.success) {
        setMessages(prev => [...prev, { role: "assistant", content: response.data }]);
      } else {
        throw new Error(response.message || 'Failed to get response');
      }
    } catch (error) {
      const errorMessage = isKiswahili
        ? "Samahani, kuna tatizo la mtandao. Tafadhali jaribu tena."
        : "Sorry, there was a network error. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChatHistory = () => {
    setMessages([]);
    localStorage.removeItem('brainwave_chat_history');
  };

  // Hide on subscription page
  if (!user || location.pathname.includes('/subscription')) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: isMobile ? '20px' : '30px',
            right: isMobile ? '20px' : '30px',
            width: isMobile ? '50px' : '60px',
            height: isMobile ? '50px' : '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
            zIndex: 1000,
            transition: 'all 0.3s ease',
            border: '3px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <TbRobot style={{ color: 'white !important', fontSize: isMobile ? '24px' : '28px' }} />
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <>
          <div style={{
            position: 'fixed',
            bottom: isMaximized ? '20px' : (isMobile ? '20px' : '30px'),
            right: isMaximized ? '20px' : (isMobile ? '20px' : '30px'),
            left: isMaximized ? '20px' : 'auto',
            top: isMaximized ? '20px' : 'auto',
            width: isMaximized ? 'calc(100vw - 40px)' : (isMobile ? '320px' : '380px'),
            height: isMaximized ? 'calc(100vh - 40px)' : (isMobile ? '500px' : '600px'),
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: isMaximized ? '16px' : '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: isMobile ? '16px 20px' : '20px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <TbRobot style={{ color: 'white !important', fontSize: isMobile ? '20px' : '24px' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: '600' }}>
                    Brainwave AI
                  </h3>
                  <p style={{ margin: 0, fontSize: isMobile ? '11px' : '12px', opacity: 0.9 }}>
                    {isKiswahili ? 'Msaidizi wako wa masomo' : 'Your study assistant'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {messages.length > 0 && (
                  <button
                    onClick={clearChatHistory}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      borderRadius: isMobile ? '6px' : '8px',
                      width: isMobile ? '28px' : '32px',
                      height: isMobile ? '28px' : '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    title={isKiswahili ? 'Futa mazungumzo' : 'Clear chat'}
                  >
                    <span style={{ color: '#ffffff', fontSize: isMobile ? '14px' : '16px', filter: 'brightness(0) invert(1)' }}>🗑️</span>
                  </button>
                )}
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: isMobile ? '6px' : '8px',
                    width: isMobile ? '28px' : '32px',
                    height: isMobile ? '28px' : '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  title={isMaximized ? (isKiswahili ? 'Punguza' : 'Minimize') : (isKiswahili ? 'Kubwa' : 'Maximize')}
                >
                  {isMaximized ? (
                    <span style={{ color: '#ffffff', fontSize: isMobile ? '16px' : '18px' }}>➖</span>
                  ) : (
                    <span style={{ color: '#ffffff', fontSize: isMobile ? '16px' : '18px' }}>⬜</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsMaximized(false);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: isMobile ? '6px' : '8px',
                    width: isMobile ? '28px' : '32px',
                    height: isMobile ? '28px' : '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  title={isKiswahili ? 'Funga' : 'Close'}
                >
                  <span style={{ color: '#ffffff', fontSize: isMobile ? '16px' : '18px' }}>✕</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              padding: isMobile ? '16px' : '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }} className="custom-scrollbar">
              {/* Initial Message */}
              <div style={{
                background: '#ffffff',
                padding: isMobile ? '12px 16px' : '16px 20px',
                borderRadius: '16px',
                border: '2px solid #e5e7eb',
                alignSelf: 'flex-start',
                maxWidth: '85%',
                color: '#1f2937',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                  {initialMessage.content || 'Hello! I\'m Brainwave AI, your educational assistant.'}
                </div>
              </div>

              {/* Chat Messages */}
              {messages.map((message, index) => (
                <div key={index} style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}>
                  <div style={{
                    background: message.role === 'user'
                      ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                      : '#ffffff',
                    color: message.role === 'user' ? '#ffffff' : '#1f2937',
                    padding: isMobile ? '12px 16px' : '16px 20px',
                    borderRadius: '16px',
                    border: message.role === 'user' ? 'none' : '2px solid #e5e7eb',
                    fontSize: isMobile ? '13px' : '14px',
                    lineHeight: '1.6',
                    boxShadow: message.role === 'user' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}>
                    {Array.isArray(message.content) ? (
                      message.content.map((item, itemIndex) => (
                        <div key={itemIndex}>
                          {item.type === 'text' && (
                            <div style={{ color: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}>
                              {item.text || 'Message content'}
                            </div>
                          )}
                          {item.type === 'image_url' && (
                            <div style={{ marginTop: '8px', position: 'relative' }}>
                              <img 
                                src={item.image_url.url} 
                                alt="User upload" 
                                style={{ 
                                  maxWidth: '100%', 
                                  height: 'auto', 
                                  borderRadius: '12px', 
                                  maxHeight: isMobile ? '180px' : '250px', 
                                  objectFit: 'contain', 
                                  border: '3px solid #e2e8f0', 
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                  background: '#f8fafc',
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  window.open(item.image_url.url, '_blank');
                                }}
                              />
                              <div style={{
                                position: 'absolute',
                                bottom: '8px',
                                right: '8px',
                                background: 'rgba(0, 0, 0, 0.7)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: '500'
                              }}>
                                📸 {isKiswahili ? 'Bonyeza kuona kikubwa' : 'Click to enlarge'}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ color: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}>
                        {message.role === 'assistant' ? (
                          <ContentRenderer text={message.content || 'AI response'} />
                        ) : (
                          message.content || 'Message content'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div style={{
                  alignSelf: 'flex-start',
                  maxWidth: '85%'
                }}>
                  <div style={{
                    background: '#ffffff',
                    padding: isMobile ? '12px 16px' : '16px 20px',
                    borderRadius: '16px',
                    border: '2px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          style={{
                            width: '8px',
                            height: '8px',
                            background: '#3b82f6',
                            borderRadius: '50%',
                            animation: `bounce 1.4s infinite ease-in-out both`,
                            animationDelay: `${(i - 1) * 0.16}s`
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: isMobile ? '12px' : '13px', color: '#6b7280' }}>
                      {isKiswahili ? 'Inafikiri...' : 'Thinking...'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div style={{ marginBottom: '12px', padding: '12px', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: '12px', border: '2px solid #0ea5e9', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={imagePreview} alt="Preview" style={{ width: isMobile ? '80px' : '100px', height: isMobile ? '80px' : '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #0ea5e9', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }} />
                    <button onClick={removeImage} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '24px', height: '24px', background: '#ef4444', color: 'white', borderRadius: '50%', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>×</button>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#0c4a6e', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📸 {isKiswahili ? 'Picha Imepakiwa' : 'Image Attached'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#0369a1', margin: 0 }}>
                      {selectedImage?.name || 'image.png'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div style={{ display: 'flex', gap: isMobile ? '6px' : '8px', background: '#f8fafc', borderRadius: isMobile ? '12px' : '16px', padding: isMobile ? '6px' : '8px', border: '2px solid #e2e8f0' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)'
                }}
                title={isKiswahili ? "Pakia picha" : "Upload image"}
              >
                <span style={{ color: 'white !important', fontSize: '14px', fontWeight: 'bold' }}>+</span>
              </button>



              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isKiswahili ? "Uliza chochote..." : "Ask me anything..."}
                rows={1}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: isMobile ? '12px' : '14px',
                  color: '#334155',
                  padding: isMobile ? '10px 12px' : '12px 16px',
                  fontFamily: 'inherit'
                }}
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() && !selectedImage}
                style={{
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (input.trim() || selectedImage) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  opacity: (input.trim() || selectedImage) ? 1 : 0.5
                }}
              >
                <span style={{ color: 'white !important', fontSize: '12px' }}>→</span>
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />

            <p style={{ fontSize: isMobile ? '9px' : '11px', color: '#94a3b8', textAlign: 'center', margin: isMobile ? '6px 0 0 0' : '8px 0 0 0' }}>
              {isMobile
                ? (isKiswahili ? 'Enter • + Pakia picha' : 'Enter • + Upload image')
                : (isKiswahili ? 'Enter kusonga • + Pakia picha' : 'Press Enter to send • + Upload image')
              }
            </p>
          </div>
        </>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
};

export default FloatingBrainwaveAI;

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import ReactModal from "react-modal";
import { useLanguage } from "../../../contexts/LanguageContext";
import { askPDFQuestion } from "../../../apicalls/pdfChat";
import Tesseract from 'tesseract.js';
import axios from 'axios';
import { message } from 'antd';
import ContentRenderer from '../../../components/ContentRenderer';
ReactModal.setAppElement('#root');

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@2.15.349/build/pdf.worker.min.js`;

// Add CSS for spinner and pulse animations
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  .ocr-mode-active {
    cursor: crosshair !important;
  }
  .ocr-mode-active * {
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    -webkit-touch-callout: none !important;
    cursor: crosshair !important;
  }
  .ocr-mode-active .textLayer {
    display: none !important;
    pointer-events: none !important;
    visibility: hidden !important;
  }
  .ocr-mode-active canvas {
    pointer-events: none !important;
  }
  .selection-box-drawing {
    transition: none !important;
    will-change: width, height, left, top;
  }
`;

// Inject the CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinnerStyle;
  document.head.appendChild(style);
}

const PDFModal = ({ modalIsOpen, closeModal, documentUrl }) => {
  const { isKiswahili } = useLanguage();
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // AI Assistant states
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiConversation, setAiConversation] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);

  // OCR states
  const [ocrMode, setOcrMode] = useState(false);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrBox, setOcrBox] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentDraw, setCurrentDraw] = useState(null);

  // Preview confirmation states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [previewImageData, setPreviewImageData] = useState(null);

  const canvasRefs = useRef([]);
  const textLayerRefs = useRef([]);
  const containerRef = useRef(null);
  const renderingRefs = useRef({}); // Track rendering state per page
  const chatEndRef = useRef(null);

  // Load saved conversation for this PDF when modal opens
  useEffect(() => {
    if (modalIsOpen && documentUrl) {
      const chatKey = `pdf_chat_${documentUrl}`;
      const savedChat = localStorage.getItem(chatKey);
      if (savedChat) {
        try {
          const parsedChat = JSON.parse(savedChat);
          setAiConversation(parsedChat);
        } catch (error) {
          console.error('Error loading saved chat:', error);
        }
      }
    }
  }, [modalIsOpen, documentUrl]);

  // Save conversation whenever it changes
  useEffect(() => {
    if (documentUrl && aiConversation.length > 0) {
      const chatKey = `pdf_chat_${documentUrl}`;
      localStorage.setItem(chatKey, JSON.stringify(aiConversation));
    }
  }, [aiConversation, documentUrl]);

  // Enhanced text selection with visual feedback
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && text.length > 0) {
      setSelectedText(text);
      setShowCopyButton(true);

      // Get selection position for better copy button placement
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelectionBox({
          text: text,
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
      }
    } else {
      setSelectedText('');
      setShowCopyButton(false);
      setSelectionBox(null);
    }
  };

  // Handle "Ask Brainwave about selected text"
  const handleAskAboutSelection = () => {
    if (!selectedText) return;

    // Open AI panel if not already open
    if (!showAIPanel) {
      setShowAIPanel(true);
    }

    // Set the question with the selected text
    const questionPrompt = isKiswahili
      ? `Eleza hii: "${selectedText}"`
      : `Explain this: "${selectedText}"`;

    setAiQuestion(questionPrompt);

    // Clear selection UI
    setShowCopyButton(false);
    setSelectionBox(null);
    window.getSelection().removeAllRanges();

    // Auto-focus on input (after a small delay to ensure panel is open)
    setTimeout(() => {
      const input = document.querySelector('input[placeholder*="question"]');
      if (input) input.focus();
    }, 100);
  };

  // Handle mouse down - start drawing selection box
  const handleMouseDown = (event, pageIndex) => {
    if (!ocrMode || isOCRProcessing) return;

    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRefs.current[pageIndex];
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Calculate scale factor between displayed size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get mouse position relative to displayed canvas
    const displayX = event.clientX - rect.left;
    const displayY = event.clientY - rect.top;

    // Convert to actual canvas coordinates
    const x = displayX * scaleX;
    const y = displayY * scaleY;

    setIsDrawing(true);
    setDrawStart({ x, y, pageIndex, scaleX, scaleY });
    setCurrentDraw({ x, y, width: 0, height: 0, pageIndex });
  };

  // Handle mouse move - update selection box
  const handleMouseMove = (event, pageIndex) => {
    if (!isDrawing || !drawStart || drawStart.pageIndex !== pageIndex) return;

    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRefs.current[pageIndex];
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Use the same scale factors from drawStart
    const scaleX = drawStart.scaleX || (canvas.width / rect.width);
    const scaleY = drawStart.scaleY || (canvas.height / rect.height);

    // Get mouse position relative to displayed canvas
    const displayX = event.clientX - rect.left;
    const displayY = event.clientY - rect.top;

    // Convert to actual canvas coordinates
    const currentX = displayX * scaleX;
    const currentY = displayY * scaleY;

    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const width = Math.abs(currentX - drawStart.x);
    const height = Math.abs(currentY - drawStart.y);

    setCurrentDraw({ x, y, width, height, pageIndex });
  };

  // Handle mouse up - perform OCR on selected area
  const handleMouseUp = async (event, pageIndex) => {
    if (!isDrawing || !drawStart || drawStart.pageIndex !== pageIndex) return;

    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRefs.current[pageIndex];
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Use the same scale factors from drawStart
    const scaleX = drawStart.scaleX || (canvas.width / rect.width);
    const scaleY = drawStart.scaleY || (canvas.height / rect.height);

    // Get mouse position relative to displayed canvas
    const displayX = event.clientX - rect.left;
    const displayY = event.clientY - rect.top;

    // Convert to actual canvas coordinates
    const currentX = displayX * scaleX;
    const currentY = displayY * scaleY;

    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const width = Math.abs(currentX - drawStart.x);
    const height = Math.abs(currentY - drawStart.y);

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDraw(null);

    // Minimum size check (at least 50x50 pixels)
    if (width < 50 || height < 50) {
      // Only show error if user actually dragged (not just a click)
      if (width > 5 || height > 5) {
        alert(isKiswahili
          ? 'Eneo ni dogo sana. Buruta eneo kubwa zaidi la angalau swali moja.'
          : 'Selection too small. Please drag a larger area covering at least one question.');
      }
      return;
    }

    // Show OCR box
    setOcrBox({ pageIndex, x, y, width, height });
    setIsOCRProcessing(true);
    setOcrProgress(20);

    try {
      // Extract the region from canvas as HIGH-QUALITY IMAGE
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d', { alpha: false });

      // CRITICAL: Use 2x resolution for better quality and text clarity
      const scale = 2;
      tempCanvas.width = width * scale;
      tempCanvas.height = height * scale;

      // Enable high-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw with 2x scale for better quality
      ctx.drawImage(
        canvas,
        x, y, width, height,
        0, 0, width * scale, height * scale
      );

      setOcrProgress(40);

      // Convert canvas to data URL for preview (maximum quality)
      const previewDataUrl = tempCanvas.toDataURL('image/png', 1.0);

      // Convert canvas to blob with maximum quality
      const blob = await new Promise(resolve =>
        tempCanvas.toBlob(resolve, 'image/png', 1.0)
      );

      setOcrProgress(60);

      // Upload image to S3 (exactly like Floating AI does)
      const formData = new FormData();
      formData.append('image', blob, 'question-screenshot.png');

      console.log('📤 Uploading screenshot to S3...');
      const uploadResponse = await axios.post('/api/chatgpt/image/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setOcrProgress(80);

      if (!uploadResponse.data.success) {
        throw new Error('Image upload failed');
      }

      const imageUrl = uploadResponse.data.data?.url || uploadResponse.data.url;
      console.log('✅ Image uploaded:', imageUrl);

      setOcrProgress(100);

      // Store preview data and show confirmation modal
      setPreviewImageUrl(imageUrl);
      setPreviewImageData(previewDataUrl);
      setShowPreviewModal(true);

      // Hide OCR processing indicators
      setIsOCRProcessing(false);
      setOcrProgress(0);
      setTimeout(() => setOcrBox(null), 500);

    } catch (error) {
      console.error('❌ Image Upload Error:', error);
      alert(isKiswahili
        ? 'Hitilafu katika kusoma picha. Jaribu tena.'
        : 'Error reading image. Please try again.');
      setIsOCRProcessing(false);
      setOcrProgress(0);
      setTimeout(() => setOcrBox(null), 500);
    }
  };

  // Handle preview confirmation - send to AI
  const handleConfirmPreview = async () => {
    if (!previewImageUrl) return;

    setShowPreviewModal(false);
    setIsAILoading(true);

    // Reset drawing state to allow new selections
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDraw(null);

    // Open AI panel if not already open
    if (!showAIPanel) {
      setShowAIPanel(true);
    }

    try {
      // Create user message with IMAGE - simple prompt (observation happens in backend)
      const userMessage = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: isKiswahili
              ? 'Angalia picha hii kwa makini sana na ujibu swali kwa usahihi kamili. Ikiwa kuna mchoro, orodhesha kila sehemu iliyoandikwa. MAKOSA HAYARUHUSIWI.'
              : 'Look at this image very carefully and answer the question with complete accuracy. If there are diagrams, list every labeled part. MISTAKES ARE NOT ALLOWED.'
          },
          {
            type: 'image_url',
            image_url: {
              url: previewImageUrl,
              detail: 'high' // Force high-resolution analysis
            }
          }
        ],
        timestamp: new Date().toISOString()
      };

      // Send to AI using chat endpoint (like Floating AI) with vision support
      // IMPORTANT: For image questions, send ONLY the current image to avoid confusion with previous diagrams
      const chatPayload = {
        messages: [userMessage], // Send only current image, not entire conversation history
        language: isKiswahili ? 'kiswahili' : 'english',
        systemPrompt: isKiswahili
          ? `Wewe ni mwalimu mkuu wa Tanzania. MAKOSA HAYARUHUSIWI - jibu lako lazima liwe SAHIHI 100%.

Orodhesha kila sehemu iliyoandikwa kwenye mchoro. Toa majibu kamili na sahihi.

Jibu kwa Kiswahili sanifu.`
          : `You are an expert teacher from Tanzania. MISTAKES ARE NOT ALLOWED - your answer must be 100% CORRECT.

List every labeled part in diagrams. Provide complete and accurate answers.

Answer in proper English.`
      };

      const response = await axios.post('/api/chatgpt/chat', chatPayload);

      if (!response.data.success) {
        throw new Error('AI response failed');
      }

      // Add both user message and AI response to conversation
      const newConversation = [
        ...aiConversation,
        userMessage,
        {
          role: 'assistant',
          content: response.data.data,
          timestamp: new Date().toISOString()
        }
      ];
      setAiConversation(newConversation);
      setAiQuestion('');

      // Scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Success feedback
      message.success(isKiswahili
        ? '✅ Picha imetumwa na AI imejibu!'
        : '✅ Image sent and AI has responded!');

    } catch (error) {
      console.error('❌ AI Error:', error);
      message.error(isKiswahili
        ? 'Hitilafu katika kuwasiliana na AI. Jaribu tena.'
        : 'Error communicating with AI. Please try again.');
    } finally {
      setIsAILoading(false);
      setPreviewImageUrl(null);
      setPreviewImageData(null);
    }
  };

  // Handle preview cancellation - allow re-selection
  const handleCancelPreview = () => {
    setShowPreviewModal(false);
    setPreviewImageUrl(null);
    setPreviewImageData(null);

    // Reset drawing state to allow new selections
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDraw(null);

    message.info(isKiswahili
      ? 'Chagua tena eneo sahihi la swali'
      : 'Select the correct question area again');
  };

  // Enhanced copy function with better feedback
  const copyToClipboard = async () => {
    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText);

        // Show success feedback
        const successMessage = isKiswahili ? 'Maandishi yamenakilishwa!' : 'Text copied to clipboard!';

        // Create temporary success indicator
        const successDiv = document.createElement('div');
        successDiv.textContent = successMessage;
        successDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: bold;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          transform: translateX(100%);
          transition: transform 0.3s ease-out;
        `;

        // Add CSS animations if not already added
        if (!document.getElementById('pdf-animations')) {
          const style = document.createElement('style');
          style.id = 'pdf-animations';
          style.textContent = `
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `;
          document.head.appendChild(style);
        }

        document.body.appendChild(successDiv);

        // Trigger slide-in animation
        setTimeout(() => {
          successDiv.style.transform = 'translateX(0)';
        }, 10);

        // Remove success indicator after 2 seconds
        setTimeout(() => {
          successDiv.style.transform = 'translateX(100%)';
          setTimeout(() => {
            if (document.body.contains(successDiv)) {
              document.body.removeChild(successDiv);
            }
          }, 300);
        }, 2000);

        // Clear selection
        setShowCopyButton(false);
        setSelectionBox(null);
        window.getSelection().removeAllRanges();

      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = selectedText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        const successMessage = isKiswahili ? 'Maandishi yamenakilishwa!' : 'Text copied to clipboard!';
        alert(successMessage);

        setShowCopyButton(false);
        setSelectionBox(null);
        window.getSelection().removeAllRanges();
      }
    }
  };

  // AI Assistant: Handle asking questions
  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;

    const userMessage = {
      role: 'user',
      content: aiQuestion,
      timestamp: new Date()
    };

    // Add user message to conversation
    setAiConversation(prev => [...prev, userMessage]);
    setAiQuestion('');
    setIsAILoading(true);

    try {
      // Extract PDF title from URL
      const pdfTitle = documentUrl ? documentUrl.split('/').pop().replace('.pdf', '') : 'Study Material';

      const response = await askPDFQuestion({
        question: aiQuestion,
        pdfContext: {
          title: pdfTitle,
          url: documentUrl
        },
        conversationHistory: aiConversation,
        language: isKiswahili ? 'kiswahili' : 'english'
      });

      if (response.success) {
        const aiMessage = {
          role: 'assistant',
          content: response.data.answer,
          timestamp: new Date()
        };
        setAiConversation(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          role: 'assistant',
          content: isKiswahili
            ? `Samahani, hitilafu imetokea: ${response.message}`
            : `Sorry, an error occurred: ${response.message}`,
          timestamp: new Date(),
          isError: true
        };
        setAiConversation(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: isKiswahili
          ? 'Samahani, imeshindwa kuwasiliana na AI. Tafadhali jaribu tena.'
          : 'Sorry, failed to connect to AI. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setAiConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsAILoading(false);
    }
  };

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiConversation]);

  const renderPDF = async (url) => {
    try {
      setIsLoading(true);
      setLoadingProgress(0);

      const pdf = await pdfjsLib.getDocument(url).promise;
      console.log("PDF loaded");

      setTotalPages(pdf.numPages);

      // Load pages progressively (first 3 pages immediately, then lazy load others)
      const initialPagesToLoad = Math.min(3, pdf.numPages);
      const pagesData = [];

      for (let i = 1; i <= initialPagesToLoad; i++) {
        const page = await pdf.getPage(i);
        pagesData.push(page);
        setLoadingProgress((i / pdf.numPages) * 100);
      }

      setPages(pagesData);
      setIsLoading(false);

      // Load remaining pages in background
      if (pdf.numPages > initialPagesToLoad) {
        loadRemainingPages(pdf, initialPagesToLoad + 1, pagesData);
      }

    } catch (error) {
      console.error("Error loading PDF:", error);
      setIsLoading(false);
    }
  };

  const loadRemainingPages = async (pdf, startPage, existingPages) => {
    const updatedPages = [...existingPages];

    for (let i = startPage; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        updatedPages.push(page);
        setPages([...updatedPages]);
        setLoadingProgress((i / pdf.numPages) * 100);

        // Small delay to prevent blocking the UI
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error(`Error loading page ${i}:`, error);
      }
    }
  };



  const renderPage = async (page, index) => {
    const canvas = canvasRefs.current[index];
    const textLayer = textLayerRefs.current[index];
    if (!canvas || renderingRefs.current[index] || !containerRef.current) return;

    try {
      renderingRefs.current[index] = true;

      const viewport = page.getViewport({ scale: 1.0 });
      const containerWidth = containerRef.current.clientWidth - 40; // Account for padding

      // Calculate base scale to fit width
      let baseScale = containerWidth / viewport.width;

      // For mobile and tablet devices, increase minimum scale for better readability
      const isMobile = window.innerWidth <= 768;
      const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

      if (isMobile) {
        // On mobile, ensure minimum scale of 1.5x for better readability
        baseScale = Math.max(baseScale, 1.5);
      } else if (isTablet) {
        // On tablet, ensure minimum scale of 1.3x
        baseScale = Math.max(baseScale, 1.3);
      }

      // Apply user zoom level on top of base scale
      const scale = baseScale * zoomLevel;
      const scaledViewport = page.getViewport({ scale });

      const context = canvas.getContext("2d");
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };

      await page.render(renderContext).promise;

      // Render text layer for selection
      if (textLayer) {
        textLayer.innerHTML = '';
        textLayer.style.width = canvas.style.width;
        textLayer.style.height = canvas.style.height;
        textLayer.style.position = 'absolute';
        textLayer.style.top = '0';
        textLayer.style.left = '0';
        textLayer.style.pointerEvents = 'auto';
        textLayer.style.userSelect = 'text';

        try {
          const textContent = await page.getTextContent();
          const textLayerDiv = textLayer;

          // Simple text rendering for selection
          textContent.items.forEach((item, itemIndex) => {
            const textSpan = document.createElement('span');
            textSpan.textContent = item.str;
            textSpan.style.position = 'absolute';
            textSpan.style.fontSize = `${item.height * scale}px`;
            textSpan.style.left = `${item.transform[4] * scale}px`;
            textSpan.style.top = `${scaledViewport.height - item.transform[5] * scale - item.height * scale}px`;
            textSpan.style.fontFamily = item.fontName || 'sans-serif';
            textSpan.style.color = 'transparent';
            textSpan.style.userSelect = 'text';
            textLayerDiv.appendChild(textSpan);
          });
        } catch (textError) {
          console.warn(`Could not render text layer for page ${index + 1}:`, textError);
        }
      }

      console.log(`Page ${index + 1} rendered`);
    } catch (error) {
      console.error(`Error rendering page ${index + 1}:`, error);
    } finally {
      renderingRefs.current[index] = false;
    }
  };

  useEffect(() => {
    if (modalIsOpen && documentUrl) {
      setPages([]);
      setTotalPages(0);
      setLoadingProgress(0);
      setSelectedText('');
      setShowCopyButton(false);
      setSelectionBox(null);
      setZoomLevel(1.0); // Reset zoom level when opening new document
      setAiConversation([]); // Reset AI conversation
      setAiQuestion('');
      setShowAIPanel(false);
      canvasRefs.current = [];
      textLayerRefs.current = [];
      renderingRefs.current = {};
      renderPDF(documentUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalIsOpen, documentUrl]);

  // Add event listener for text selection
  useEffect(() => {
    if (modalIsOpen) {
      document.addEventListener('selectionchange', handleTextSelection);

      return () => {
        document.removeEventListener('selectionchange', handleTextSelection);
      };
    }
  }, [modalIsOpen]);

  // Effect to render pages when they're loaded
  useEffect(() => {
    if (pages.length > 0 && containerRef.current) {
      pages.forEach((page, index) => {
        renderPage(page, index);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages]);

  // Re-render pages when window is resized or zoom level changes
  useEffect(() => {
    const handleResize = () => {
      if (pages.length > 0) {
        pages.forEach((page, index) => {
          renderPage(page, index);
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pages]);

  // Re-render pages when zoom level changes
  useEffect(() => {
    if (pages.length > 0) {
      pages.forEach((page, index) => {
        renderPage(page, index);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomLevel]);

  return (
    <ReactModal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      contentLabel="Document Preview"
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 9999
        },
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: window.innerWidth <= 768
            ? '95%'
            : showAIPanel
              ? (window.innerWidth <= 1024 ? '95%' : '90%')
              : (window.innerWidth <= 1024 ? '85%' : '75%'),
          height: window.innerWidth <= 768 ? '95%' : '90%',
          padding: 0,
          borderRadius: window.innerWidth <= 768 ? '8px' : '12px',
          overflow: 'hidden',
          border: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column'
        },
      }}
    >


      {/* Close Button */}
      <button
        onClick={closeModal}
        style={{
          position: "absolute",
          top: window.innerWidth <= 768 ? "5px" : "10px",
          right: window.innerWidth <= 768 ? "5px" : "10px",
          background: "rgba(255, 0, 0, 0.8)",
          border: "none",
          fontSize: window.innerWidth <= 768 ? "16px" : "18px",
          cursor: "pointer",
          zIndex: 1001,
          color: "white",
          borderRadius: "50%",
          width: window.innerWidth <= 768 ? "32px" : "36px",
          height: window.innerWidth <= 768 ? "32px" : "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "rgba(255, 0, 0, 1)";
          e.target.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "rgba(255, 0, 0, 0.8)";
          e.target.style.transform = "scale(1)";
        }}
      >
        ✕
      </button>

      {/* Zoom Controls */}
      <div style={{
        position: "absolute",
        top: window.innerWidth <= 768 ? "5px" : "10px",
        left: window.innerWidth <= 768 ? "5px" : "10px",
        display: "flex",
        gap: "8px",
        zIndex: 1001,
        background: "rgba(255, 255, 255, 0.95)",
        padding: "8px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
      }}>
        <button
          onClick={() => {
            const newZoom = Math.max(0.5, zoomLevel - 0.25);
            setZoomLevel(newZoom);
          }}
          disabled={zoomLevel <= 0.5}
          style={{
            background: zoomLevel <= 0.5 ? "rgba(100, 100, 100, 0.3)" : "rgba(59, 130, 246, 0.9)",
            border: "none",
            fontSize: window.innerWidth <= 768 ? "18px" : "20px",
            cursor: zoomLevel <= 0.5 ? "not-allowed" : "pointer",
            color: "white",
            borderRadius: "6px",
            width: window.innerWidth <= 768 ? "36px" : "40px",
            height: window.innerWidth <= 768 ? "36px" : "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            fontWeight: "bold"
          }}
          title={isKiswahili ? "Punguza" : "Zoom Out"}
        >
          −
        </button>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: window.innerWidth <= 768 ? "50px" : "60px",
          fontSize: window.innerWidth <= 768 ? "13px" : "14px",
          fontWeight: "600",
          color: "#333"
        }}>
          {Math.round(zoomLevel * 100)}%
        </div>

        <button
          onClick={() => {
            const newZoom = Math.min(3.0, zoomLevel + 0.25);
            setZoomLevel(newZoom);
          }}
          disabled={zoomLevel >= 3.0}
          style={{
            background: zoomLevel >= 3.0 ? "rgba(100, 100, 100, 0.3)" : "rgba(59, 130, 246, 0.9)",
            border: "none",
            fontSize: window.innerWidth <= 768 ? "18px" : "20px",
            cursor: zoomLevel >= 3.0 ? "not-allowed" : "pointer",
            color: "white",
            borderRadius: "6px",
            width: window.innerWidth <= 768 ? "36px" : "40px",
            height: window.innerWidth <= 768 ? "36px" : "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            fontWeight: "bold"
          }}
          title={isKiswahili ? "Ongeza" : "Zoom In"}
        >
          +
        </button>

        <button
          onClick={() => setZoomLevel(1.0)}
          style={{
            background: "rgba(100, 100, 100, 0.8)",
            border: "none",
            fontSize: window.innerWidth <= 768 ? "11px" : "12px",
            cursor: "pointer",
            color: "white",
            borderRadius: "6px",
            padding: "0 12px",
            height: window.innerWidth <= 768 ? "36px" : "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            fontWeight: "600",
            whiteSpace: "nowrap"
          }}
          title={isKiswahili ? "Rudisha" : "Reset Zoom"}
        >
          {isKiswahili ? "Rudisha" : "Reset"}
        </button>
      </div>

      {/* OCR Mode Toggle Button */}
      <button
        onClick={() => {
          const newOcrMode = !ocrMode;
          setOcrMode(newOcrMode);

          if (newOcrMode) {
            // Entering OCR mode - clear any text selection
            window.getSelection().removeAllRanges();
            setSelectedText('');
            setShowCopyButton(false);
            setSelectionBox(null);
          } else {
            // Exiting OCR mode - clear drawing states
            setOcrBox(null);
            setIsDrawing(false);
            setDrawStart(null);
            setCurrentDraw(null);
          }
        }}
        style={{
          position: "absolute",
          bottom: window.innerWidth <= 768 ? "70px" : (window.innerWidth <= 1024 ? "75px" : "20px"),
          right: window.innerWidth <= 1024 ? "10px" : "20px",
          left: window.innerWidth <= 1024 ? "10px" : "20px",
          background: ocrMode ? "rgba(245, 158, 11, 0.95)" : "rgba(107, 114, 128, 0.95)",
          border: "none",
          fontSize: window.innerWidth <= 768 ? "13px" : (window.innerWidth <= 1024 ? "14px" : "15px"),
          cursor: "pointer",
          zIndex: 1001,
          color: "white",
          borderRadius: "25px",
          padding: window.innerWidth <= 768 ? "10px 14px" : (window.innerWidth <= 1024 ? "11px 18px" : "12px 20px"),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: window.innerWidth <= 768 ? "6px" : "8px",
          transition: "all 0.3s ease",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          fontWeight: "600",
          touchAction: "manipulation"
        }}
        title={isKiswahili ? "Soma Maswali kutoka Picha" : "Scan Question from Image"}
      >
        <span style={{ fontSize: window.innerWidth <= 768 ? "16px" : "18px" }}>📸</span>
        <span>{isKiswahili ? "Soma Swali" : "Scan Question"}</span>
      </button>

      {/* Brainwave Assistant Toggle Button */}
      <button
        onClick={() => setShowAIPanel(!showAIPanel)}
        style={{
          position: "absolute",
          bottom: window.innerWidth <= 768 ? "10px" : (window.innerWidth <= 1024 ? "15px" : "20px"),
          right: window.innerWidth <= 1024 ? "10px" : "20px",
          left: window.innerWidth <= 1024 ? "10px" : "auto",
          background: showAIPanel ? "rgba(16, 185, 129, 0.95)" : "rgba(59, 130, 246, 0.95)",
          border: "none",
          fontSize: window.innerWidth <= 768 ? "12px" : (window.innerWidth <= 1024 ? "13px" : "15px"),
          cursor: "pointer",
          zIndex: 1001,
          color: "white",
          borderRadius: "25px",
          padding: window.innerWidth <= 768 ? "10px 12px" : (window.innerWidth <= 1024 ? "11px 16px" : "12px 20px"),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: window.innerWidth <= 768 ? "5px" : (window.innerWidth <= 1024 ? "6px" : "8px"),
          transition: "all 0.3s ease",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          fontWeight: "600",
          whiteSpace: "nowrap",
          touchAction: "manipulation"
        }}
        title={isKiswahili ? "Msaidizi wa Brainwave" : "Brainwave Assistant"}
      >
        <span style={{ fontSize: window.innerWidth <= 768 ? "16px" : "18px" }}>🤖</span>
        <span style={{ fontSize: window.innerWidth <= 375 ? "11px" : (window.innerWidth <= 768 ? "12px" : (window.innerWidth <= 1024 ? "13px" : "15px")) }}>
          {isKiswahili ? "Uliza Brainwave" : "Ask Brainwave"}
        </span>
      </button>

      {/* Main Content Container */}
      <div style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden'
      }}>

        {/* PDF Viewer Section */}
        <div
          ref={containerRef}
          className={ocrMode ? 'ocr-mode-active' : ''}
          style={{
            flex: showAIPanel && window.innerWidth > 768
              ? (window.innerWidth <= 1024 ? '1 1 55%' : '1 1 60%')
              : '1 1 100%',
            height: '100%',
            overflow: 'auto',
            padding: window.innerWidth <= 768 ? '12px' : (window.innerWidth <= 1024 ? '16px' : '20px'),
            scrollbarWidth: 'thin',
            scrollBehavior: 'smooth',
            background: '#f8f9fa',
            transition: 'flex 0.3s ease',
            position: 'relative',
            WebkitOverflowScrolling: 'touch'
          }}
        >
        {/* OCR Mode Indicator */}
        {ocrMode && (
          <div style={{
            position: 'sticky',
            top: window.innerWidth <= 768 ? '50px' : '60px',
            left: 0,
            right: 0,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            padding: window.innerWidth <= 768 ? '10px 12px' : '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: window.innerWidth <= 768 ? '8px' : '12px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            zIndex: 100,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <span style={{ fontSize: '24px' }}>📸</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: window.innerWidth <= 768 ? '13px' : '14px' }}>
                {isKiswahili ? 'Hali ya Kusoma Swali Imewashwa' : 'Scan Question Mode Active'}
              </div>
              <div style={{ fontSize: window.innerWidth <= 768 ? '11px' : '12px', opacity: 0.9 }}>
                {isKiswahili
                  ? '✏️ Chora kisanduku kuzunguka swali, kisha Brainwave itajibu'
                  : '✏️ Draw a box around the question, then Brainwave will answer'}
              </div>
            </div>
            <button
              onClick={() => {
                setOcrMode(false);
                setIsDrawing(false);
                setDrawStart(null);
                setCurrentDraw(null);
                setOcrBox(null);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              ✕
            </button>
          </div>
        )}

        {isLoading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#666'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px'
            }}></div>
            <p>Loading PDF...</p>
            <div style={{
              width: '200px',
              height: '6px',
              backgroundColor: '#f3f3f3',
              borderRadius: '3px',
              overflow: 'hidden',
              marginTop: '10px'
            }}>
              <div style={{
                width: `${loadingProgress}%`,
                height: '100%',
                backgroundColor: '#3498db',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <small style={{ marginTop: '5px' }}>
              {Math.round(loadingProgress)}% loaded
            </small>
          </div>
        )}

        {/* Enhanced Action Buttons for Selected Text */}
        {selectionBox && (
          <div style={{
            position: 'absolute',
            top: selectionBox.top - 55,
            left: selectionBox.left + (selectionBox.width / 2),
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            gap: '8px',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {/* Copy Button */}
            <div style={{
              background: 'linear-gradient(135deg, #007BFF 0%, #0056D2 100%)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 123, 255, 0.4)',
              fontSize: '13px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
            onClick={copyToClipboard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.4)';
            }}>
              📋 {isKiswahili ? 'Nakili' : 'Copy'}
            </div>

            {/* Ask Brainwave Button */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
              fontSize: '13px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
            onClick={handleAskAboutSelection}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
            }}>
              🤖 {isKiswahili ? 'Uliza Brainwave' : 'Ask Brainwave'}
            </div>
          </div>
        )}

        {/* Selection Info Box */}
        {selectionBox && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            maxWidth: '300px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {isKiswahili ? 'Maandishi Yaliyochaguliwa:' : 'Selected Text:'}
            </div>
            <div style={{
              maxHeight: '60px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '1.4'
            }}>
              {selectionBox.text.length > 100
                ? selectionBox.text.substring(0, 100) + '...'
                : selectionBox.text}
            </div>
            <div style={{
              marginTop: '8px',
              fontSize: '11px',
              opacity: 0.7
            }}>
              {selectionBox.text.length} {isKiswahili ? 'herufi' : 'characters'}
            </div>
          </div>
        )}

        {pages.map((page, index) => (
          <div
            key={index}
            style={{
              marginBottom: window.innerWidth <= 768 ? '12px' : '15px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              padding: window.innerWidth <= 768 ? '8px' : '10px'
            }}
          >
            <div style={{
              position: 'relative',
              display: 'inline-block',
              maxWidth: '100%'
            }}>
              <div
                className={ocrMode ? 'ocr-mode-active' : ''}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  userSelect: ocrMode ? 'none' : 'auto',
                  WebkitUserSelect: ocrMode ? 'none' : 'auto',
                  MozUserSelect: ocrMode ? 'none' : 'auto',
                  msUserSelect: ocrMode ? 'none' : 'auto',
                  WebkitTouchCallout: ocrMode ? 'none' : 'default'
                }}
                onMouseDown={(e) => {
                  if (ocrMode) {
                    e.preventDefault();
                    handleMouseDown(e, index);
                  }
                }}
                onMouseMove={(e) => {
                  if (ocrMode) {
                    e.preventDefault();
                    handleMouseMove(e, index);
                  }
                }}
                onMouseUp={(e) => {
                  if (ocrMode) {
                    e.preventDefault();
                    handleMouseUp(e, index);
                  }
                }}
                onMouseLeave={(e) => {
                  if (ocrMode && isDrawing && drawStart?.pageIndex === index) {
                    // Don't auto-complete on mouse leave, just cancel
                    setIsDrawing(false);
                    setDrawStart(null);
                    setCurrentDraw(null);
                  }
                }}
                onDragStart={(e) => ocrMode && e.preventDefault()}
                onSelectStart={(e) => ocrMode && e.preventDefault()}
              >
                <canvas
                  ref={element => {
                    canvasRefs.current[index] = element;
                  }}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '2px',
                    cursor: ocrMode ? 'crosshair' : 'default',
                    pointerEvents: 'none',
                    touchAction: ocrMode ? 'none' : 'auto'
                  }}
                />

                {/* Drawing Selection Box */}
                {currentDraw && currentDraw.pageIndex === index && (() => {
                  const canvas = canvasRefs.current[index];
                  if (!canvas) return null;
                  const rect = canvas.getBoundingClientRect();
                  const scaleX = canvas.width / rect.width;
                  const scaleY = canvas.height / rect.height;

                  // Convert canvas coordinates back to display coordinates
                  const displayX = currentDraw.x / scaleX;
                  const displayY = currentDraw.y / scaleY;
                  const displayWidth = currentDraw.width / scaleX;
                  const displayHeight = currentDraw.height / scaleY;

                  return (
                    <div
                      className="selection-box-drawing"
                      style={{
                        position: 'absolute',
                        left: `${displayX}px`,
                        top: `${displayY}px`,
                        width: `${displayWidth}px`,
                        height: `${displayHeight}px`,
                        border: '3px solid #3b82f6',
                        background: 'rgba(59, 130, 246, 0.15)',
                        pointerEvents: 'none',
                        zIndex: 10,
                        boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(59, 130, 246, 0.3)',
                        borderRadius: '4px'
                      }}
                    />
                  );
                })()}

                {/* OCR Scan Box Overlay */}
                {ocrBox && ocrBox.pageIndex === index && (() => {
                  const canvas = canvasRefs.current[index];
                  if (!canvas) return null;
                  const rect = canvas.getBoundingClientRect();
                  const scaleX = canvas.width / rect.width;
                  const scaleY = canvas.height / rect.height;

                  // Convert canvas coordinates back to display coordinates
                  const displayX = ocrBox.x / scaleX;
                  const displayY = ocrBox.y / scaleY;
                  const displayWidth = ocrBox.width / scaleX;
                  const displayHeight = ocrBox.height / scaleY;

                  return (
                    <div style={{
                      position: 'absolute',
                      left: `${displayX}px`,
                      top: `${displayY}px`,
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`,
                      border: '3px dashed #f59e0b',
                      background: 'rgba(245, 158, 11, 0.1)',
                      pointerEvents: 'none',
                      zIndex: 11,
                      animation: 'pulse 1s ease-in-out infinite'
                    }}>
                      {isOCRProcessing && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(0, 0, 0, 0.8)',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap'
                        }}>
                          📸 {ocrProgress}%
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div
                ref={element => {
                  textLayerRefs.current[index] = element;
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: ocrMode ? 'none' : 'auto',
                  userSelect: ocrMode ? 'none' : 'text',
                  cursor: ocrMode ? 'crosshair' : 'text',
                  display: ocrMode ? 'none' : 'block'
                }}
              />
            </div>
          </div>
        ))}

        {totalPages > pages.length && !isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#666',
            fontStyle: 'italic'
          }}>
            Loading remaining pages... ({pages.length}/{totalPages})
          </div>
        )}
        </div>
        {/* End PDF Viewer Section */}

        {/* AI Assistant Panel */}
        {showAIPanel && (
          <div style={{
            flex: window.innerWidth <= 768 ? '1 1 100%' : (window.innerWidth <= 1024 ? '1 1 45%' : '1 1 40%'),
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: window.innerWidth > 768 ? '2px solid rgba(255, 255, 255, 0.2)' : 'none',
            position: window.innerWidth <= 768 ? 'absolute' : 'relative',
            top: 0,
            right: 0,
            width: window.innerWidth <= 768 ? '100%' : 'auto',
            zIndex: window.innerWidth <= 768 ? 1002 : 'auto',
            maxWidth: window.innerWidth <= 768 ? '100%' : (window.innerWidth <= 1024 ? '500px' : 'none')
          }}>
            {/* AI Panel Header */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'white'
              }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    {isKiswahili ? 'Msaidizi wa Brainwave' : 'Brainwave Assistant'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
                    {isKiswahili ? 'Uliza swali kuhusu PDF' : 'Ask questions about the PDF'}
                  </p>
                </div>
              </div>

              {/* Close Chat Button */}
              <button
                onClick={() => setShowAIPanel(false)}
                style={{
                  width: '100%',
                  padding: '10px 20px',
                  background: 'rgba(239, 68, 68, 0.8)',
                  border: 'none',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.8)';
                }}
              >
                <span>✕</span>
                <span>{isKiswahili ? 'Funga Mazungumzo' : 'Close Chat'}</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: window.innerWidth <= 768 ? '12px' : (window.innerWidth <= 1024 ? '16px' : '20px'),
              display: 'flex',
              flexDirection: 'column',
              gap: window.innerWidth <= 768 ? '10px' : '12px',
              WebkitOverflowScrolling: 'touch'
            }}>
              {aiConversation.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: 'white',
                  opacity: 0.7,
                  marginTop: '40px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                  <p style={{ fontSize: '14px', margin: 0 }}>
                    {isKiswahili
                      ? 'Uliza swali lolote kuhusu PDF hii'
                      : 'Ask any question about this PDF'}
                  </p>
                  <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.6 }}>
                    {isKiswahili
                      ? 'Mfano: "Eleza maudhui ya ukurasa wa kwanza"'
                      : 'Example: "Explain the content of the first page"'}
                  </p>
                </div>
              ) : (
                aiConversation.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: window.innerWidth <= 768 ? '90%' : '85%',
                      background: msg.role === 'user'
                        ? 'rgba(255, 255, 255, 0.95)'
                        : msg.isError
                          ? 'rgba(239, 68, 68, 0.9)'
                          : 'rgba(255, 255, 255, 0.15)',
                      color: msg.role === 'user' ? '#333' : 'white',
                      padding: window.innerWidth <= 768 ? '10px 14px' : '12px 16px',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      fontSize: window.innerWidth <= 768 ? '13px' : '14px',
                      lineHeight: '1.5',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  >
                    {/* Handle both string content and array content (with images) */}
                    {typeof msg.content === 'string' ? (
                      // Use ContentRenderer for AI assistant responses to get beautiful formatting
                      msg.role === 'assistant' ? (
                        <ContentRenderer text={msg.content} />
                      ) : (
                        msg.content
                      )
                    ) : Array.isArray(msg.content) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {msg.content.map((item, idx) => {
                          // Only show images, hide the text prompt for cleaner UI
                          if (item.type === 'image_url') {
                            return (
                              <img
                                key={idx}
                                src={item.image_url.url}
                                alt="Question screenshot"
                                style={{
                                  maxWidth: '100%',
                                  borderRadius: '8px',
                                  marginTop: '4px',
                                  border: '2px solid #e5e7eb',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(item.image_url.url, '_blank')}
                                title={isKiswahili ? 'Bonyeza kuona picha kamili' : 'Click to view full image'}
                              />
                            );
                          }
                          return null;
                        })}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                ))
              )}
              {isAILoading && (
                <div style={{
                  alignSelf: 'flex-start',
                  maxWidth: '85%',
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '18px 18px 18px 4px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'white',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'white',
                    animation: 'pulse 1.5s ease-in-out 0.2s infinite'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'white',
                    animation: 'pulse 1.5s ease-in-out 0.4s infinite'
                  }}></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
              padding: window.innerWidth <= 768 ? '10px' : '12px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {/* Input Container - Matching Floating AI Style */}
              <div style={{
                display: 'flex',
                gap: window.innerWidth <= 768 ? '6px' : '8px',
                background: 'rgba(248, 250, 252, 0.95)',
                borderRadius: window.innerWidth <= 768 ? '12px' : '16px',
                padding: window.innerWidth <= 768 ? '6px' : '8px',
                border: '2px solid rgba(226, 232, 240, 0.8)',
                marginBottom: aiConversation.length > 0 ? '8px' : '0'
              }}>
                <textarea
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isAILoading) {
                      e.preventDefault();
                      handleAskAI();
                    }
                  }}
                  placeholder={isKiswahili ? 'Uliza chochote...' : 'Ask me anything...'}
                  disabled={isAILoading}
                  rows={1}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                    color: '#334155',
                    padding: window.innerWidth <= 768 ? '10px 12px' : '12px 16px',
                    fontFamily: 'inherit',
                    resize: 'none',
                    minHeight: 'auto'
                  }}
                />
                <button
                  onClick={handleAskAI}
                  disabled={!aiQuestion.trim() || isAILoading}
                  style={{
                    background: (!aiQuestion.trim() || isAILoading) ? 'rgba(59, 130, 246, 0.5)' : '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (!aiQuestion.trim() || isAILoading) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: (!aiQuestion.trim() || isAILoading) ? 0.5 : 1,
                    flexShrink: 0
                  }}
                >
                  <span style={{ color: 'white', fontSize: '12px' }}>→</span>
                </button>
              </div>

              {/* Hint Text */}
              <p style={{
                fontSize: window.innerWidth <= 768 ? '9px' : '11px',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                margin: window.innerWidth <= 768 ? '6px 0 0 0' : '8px 0 0 0'
              }}>
                {window.innerWidth <= 768
                  ? (isKiswahili ? 'Enter kusonga' : 'Press Enter to send')
                  : (isKiswahili ? 'Bonyeza Enter kusonga' : 'Press Enter to send')
                }
              </p>

              {/* Clear Conversation Button */}
              {aiConversation.length > 0 && (
                <button
                  onClick={() => {
                    setAiConversation([]);
                    setAiQuestion('');
                    // Clear saved chat from localStorage
                    if (documentUrl) {
                      const chatKey = `pdf_chat_${documentUrl}`;
                      localStorage.removeItem(chatKey);
                    }
                  }}
                  style={{
                    padding: window.innerWidth <= 768 ? '8px 12px' : '6px 12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: window.innerWidth <= 768 ? '11px' : '10px',
                    fontWeight: '500',
                    width: '100%',
                    marginTop: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isKiswahili ? 'Futa Mazungumzo' : 'Clear Conversation'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preview Confirmation Modal */}
      {showPreviewModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelPreview();
            }
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              textAlign: 'center'
            }}>
              {isKiswahili ? '📸 Hakiki Picha Iliyochukuliwa' : '📸 Verify Captured Image'}
            </h3>

            <p style={{
              margin: '0 0 20px 0',
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              {isKiswahili
                ? 'Je, picha hii ina swali kamili? Ikiwa sio, bonyeza "Chagua Tena" kuchagua eneo sahihi.'
                : 'Does this image contain the complete question? If not, click "Re-select" to choose the correct area.'}
            </p>

            {/* Preview Image */}
            <div style={{
              background: '#f3f4f6',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
              border: '2px solid #e5e7eb'
            }}>
              {previewImageData && (
                <img
                  src={previewImageData}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleCancelPreview}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e5e7eb';
                  e.target.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.borderColor = '#d1d5db';
                }}
              >
                {isKiswahili ? '🔄 Chagua Tena' : '🔄 Re-select'}
              </button>

              <button
                onClick={handleConfirmPreview}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                {isKiswahili ? '🤖 Uliza Brainwave' : '🤖 Ask Brainwave'}
              </button>
            </div>

            <p style={{
              margin: '16px 0 0 0',
              fontSize: '12px',
              color: '#9ca3af',
              textAlign: 'center'
            }}>
              {isKiswahili
                ? '💡 Mwongozo: Hakikisha swali lote linaonekana wazi katika picha'
                : '💡 Tip: Make sure the entire question is clearly visible in the image'}
            </p>
          </div>
        </div>
      )}
    </ReactModal>
  );
};

export default PDFModal;
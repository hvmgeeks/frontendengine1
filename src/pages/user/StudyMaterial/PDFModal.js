import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import ReactModal from "react-modal";
import { useLanguage } from "../../../contexts/LanguageContext";
ReactModal.setAppElement('#root');

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@2.15.349/build/pdf.worker.min.js`;

// Add CSS for spinner animation
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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
  const canvasRefs = useRef([]);
  const textLayerRefs = useRef([]);
  const containerRef = useRef(null);
  const renderingRefs = useRef({}); // Track rendering state per page

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

      // Always fit to width for optimal reading experience
      const scale = containerWidth / viewport.width;
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

  // Re-render pages when window is resized
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
          width: window.innerWidth <= 768 ? '95%' : window.innerWidth <= 1024 ? '85%' : '75%',
          height: window.innerWidth <= 768 ? '95%' : '90%',
          padding: window.innerWidth <= 768 ? '10px' : '20px',
          borderRadius: window.innerWidth <= 768 ? '8px' : '12px',
          overflow: 'hidden',
          border: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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

      <div
        ref={containerRef}
        style={{
          height: '100%',
          overflow: 'auto',
          padding: '20px',
          scrollbarWidth: 'thin',
          scrollBehavior: 'smooth',
          background: '#f8f9fa'
        }}
      >
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

        {/* Enhanced Copy Button with Selection Box */}
        {selectionBox && (
          <div style={{
            position: 'absolute',
            top: selectionBox.top - 50,
            left: selectionBox.left + (selectionBox.width / 2) - 75,
            zIndex: 1000,
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
            transform: 'translateX(-50%)',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={copyToClipboard}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateX(-50%) translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateX(-50%) translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.4)';
          }}>
            📋 {isKiswahili ? 'Nakili' : 'Copy'}
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
              marginBottom: '15px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              padding: '10px'
            }}
          >
            <div style={{
              position: 'relative',
              display: 'inline-block',
              maxWidth: '100%'
            }}>
              <canvas
                ref={element => {
                  canvasRefs.current[index] = element;
                }}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                  borderRadius: '2px'
                }}
              />
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
                  pointerEvents: 'auto',
                  userSelect: 'text',
                  cursor: 'text'
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
    </ReactModal>
  );
};

export default PDFModal;
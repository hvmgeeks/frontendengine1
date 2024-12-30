import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import ReactModal from "react-modal";
ReactModal.setAppElement('#root');

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@2.15.349/build/pdf.worker.min.js`;

const PDFModal = ({ modalIsOpen, closeModal, documentUrl }) => {
  const [pages, setPages] = useState([]);
  const canvasRefs = useRef([]);
  const containerRef = useRef(null);
  const renderingRefs = useRef({}); // Track rendering state per page

  const renderPDF = async (url) => {
    try {
      const pdf = await pdfjsLib.getDocument(url).promise;
      console.log("PDF loaded");

      const pagesData = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        pagesData.push(page);
      }

      console.log("All pages loaded:", pagesData.length);
      setPages(pagesData);
    } catch (error) {
      console.error("Error loading PDF:", error);
    }
  };

  const renderPage = async (page, index) => {
    const canvas = canvasRefs.current[index];
    if (!canvas || renderingRefs.current[index] || !containerRef.current) return;

    try {
      renderingRefs.current[index] = true;

      const viewport = page.getViewport({ scale: 1.0 });
      const containerWidth = containerRef.current.clientWidth;
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
      canvasRefs.current = [];
      renderingRefs.current = {};
      renderPDF(documentUrl);
    }
  }, [modalIsOpen, documentUrl]);

  // Effect to render pages when they're loaded
  useEffect(() => {
    if (pages.length > 0 && containerRef.current) {
      pages.forEach((page, index) => {
        renderPage(page, index);
      });
    }
  }, [pages, containerRef.current]);

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
          backgroundColor: 'rgba(0, 0, 0, 0.75)'
        },
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '70%',
          height: '90%',
          padding: '20px',
          borderRadius: '10px',
          overflow: 'hidden',
        },
      }}
    >
      <button
        onClick={closeModal}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "transparent",
          border: "none",
          fontSize: "20px",
          cursor: "pointer",
          zIndex: 1,
        }}
      >
        X
      </button>

      <div
        ref={containerRef}
        style={{
          height: '100%',
          overflow: 'auto',
          padding: '10px',
          scrollbarWidth: 'thin'
        }}
      >
        {pages.map((page, index) => (
          <div
            key={index}
            style={{
              marginBottom: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <canvas
              ref={element => {
                canvasRefs.current[index] = element;
              }}
              style={{
                maxWidth: '100%',
                height: 'auto',
                border: '1px solid black'
              }}
            />
          </div>
        ))}
      </div>
    </ReactModal>
  );
};

export default PDFModal;
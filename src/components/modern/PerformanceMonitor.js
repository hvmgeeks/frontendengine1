import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
  });

  useEffect(() => {
    // Measure page load time
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    
    // Measure memory usage (if available)
    const memoryUsage = performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0; // MB

    setMetrics(prev => ({
      ...prev,
      loadTime,
      memoryUsage,
    }));

    // FPS monitoring
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }, []);

  return metrics;
};

// Performance indicator component
const PerformanceIndicator = ({ show = false }) => {
  const metrics = usePerformanceMonitor();
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  // Completely disable the performance indicator
  return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-4 rounded-lg text-xs font-mono backdrop-blur-sm"
        >
          <div className="space-y-1">
            <div className="font-bold text-green-400 mb-2">Performance Metrics</div>
            <div>Load Time: {metrics.loadTime}ms</div>
            <div>Memory: {metrics.memoryUsage.toFixed(1)}MB</div>
            <div>FPS: {metrics.fps}</div>
            <div className="text-gray-400 mt-2 text-xs">
              Press Ctrl+Shift+P to toggle
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Lazy loading wrapper with intersection observer
export const LazyWrapper = ({ children, threshold = 0.1, rootMargin = '50px' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);

  return (
    <div ref={setRef}>
      {isVisible ? children : <div className="h-32 bg-gray-100 animate-pulse rounded" />}
    </div>
  );
};

// Optimized image component with WebP support
export const OptimizedImage = ({ 
  src, 
  webpSrc, 
  alt, 
  className = '',
  loading = 'lazy',
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = () => {
    setImageError(true);
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {!imageError ? (
        <picture>
          {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
          <motion.img
            src={src}
            alt={alt}
            loading={loading}
            onError={handleError}
            onLoad={handleLoad}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            {...props}
          />
        </picture>
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Image not available</span>
        </div>
      )}
    </div>
  );
};

// Debounced search hook
export const useDebouncedSearch = (searchTerm, delay = 300) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  return debouncedTerm;
};

// Virtual scrolling component for large lists
export const VirtualList = ({ 
  items, 
  itemHeight = 60, 
  containerHeight = 400,
  renderItem,
  className = '' 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div
      ref={setContainerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleStart + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceIndicator;

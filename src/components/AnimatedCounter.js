import React, { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({
  end,
  duration = 2000,
  suffix = '',
  prefix = '',
  className = '',
  delay = 0
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.1 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        const baseValue = typeof end === 'string' ? parseInt(end.replace(/[^\d]/g, '')) : end;
        const startTime = Date.now();

        const continuousAnimate = () => {
          const now = Date.now();
          const elapsed = (now - startTime) / 1000; // Convert to seconds

          // Create a wave-like motion using sine function
          // The number oscillates around the base value
          const amplitude = baseValue * 0.05; // 5% variation
          const frequency = 0.3; // How fast it oscillates
          const wave = Math.sin(elapsed * frequency * Math.PI * 2) * amplitude;

          // Add some randomness for more natural movement
          const randomVariation = (Math.random() - 0.5) * (baseValue * 0.02);

          const currentValue = Math.floor(baseValue + wave + randomVariation);
          setCount(Math.max(0, currentValue)); // Ensure it doesn't go negative

          if (isVisible) {
            animationRef.current = requestAnimationFrame(continuousAnimate);
          }
        };

        animationRef.current = requestAnimationFrame(continuousAnimate);
      }, delay);

      return () => {
        clearTimeout(timer);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      // Stop animation when not visible
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [isVisible, end, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => animationRef.current && cancelAnimationFrame(animationRef.current);
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  const displayValue = () => {
    if (typeof end === 'string' && end.includes('%')) {
      return `${count}%`;
    } else if (typeof end === 'string' && end.includes('K')) {
      return `${formatNumber(count)}+`;
    } else if (typeof end === 'string' && end.includes('M')) {
      return `${formatNumber(count)}+`;
    } else {
      return `${count}%`;
    }
  };

  return (
    <span
      ref={counterRef}
      className={className}
      style={{
        display: 'inline-block',
        transition: 'transform 0.3s ease',
        transform: isVisible ? 'scale(1)' : 'scale(0.95)'
      }}
    >
      {prefix}{displayValue()}{suffix}
    </span>
  );
};

export default AnimatedCounter;

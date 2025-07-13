import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TbClock, TbAlertTriangle } from 'react-icons/tb';

const QuizTimer = ({
  duration, // in seconds
  onTimeUp,
  isActive = true,
  showWarning = true,
  warningThreshold = 300, // 5 minutes
  className = '',
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    setTimeRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        
        const newTime = prev - 1;
        
        // Check if we should show warning
        if (showWarning && newTime <= warningThreshold && !isWarning) {
          setIsWarning(true);
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp, showWarning, warningThreshold, isWarning]);

  // Duolingo-style time formatting (min:sec format)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((duration - timeRemaining) / duration) * 100;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 60) return 'text-white'; // Last minute
    if (timeRemaining <= warningThreshold) return 'text-white'; // Warning
    return 'text-white'; // Normal
  };

  const getProgressColor = () => {
    if (timeRemaining <= 60) return 'from-red-500 to-red-600';
    if (timeRemaining <= warningThreshold) return 'from-yellow-500 to-yellow-600';
    return 'from-primary-500 to-blue-500';
  };

  return (
    <div className={`${className}`}>
      {/* Compact Timer Display */}
      <motion.div
        animate={isWarning ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: isWarning ? Infinity : 0 }}
        className="inline-flex items-center space-x-3 px-6 py-3 rounded-xl shadow-lg border-2"
        style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          background: timeRemaining <= 60
            ? 'linear-gradient(to right, #dc2626, #b91c1c)'
            : 'linear-gradient(to right, #22c55e, #16a34a)',
          borderColor: timeRemaining <= 60 ? '#fca5a5' : '#86efac',
          color: 'white',
          boxShadow: timeRemaining <= 60
            ? '0 0 20px rgba(239, 68, 68, 0.6), 0 4px 20px rgba(0,0,0,0.3)'
            : '0 0 15px rgba(34, 197, 94, 0.4), 0 4px 20px rgba(0,0,0,0.3)',
          animation: timeRemaining <= 60 ? 'pulse 1s infinite' : 'none'
        }}
      >
        {timeRemaining <= warningThreshold && (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <TbAlertTriangle className={`w-5 h-5 drop-shadow-md ${
              timeRemaining <= 60 ? 'text-red-100' : 'text-yellow-100'
            }`} />
          </motion.div>
        )}

        <TbClock
          className="w-5 h-5 drop-shadow-md"
          style={{
            color: 'white',
            animation: timeRemaining <= 60 ? 'bounce 1s infinite' : 'none'
          }}
        />

        <div className="text-center">
          <div
            className="text-xs font-semibold opacity-90 mb-1"
            style={{ color: 'white' }}
          >TIME</div>

          {/* Duolingo-style timer display */}
          <div className="flex items-center justify-center">
            <span
              className="font-mono font-black text-2xl"
              style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                color: 'white',
                animation: timeRemaining <= 60 ? 'pulse 1s infinite' : 'none'
              }}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <div className="mt-3 w-full bg-gray-300 rounded-full h-2 overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${getProgressPercentage()}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full shadow-sm`}
        />
      </div>

      {/* Warning Message */}
      {isWarning && timeRemaining > 60 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm font-semibold bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg border border-yellow-300"
        >
          ⚠️ {Math.floor(timeRemaining / 60)} minutes remaining
        </motion.div>
      )}

      {/* Critical Warning */}
      {timeRemaining <= 60 && timeRemaining > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm font-bold bg-red-100 text-red-800 px-3 py-2 rounded-lg border border-red-300"
        >
          🚨 Less than 1 minute left!
        </motion.div>
      )}

      {/* Time's Up */}
      {timeRemaining === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 text-sm font-black bg-red-200 text-red-900 px-3 py-2 rounded-lg border border-red-400"
        >
          ⏰ Time's up!
        </motion.div>
      )}
    </div>
  );
};

// Full-screen timer overlay for critical moments
export const QuizTimerOverlay = ({ timeRemaining, onClose }) => {
  if (timeRemaining > 10) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-4"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          ⏰
        </motion.div>
        
        <h3 className="text-2xl font-bold text-red-600 mb-2">
          Time Almost Up!
        </h3>
        
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-4xl font-mono font-bold text-red-600 mb-4"
        >
          {timeRemaining}
        </motion.div>
        
        <p className="text-gray-600 mb-4">
          Submit your answers now!
        </p>
        
        <button
          onClick={onClose}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Continue Quiz
        </button>
      </motion.div>
    </motion.div>
  );
};

export default QuizTimer;

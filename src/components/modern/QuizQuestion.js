import React, { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TbCheck, TbX, TbClock, TbBulb } from 'react-icons/tb';
import { Card, Button } from './index';

const QuizQuestion = ({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onNext,
  onPrevious,
  showResult = false,
  correctAnswer = null,
  timeRemaining = null,
  isLastQuestion = false,
  className = '',
}) => {
  const [selectedOption, setSelectedOption] = useState(selectedAnswer);

  useEffect(() => {
    setSelectedOption(selectedAnswer);
  }, [selectedAnswer]);

  const handleOptionSelect = (optionIndex) => {
    if (showResult) return; // Prevent selection when showing results
    
    setSelectedOption(optionIndex);
    onAnswerSelect(optionIndex);
  };

  const getOptionClassName = (optionIndex) => {
    const baseClasses = 'quiz-option group cursor-pointer';
    
    if (showResult) {
      if (optionIndex === correctAnswer) {
        return `${baseClasses} quiz-option-correct cursor-default`;
      }
      if (optionIndex === selectedOption && optionIndex !== correctAnswer) {
        return `${baseClasses} quiz-option-incorrect cursor-default`;
      }
      return `${baseClasses} opacity-60 cursor-default`;
    }
    
    if (optionIndex === selectedOption) {
      return `${baseClasses} quiz-option-selected`;
    }
    
    return baseClasses;
  };

  const getOptionIcon = (optionIndex) => {
    if (!showResult) return null;
    
    if (optionIndex === correctAnswer) {
      return <TbCheck className="w-5 h-5 text-success-600" />;
    }
    if (optionIndex === selectedOption && optionIndex !== correctAnswer) {
      return <TbX className="w-5 h-5 text-error-600" />;
    }
    return null;
  };

  const renderQuestionContent = () => {
    // Check for image in multiple possible properties
    const questionImage = question.image || question.imageUrl;

    // Debug logging for image detection removed to prevent React rendering issues

    switch (question.type) {
      case 'image':
        return (
          <div className="space-y-6">
            {questionImage && (
              <div className="quiz-image-container-modern">
                <div className="quiz-image-wrapper">
                  <img
                    src={questionImage}
                    alt="Question diagram"
                    className="quiz-image-modern"
                    onError={(e) => {
                      console.error('Image failed to load:', questionImage);
                      e.target.style.display = 'none';
                      // Show error message
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'text-red-500 text-sm text-center p-4 bg-red-50 rounded-lg border border-red-200';
                      errorDiv.textContent = 'Image could not be loaded. Please check the image URL.';
                      e.target.parentNode.appendChild(errorDiv);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', questionImage);
                    }}
                  />
                </div>
              </div>
            )}
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              {question.name}
            </div>
          </div>
        );
      
      case 'fill':
        return (
          <div className="space-y-4">
            {/* Show image if available */}
            {questionImage && (
              <div className="quiz-image-container-modern">
                <div className="quiz-image-wrapper">
                  <img
                    src={questionImage}
                    alt="Question diagram"
                    className="quiz-image-modern"
                    onError={(e) => {
                      console.error('Image failed to load:', questionImage);
                      e.target.style.display = 'none';
                      // Show error message
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'text-red-500 text-sm text-center p-4 bg-red-50 rounded-lg border border-red-200';
                      errorDiv.textContent = 'Image could not be loaded. Please check the image URL.';
                      e.target.parentNode.appendChild(errorDiv);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', questionImage);
                    }}
                  />
                </div>
              </div>
            )}
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              {String(question.name || '')}
            </div>
            {!showResult ? (
              <input
                type="text"
                value={selectedOption || ''}
                onChange={(e) => handleOptionSelect(e.target.value)}
                className="input-modern"
                placeholder="Type your answer here..."
              />
            ) : (
              <div className="space-y-2">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Your answer: </span>
                  <span className={selectedOption === correctAnswer ? 'text-success-600 font-medium' : 'text-error-600 font-medium'}>
                    {selectedOption || 'No answer provided'}
                  </span>
                </div>
                <div className="p-4 bg-success-50 rounded-lg">
                  <span className="text-sm text-success-600">Correct answer: </span>
                  <span className="text-success-700 font-medium">{correctAnswer}</span>
                </div>
              </div>
            )}
          </div>
        );
      
      default: // MCQ
        return (
          <div className="space-y-6">
            {/* Show image if available for any question type */}
            {questionImage && (
              <div className="quiz-image-container-modern">
                <div className="quiz-image-wrapper">
                  <img
                    src={questionImage}
                    alt="Question diagram"
                    className="quiz-image-modern"
                    onError={(e) => {
                      console.error('Image failed to load:', questionImage);
                      e.target.style.display = 'none';
                      // Show error message
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'text-red-500 text-sm text-center p-4 bg-red-50 rounded-lg border border-red-200';
                      errorDiv.textContent = 'Image could not be loaded. Please check the image URL.';
                      e.target.parentNode.appendChild(errorDiv);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', questionImage);
                    }}
                  />
                </div>
              </div>
            )}
            <div
              className="text-lg font-medium text-gray-900 dark:text-white"
              style={{
                fontSize: window.innerWidth <= 480 ? '1.25rem' : window.innerWidth <= 768 ? '1.375rem' : '1.5rem',
                lineHeight: '1.8',
                fontWeight: '600'
              }}
            >
              {String(question.name || '')}
            </div>
            <div className="space-y-3">
              {question.options ? (() => {
                try {
                  // Handle both object and array formats
                  let optionsArray = [];
                  if (Array.isArray(question.options)) {
                    optionsArray = question.options
                      .filter(option => option && typeof option === 'string')
                      .map(option => String(option).trim())
                      .filter(option => option.length > 0);
                  } else if (typeof question.options === 'object' && question.options !== null) {
                    optionsArray = Object.values(question.options)
                      .filter(option => option && typeof option === 'string')
                      .map(option => String(option).trim())
                      .filter(option => option.length > 0);
                  }

                  // Ensure we always return valid JSX
                  if (optionsArray.length === 0) {
                    return (
                      <div className="text-gray-500 text-center py-4">
                        No valid options available
                      </div>
                    );
                  }

                  return (
                    <React.Fragment>
                      {optionsArray.map((option, index) => (
                        <motion.div
                          key={`option-${index}`}
                          whileHover={!showResult ? { scale: 1.02 } : {}}
                          whileTap={!showResult ? { scale: 0.98 } : {}}
                          className={getOptionClassName(index)}
                          onClick={() => handleOptionSelect(index)}
                          style={{
                            fontSize: window.innerWidth <= 480 ? '1.125rem' : window.innerWidth <= 768 ? '1.25rem' : '1.25rem',
                            padding: window.innerWidth <= 480 ? '1rem' : window.innerWidth <= 768 ? '1.125rem' : '1.25rem',
                            lineHeight: '1.6',
                            minHeight: window.innerWidth <= 480 ? '56px' : window.innerWidth <= 768 ? '60px' : '64px'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600"
                                style={{
                                  fontSize: window.innerWidth <= 480 ? '1rem' : '1.125rem',
                                  fontWeight: '600'
                                }}
                              >
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span
                                className="text-gray-900 dark:text-white"
                                style={{
                                  fontSize: window.innerWidth <= 480 ? '1.125rem' : window.innerWidth <= 768 ? '1.25rem' : '1.25rem',
                                  lineHeight: '1.6'
                                }}
                              >
                                {String(option)}
                              </span>
                            </div>
                            {getOptionIcon(index)}
                          </div>
                        </motion.div>
                      ))}
                    </React.Fragment>
                  );
                } catch (error) {
                  console.error('Error rendering options:', error);
                  return (
                    <div className="text-red-500 text-center py-4">
                      Error loading options
                    </div>
                  );
                }
              })() : (
                <div className="text-gray-500 text-center py-4">
                  No options available
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-gray-500">
            {questionNumber} of {totalQuestions}
          </div>
          <div className="progress-bar w-32">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              className="progress-fill"
            />
          </div>
        </div>
        
        {timeRemaining !== null && (
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            timeRemaining <= 60 ? 'bg-error-100 text-error-700' : 'bg-primary-100 text-primary-700'
          }`}>
            <TbClock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Question Card */}
      <Card className="p-8">
        {renderQuestionContent()}
      </Card>

      {/* Explanation (shown after answer) */}
      <AnimatePresence>
        {showResult && question.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start space-x-3">
                <TbBulb className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Explanation</h4>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    {String(question.explanation || '')}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button
          variant="secondary"
          onClick={onPrevious}
          disabled={questionNumber === 1}
        >
          Previous
        </Button>
        
        <div className="text-sm text-gray-500">
          {selectedOption !== null && selectedOption !== undefined ? (
            <span className="text-primary-600 font-medium">Answer selected</span>
          ) : (
            <span>Select an answer to continue</span>
          )}
        </div>
        
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!showResult && (selectedOption === null || selectedOption === undefined)}
        >
          {isLastQuestion ? 'Finish Quiz' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

export default QuizQuestion;

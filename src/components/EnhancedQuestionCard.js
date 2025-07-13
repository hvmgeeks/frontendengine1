import React from 'react';

const EnhancedQuestionCard = ({ question, showAnswer = false, userAnswer = null }) => {
  // Safe property access with fallbacks
  const questionName = question?.name || 'Question not available';
  const questionType = question?.type || question?.answerType || 'Unknown';
  const difficulty = question?.difficultyLevel || 'Not specified';
  const isAIGenerated = question?.isAIGenerated || false;
  
  // Safe options handling - works with both object and array formats
  const getOptions = () => {
    if (!question?.options) return [];
    
    if (Array.isArray(question.options)) {
      return question.options.filter(option => 
        option && typeof option === 'string' && option.trim()
      );
    }
    
    if (typeof question.options === 'object') {
      return Object.entries(question.options)
        .filter(([key, value]) => value && typeof value === 'string' && value.trim())
        .map(([key, value]) => ({ key, value: value.trim() }));
    }
    
    return [];
  };

  const options = getOptions();
  const correctAnswer = question?.correctOption || question?.correctAnswer;

  return (
    <div className="enhanced-question-card bg-white rounded-lg shadow-md p-6 mb-4 border border-gray-200">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{questionName}</h3>
        {isAIGenerated && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            AI Generated
          </span>
        )}
      </div>

      {/* Question Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
        <div>
          <strong>Type:</strong> {questionType}
        </div>
        <div>
          <strong>Difficulty:</strong> {difficulty}
        </div>
      </div>

      {/* Question Image (if available) */}
      {(question?.image || question?.imageUrl) && (
        <div className="mb-4">
          <img
            src={question.image || question.imageUrl}
            alt="Question diagram"
            className="max-w-full h-auto rounded-lg border border-gray-300"
            style={{ maxHeight: '300px' }}
          />
        </div>
      )}

      {/* Options Rendering */}
      {options.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Options:</h4>
          <ul className="space-y-2">
            {options.map((option, index) => {
              const optionText = typeof option === 'string' ? option : option.value;
              const optionKey = typeof option === 'string' ? String.fromCharCode(65 + index) : option.key;
              const isCorrect = showAnswer && (optionKey === correctAnswer || optionText === correctAnswer);
              const isUserAnswer = userAnswer && (optionKey === userAnswer || optionText === userAnswer);
              
              return (
                <li 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    isCorrect 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : isUserAnswer 
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="font-medium">{optionKey}:</span> {optionText}
                  {isCorrect && showAnswer && (
                    <span className="ml-2 text-green-600">✓ Correct</span>
                  )}
                  {isUserAnswer && !isCorrect && showAnswer && (
                    <span className="ml-2 text-red-600">✗ Your Answer</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Fill-in-the-blank or Free Text Answer */}
      {(questionType === 'Fill in the Blank' || questionType === 'Free Text') && showAnswer && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Correct Answer:</h4>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {correctAnswer}
          </div>
          {userAnswer && (
            <div className="mt-2">
              <h5 className="font-medium text-gray-700 mb-1">Your Answer:</h5>
              <div className={`p-3 border rounded-lg ${
                userAnswer === correctAnswer 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {userAnswer}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Debug Information (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-500">Debug Info</summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(question, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default EnhancedQuestionCard;

// Usage examples:
// 
// Basic usage:
// <EnhancedQuestionCard question={question} />
//
// With answer reveal:
// <EnhancedQuestionCard question={question} showAnswer={true} />
//
// With user answer comparison:
// <EnhancedQuestionCard 
//   question={question} 
//   showAnswer={true} 
//   userAnswer={selectedAnswer} 
// />
//
// In a list:
// {questions.map(q => (
//   <EnhancedQuestionCard 
//     key={q._id} 
//     question={q} 
//     showAnswer={showAnswers}
//     userAnswer={userAnswers[q._id]}
//   />
// ))}

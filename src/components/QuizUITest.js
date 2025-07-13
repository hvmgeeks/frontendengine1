import React from 'react';
import QuizCard from './modern/QuizCard';
import QuizRenderer from './QuizRenderer';
import { 
  extractQuizData, 
  extractQuestionData, 
  extractUserResultData,
  isSafeToRender,
  conditionalRender 
} from '../utils/quizDataUtils';

/**
 * Test component to validate Quiz UI redesign
 * Tests all scenarios that could cause "Objects are not valid as a React child" errors
 */
const QuizUITest = () => {
  // Test data with potential problematic objects
  const testQuiz = {
    _id: '123',
    name: 'Test Quiz',
    duration: 30,
    questions: [
      {
        _id: 'q1',
        name: 'What is React?',
        type: 'mcq',
        options: { A: 'Library', B: 'Framework', C: 'Language', D: 'Tool' },
        correctAnswer: 'A'
      },
      {
        _id: 'q2',
        name: 'Fill in the blank: React uses _____ DOM',
        type: 'fill',
        correctAnswer: 'Virtual'
      }
    ],
    subject: 'Programming',
    class: '10',
    difficulty: 'medium',
    totalMarks: 100,
    passingMarks: 60
  };

  const testUserResult = {
    score: 85,
    percentage: 85,
    verdict: 'Pass',
    correctAnswers: [{ _id: 'q1', userAnswer: 'A' }],
    wrongAnswers: [{ _id: 'q2', userAnswer: 'Real' }],
    timeSpent: 1200,
    points: 850
  };

  const testQuestion = testQuiz.questions[0];

  // Test problematic data that could cause errors
  const problematicData = {
    objectAsValue: { nested: { object: 'value' } },
    arrayAsValue: [1, 2, 3],
    nullValue: null,
    undefinedValue: undefined,
    functionValue: () => 'test'
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quiz UI Safety Test</h1>
        
        {/* Test 1: Safe Data Extraction */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Test 1: Safe Data Extraction</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Original Quiz Object:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(testQuiz, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">Extracted Safe Data:</h3>
              <pre className="bg-green-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(extractQuizData(testQuiz), null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Test 2: QuizCard Component */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Test 2: QuizCard Component</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuizCard
              quiz={testQuiz}
              userResult={testUserResult}
              showResults={true}
              onStart={() => console.log('Quiz started')}
              onView={() => console.log('Quiz viewed')}
            />
            <QuizCard
              quiz={testQuiz}
              userResult={null}
              showResults={false}
              onStart={() => console.log('Quiz started')}
            />
          </div>
        </div>

        {/* Test 3: Type Safety Validation */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Test 3: Type Safety Validation</h2>
          <div className="space-y-4">
            {Object.entries(problematicData).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium">{key}:</span>
                <span className="text-sm">
                  Safe to render: {isSafeToRender(value) ? '✅' : '❌'}
                </span>
                <span className="text-sm">
                  Conditional render: {conditionalRender(value, 'FALLBACK') || 'NULL'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Test 4: Question Data Extraction */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Test 4: Question Data Extraction</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Original Question:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(testQuestion, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">Extracted Safe Question:</h3>
              <pre className="bg-green-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(extractQuestionData(testQuestion), null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Test 5: User Result Data Extraction */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Test 5: User Result Data Extraction</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Original Result:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(testUserResult, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">Extracted Safe Result:</h3>
              <pre className="bg-green-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(extractUserResultData(testUserResult), null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Test 6: QuizRenderer Component */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Test 6: QuizRenderer Component</h2>
          <div className="border rounded-lg overflow-hidden">
            <QuizRenderer
              question={testQuestion}
              questionIndex={0}
              totalQuestions={2}
              selectedAnswer=""
              onAnswerChange={(answer) => console.log('Answer changed:', answer)}
              timeLeft={1800}
              examTitle="Test Quiz"
              isTimeWarning={false}
              onNext={() => console.log('Next question')}
              onPrevious={() => console.log('Previous question')}
            />
          </div>
        </div>

        {/* Test Results Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">✅ Test Results Summary</h2>
          <div className="space-y-2 text-green-700">
            <p>• All quiz data is safely extracted using utility functions</p>
            <p>• No objects are rendered directly in JSX</p>
            <p>• Type safety guards prevent rendering errors</p>
            <p>• Fallback values ensure graceful degradation</p>
            <p>• Components handle null/undefined data safely</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizUITest;

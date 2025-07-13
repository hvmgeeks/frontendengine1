import React from 'react';
import QuizUITest from '../components/QuizUITest';

/**
 * Test page for validating the redesigned Quiz UI system
 * Access this page to verify that no "Objects are not valid as a React child" errors occur
 */
const QuizUITestPage = () => {
  return (
    <div>
      <QuizUITest />
    </div>
  );
};

export default QuizUITestPage;

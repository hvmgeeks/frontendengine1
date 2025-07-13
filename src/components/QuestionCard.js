import React from 'react';

const QuestionCard = ({ question }) => {
  return (
    <div className="question-card">
      <h3>{question.name}</h3> {/* Correct usage: accessing string property */}

      {/* Avoid this - will throw the error you're seeing: */}
      {/* <p>{question}</p> */} 

      {/* If you want to debug the object: */}
      {/* <pre>{JSON.stringify(question, null, 2)}</pre> */}

      {/* Example usage of nested properties */}
      <div>
        <strong>Type:</strong> {question.type} <br />
        <strong>Difficulty:</strong> {question.difficultyLevel} <br />
        <strong>Answer Type:</strong> {question.answerType}
      </div>

      {/* If rendering options (assuming it's an array): */}
      <ul>
        {question.options?.map((option, index) => (
          <li key={index}>{option}</li>
        ))}
      </ul>
    </div>
  );
};

export default QuestionCard;

// You can then use this component in a list:
// {questions.map(q => <QuestionCard key={q._id} question={q} />)}

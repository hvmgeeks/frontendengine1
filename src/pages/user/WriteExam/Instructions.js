import React from "react";
import { useNavigate } from "react-router-dom";

function Instructions({ examData, setView, startTimer, questions = [] }) {
  const navigate = useNavigate();

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Instructions</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Simplified Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border-0 p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              {examData.name}
            </h1>
            <p className="text-lg text-gray-600 font-medium">Challenge your brain, Beat the rest</p>

            {/* Debug Info */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
              <p><strong>Questions Available:</strong> {questions.length}</p>
              <p><strong>Exam ID:</strong> {examData._id}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-white mb-2">{Math.round(examData.duration / 60)} min</div>
              <div className="text-sm font-semibold text-blue-100">Duration</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-white mb-2">{examData.totalMarks}</div>
              <div className="text-sm font-semibold text-green-100">Total Marks</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
              onClick={() => navigate('/user/quiz')}
            >
              Cancel
            </button>
            <button
              className={`px-8 py-3 rounded-xl font-bold transform transition-all duration-300 shadow-lg ${
                questions.length > 0
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-105'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
              onClick={() => {
                if (questions.length > 0) {
                  console.log("Starting quiz with", questions.length, "questions");
                  startTimer();
                  setView("questions");
                } else {
                  alert("Cannot start quiz: No questions available!");
                }
              }}
              disabled={questions.length === 0}
            >
              {questions.length > 0 ? 'Start Quiz' : 'No Questions Available'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Instructions;
import { message } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getExamById } from "../../../apicalls/exams";
import { addReport } from "../../../apicalls/reports";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import Instructions from "./Instructions";
import Pass from "../../../assets/pass.gif";
import Fail from "../../../assets/fail.gif";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";
import PassSound from "../../../assets/pass.mp3";
import FailSound from "../../../assets/fail.mp3";
import { chatWithChatGPTToGetAns, chatWithChatGPTToExplainAns } from "../../../apicalls/chat";
import { useLanguage } from "../../../contexts/LanguageContext";
import XPResultDisplay from "../../../components/modern/XPResultDisplay";
import { extractUserResultData, safeNumber } from "../../../utils/quizDataUtils";
import ContentRenderer from "../../../components/ContentRenderer";

// Minimal Safe Quiz Component
const MinimalQuizRenderer = ({ question, questionIndex, totalQuestions, selectedAnswer, onAnswerSelect, onNext, onPrevious, timeLeft, examTitle }) => {
  // Safety checks
  if (!question) {
    return <div>Loading question...</div>;
  }

  // Convert everything to safe strings
  const questionText = question.name ? String(question.name) : 'Question text not available';
  const answerType = question.answerType ? String(question.answerType) : 'Options';

  // Process options safely
  let options = [];
  if (question.options) {
    if (Array.isArray(question.options)) {
      options = question.options.map(opt => String(opt || ''));
    } else if (typeof question.options === 'object') {
      options = Object.values(question.options).map(opt => String(opt || ''));
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)' }}>
      {/* Simple Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
              {examTitle ? String(examTitle) : 'Quiz'}
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              Question {questionIndex + 1} of {totalQuestions}
            </p>
          </div>

          <div style={{
            background: timeLeft <= 60 ? '#dc2626' : '#2563eb',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            fontFamily: 'monospace',
            fontWeight: 'bold'
          }}>
            TIME: {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '32px',
          marginBottom: '24px'
        }}>
          {/* Question Number Badge */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{
              background: '#dbeafe',
              color: '#1e40af',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Question {questionIndex + 1} of {totalQuestions}
            </span>
          </div>

          {/* Question Text with Math Support */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '500',
              color: '#111827',
              lineHeight: '1.6'
            }}>
              <ContentRenderer text={questionText} />
            </div>
          </div>

          {/* Image */}
          {(question.image || question.imageUrl) && (
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
              <img
                src={question.image || question.imageUrl}
                alt="Question"
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}
              />
            </div>
          )}

          {/* Answer Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {answerType === "Options" && options.length > 0 ? (
              options.map((option, index) => {
                const letter = String.fromCharCode(65 + index);
                const isSelected = selectedAnswer === index;

                return (
                  <button
                    key={index}
                    onClick={() => onAnswerSelect(index)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '16px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #2563eb' : '2px solid #e5e7eb',
                      background: isSelected ? '#eff6ff' : 'white',
                      color: isSelected ? '#1e40af' : '#111827',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isSelected ? '#2563eb' : '#f3f4f6',
                      color: isSelected ? 'white' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {letter}
                    </div>
                    <div style={{ flex: 1, fontWeight: '500' }}>
                      <ContentRenderer text={option} />
                    </div>
                    {isSelected && (
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#2563eb',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        ✓
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Your Answer:
                </label>
                <input
                  type="text"
                  value={selectedAnswer || ''}
                  onChange={(e) => onAnswerSelect(e.target.value)}
                  placeholder="Type your answer here..."
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onPrevious}
            disabled={questionIndex === 0}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: questionIndex === 0 ? 'not-allowed' : 'pointer',
              background: questionIndex === 0 ? '#e5e7eb' : '#4b5563',
              color: questionIndex === 0 ? '#9ca3af' : 'white'
            }}
          >
            ← Previous
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Progress</div>
            <div style={{
              width: '200px',
              height: '8px',
              background: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  height: '100%',
                  background: '#2563eb',
                  borderRadius: '4px',
                  width: ((questionIndex + 1) / totalQuestions) * 100 + '%',
                  transition: 'width 0.3s'
                }}
              />
            </div>
          </div>

          <button
            onClick={onNext}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              background: '#2563eb',
              color: 'white'
            }}
          >
            {questionIndex === totalQuestions - 1 ? 'Submit Quiz' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Minimal Safe Review Component
const MinimalReviewRenderer = ({
  questions,
  selectedOptions,
  explanations,
  fetchExplanation,
  setView,
  examData,
  setSelectedQuestionIndex,
  setSelectedOptions,
  setResult,
  setTimeUp,
  setSecondsLeft,
  setExplanations
}) => {
  if (!questions || !Array.isArray(questions)) {
    return <div>No questions to review</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb', margin: '0 0 8px 0' }}>
              Answer Review
            </h2>
            <p style={{ color: '#64748b', margin: 0 }}>Review your answers and get explanations</p>
          </div>
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {questions.map((question, index) => {
            if (!question) return null;

            const questionText = question.name ? String(question.name) : 'Question not available';
            const answerType = question.answerType ? String(question.answerType) : 'Options';
            const userAnswer = selectedOptions[index];

            let isCorrect = false;
            let correctAnswerText = 'Unknown';
            let userAnswerText = 'Not answered';

            if (answerType === "Options") {
              isCorrect = question.correctOption === userAnswer;

              if (question.options && question.correctOption !== undefined) {
                const correctOpt = question.options[question.correctOption];
                correctAnswerText = correctOpt ? String(correctOpt) : 'Unknown';
              }

              if (question.options && userAnswer !== undefined) {
                const userOpt = question.options[userAnswer];
                userAnswerText = userOpt ? String(userOpt) : 'Not answered';
              }
            } else {
              isCorrect = question.correctAnswer === userAnswer;
              correctAnswerText = question.correctAnswer ? String(question.correctAnswer) : 'Unknown';
              userAnswerText = userAnswer ? String(userAnswer) : 'Not answered';
            }

            return (
              <div
                key={question._id || index}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: '2px solid ' + (isCorrect ? '#10b981' : '#ef4444'),
                  padding: '16px',
                  background: isCorrect ? '#f0fdf4' : '#fef2f2'
                }}
              >
                {/* Question */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#2563eb',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      flexShrink: 0,
                      marginTop: '4px'
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        color: '#1e293b',
                        fontWeight: '500',
                        lineHeight: '1.6',
                        margin: 0
                      }}>
                        {questionText}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Your Answer */}
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Your Answer: </span>
                  <span style={{
                    fontWeight: '500',
                    color: isCorrect ? '#059669' : '#dc2626'
                  }}>
                    {userAnswerText}
                  </span>
                  <span style={{
                    marginLeft: '12px',
                    fontSize: '18px',
                    color: isCorrect ? '#10b981' : '#ef4444'
                  }}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                </div>

                {/* Correct Answer */}
                {!isCorrect && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Correct Answer: </span>
                    <span style={{ fontWeight: '500', color: '#059669' }}>{correctAnswerText}</span>
                    <span style={{ marginLeft: '12px', fontSize: '18px', color: '#10b981' }}>✓</span>
                  </div>
                )}

                {/* Explanation Button */}
                {!isCorrect && (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={() => {
                        fetchExplanation(
                          questionText,
                          correctAnswerText,
                          userAnswerText,
                          question.image || question.imageUrl || ''
                        );
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>💡</span>
                      <span>Get Explanation</span>
                    </button>
                  </div>
                )}

                {/* Explanation */}
                {explanations[questionText] && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '8px',
                    borderLeft: '4px solid #2563eb',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '18px', marginRight: '8px' }}>💡</span>
                      <h6 style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '16px', margin: 0 }}>
                        Explanation
                      </h6>
                    </div>

                    {/* Image */}
                    {(question.image || question.imageUrl) && (
                      <div style={{
                        marginBottom: '12px',
                        padding: '8px',
                        background: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                            📊 Reference Diagram:
                          </span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <img
                            src={question.image || question.imageUrl}
                            alt="Question diagram"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db'
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div style={{
                      fontSize: '14px',
                      color: '#1f2937',
                      lineHeight: '1.6',
                      background: '#f9fafb',
                      padding: '8px',
                      borderRadius: '6px'
                    }}>
                      {explanations[questionText] ? String(explanations[questionText]) : ''}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 640 ? 'column' : 'row',
          gap: '16px',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setView("result")}
            style={{
              padding: '16px 32px',
              background: '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            ← Back to Results
          </button>

          <button
            onClick={() => {
              setView("instructions");
              setSelectedQuestionIndex(0);
              setSelectedOptions({});
              setResult({});
              setTimeUp(false);
              setSecondsLeft(examData?.duration || 0);
              setExplanations({});
            }}
            style={{
              padding: '16px 32px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            🔄 Retake Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

function WriteExam() {
  const { isKiswahili } = useLanguage();
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [result, setResult] = useState({});
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [view, setView] = useState("instructions");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const { user } = useSelector((state) => state.user);

  const { width, height } = useWindowSize();
  const [explanations, setExplanations] = useState({});

  const getExamData = useCallback(async () => {
    try {
      setIsLoading(true);
      dispatch(ShowLoading());
      console.log("Fetching exam data for ID:", params.id);

      const response = await getExamById({ examId: params.id });
      console.log("Exam API Response:", response);

      dispatch(HideLoading());
      setIsLoading(false);

      if (response.success) {
        const examData = response.data;

        // Check different possible question locations
        let questions = [];
        if (examData?.questions && Array.isArray(examData.questions)) {
          questions = examData.questions;
        } else if (examData?.question && Array.isArray(examData.question)) {
          questions = examData.question;
        } else if (examData && Array.isArray(examData)) {
          questions = examData;
        }

        console.log("Exam Data:", examData);
        console.log("Questions found:", questions.length);
        console.log("Exam Data structure:", Object.keys(examData || {}));

        setQuestions(questions);
        setExamData(examData);
        setSecondsLeft(examData?.duration || 0);

        if (questions.length === 0) {
          console.warn("No questions found in exam data");
          console.log("Full response for debugging:", response);
          message.warning("This exam has no questions. Please contact your instructor.");
        }
      } else {
        console.error("API Error:", response.message);
        console.log("Full error response:", response);
        message.error(response.message || "Failed to load exam data");
      }
    } catch (error) {
      dispatch(HideLoading());
      setIsLoading(false);
      console.error("Exception in getExamData:", error);
      message.error(error.message || "Failed to load exam. Please try again.");
    }
  }, [params.id, dispatch]);

  const checkFreeTextAnswers = async (payload) => {
    if (!payload.length) return [];
    const { data } = await chatWithChatGPTToGetAns(payload);
    return data;
  };

  const calculateResult = useCallback(async () => {
    try {
      // Check if user is available
      if (!user || !user._id) {
        message.error("User not found. Please log in again.");
        navigate("/login");
        return;
      }

      dispatch(ShowLoading());

      const freeTextPayload = [];
      const indexMap = [];

      questions.forEach((q, idx) => {
        if (q.answerType === "Free Text" || q.answerType === "Fill in the Blank") {
          indexMap.push(idx);
          freeTextPayload.push({
            question: q.name,
            expectedAnswer: q.correctAnswer || q.correctOption,
            userAnswer: selectedOptions[idx] || "",
          });
        }
      });

      const gptResults = await checkFreeTextAnswers(freeTextPayload);
      const gptMap = {};

      gptResults.forEach((r) => {
        if (r.result && typeof r.result.isCorrect === "boolean") {
          gptMap[r.question] = r.result;
        } else if (typeof r.isCorrect === "boolean") {
          gptMap[r.question] = { isCorrect: r.isCorrect, reason: r.reason || "" };
        }
      });

      const correctAnswers = [];
      const wrongAnswers = [];
      const wrongPayload = [];

      questions.forEach((q, idx) => {
        const userAnswerKey = selectedOptions[idx] || "";

        if (q.answerType === "Free Text" || q.answerType === "Fill in the Blank") {
          const { isCorrect = false, reason = "" } = gptMap[q.name] || {};
          const enriched = { ...q, userAnswer: userAnswerKey, reason };

          if (isCorrect) {
            correctAnswers.push(enriched);
          } else {
            wrongAnswers.push(enriched);
            wrongPayload.push({
              question: q.name,
              expectedAnswer: q.correctAnswer || q.correctOption,
              userAnswer: userAnswerKey,
            });
          }
        } else if (q.answerType === "Options") {
          const correctKey = q.correctOption;
          const correctValue = (q.options && q.options[correctKey]) || correctKey;
          const userValue = (q.options && q.options[userAnswerKey]) || userAnswerKey || "";

          const isCorrect = correctKey === userAnswerKey;
          const enriched = { ...q, userAnswer: userAnswerKey };

          if (isCorrect) {
            correctAnswers.push(enriched);
          } else {
            wrongAnswers.push(enriched);
            wrongPayload.push({
              question: q.name,
              expectedAnswer: correctValue,
              userAnswer: userValue,
            });
          }
        }
      });

      // Calculate time spent
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      const totalTimeAllowed = (examData?.duration || 0) * 60; // Convert minutes to seconds

      // Calculate score and points
      const totalQuestions = questions.length;
      const correctCount = correctAnswers.length;
      const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
      const points = correctCount * 10; // 10 points per correct answer

      // Determine pass/fail based on percentage
      const passingPercentage = examData.passingMarks || 70; // Default 70%
      const verdict = scorePercentage >= passingPercentage ? "Pass" : "Fail";

      const tempResult = {
        correctAnswers: correctAnswers || [],
        wrongAnswers: wrongAnswers || [],
        verdict: verdict || "Fail",
        score: scorePercentage,
        points: points,
        totalQuestions: totalQuestions,
        timeSpent: timeSpent,
        totalTimeAllowed: totalTimeAllowed
      };

      setResult(tempResult);

      const response = await addReport({
        exam: params.id,
        result: tempResult,
        user: user._id,
      });

      if (response.success) {
        // Include XP data in the result
        const resultWithXP = {
          ...tempResult,
          xpData: response.xpData
        };
        setResult(resultWithXP);

        setView("result");
        window.scrollTo(0, 0);
        new Audio(verdict === "Pass" ? PassSound : FailSound).play();
      } else {
        message.error(response.message);
      }
      dispatch(HideLoading());

    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  }, [questions, selectedOptions, examData, params.id, user, navigate, dispatch]);

  const fetchExplanation = async (question, expectedAnswer, userAnswer, imageUrl) => {
    try {
      dispatch(ShowLoading());
      const response = await chatWithChatGPTToExplainAns({
        question,
        expectedAnswer,
        userAnswer,
        imageUrl,
        language: isKiswahili ? 'kiswahili' : 'english'
      });
      dispatch(HideLoading());

      if (response.success) {
        setExplanations((prev) => ({ ...prev, [question]: response.explanation }));
      } else {
        message.error(response.error || "Failed to fetch explanation.");
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const startTimer = () => {
    const totalSeconds = examData?.duration || 0; // Duration is already in seconds
    setSecondsLeft(totalSeconds);
    setStartTime(Date.now()); // Record start time for XP calculation

    const newIntervalId = setInterval(() => {
      setSecondsLeft((prevSeconds) => {
        if (prevSeconds > 0) {
          return prevSeconds - 1;
        } else {
          setTimeUp(true);
          return 0;
        }
      });
    }, 1000);
    setIntervalId(newIntervalId);
  };

  useEffect(() => {
    if (timeUp && view === "questions") {
      clearInterval(intervalId);
      calculateResult();
    }
  }, [timeUp, view, intervalId, calculateResult]);

  useEffect(() => {
    console.log("WriteExam useEffect - params.id:", params.id);
    if (params.id) {
      getExamData();
    } else {
      console.error("No exam ID provided in URL parameters");
      message.error("Invalid exam ID. Please select a quiz from the list.");
      navigate('/user/quiz');
    }
  }, [params.id, getExamData, navigate]);

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  // Add fullscreen class for all quiz views (instructions, questions, results)
  useEffect(() => {
    if (view === "instructions" || view === "questions" || view === "result") {
      document.body.classList.add("quiz-fullscreen");
    } else {
      document.body.classList.remove("quiz-fullscreen");
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("quiz-fullscreen");
    };
  }, [view]);

  // Repair function for fixing orphaned questions
  const repairExamQuestions = async () => {
    try {
      dispatch(ShowLoading());
      const response = await fetch('/api/exams/repair-exam-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ examId: params.id })
      });

      const data = await response.json();
      if (data.success) {
        message.success(data.message);
        // Reload the exam data
        getExamData();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error("Failed to repair exam questions");
    } finally {
      dispatch(HideLoading());
    }
  };

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex justify-center items-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-blue-100 p-12 text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-8">Please log in to access the exam and start your learning journey.</p>
          <button
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return examData ? (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">

      {view === "instructions" && (
        <Instructions
          examData={examData}
          setView={setView}
          startTimer={startTimer}
          questions={questions}
        />
      )}

      {view === "questions" && (
        isLoading ? (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-blue-200 max-w-lg mx-4 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                <svg className="w-12 h-12 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-blue-800 mb-4">Loading Quiz...</h3>
              <p className="text-blue-600 text-lg">
                Please wait while we prepare your questions.
              </p>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-amber-200 max-w-lg mx-4 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-amber-800 mb-4">No Questions Found</h3>
              <p className="text-amber-700 mb-6 text-lg leading-relaxed">
                This exam appears to have no questions. This could be due to:
              </p>
              <ul className="text-left text-amber-700 mb-8 space-y-2">
                <li>• Questions not properly linked to this exam</li>
                <li>• Database connection issues</li>
                <li>• Exam configuration problems</li>
              </ul>
              <div className="space-y-3">
                <button
                  onClick={repairExamQuestions}
                  className="w-full px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  🔧 Repair Questions
                </button>
                <button
                  onClick={() => {
                    console.log("Retrying exam data fetch...");
                    getExamData();
                  }}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  🔄 Retry Loading
                </button>
                <button
                  onClick={() => navigate('/user/quiz')}
                  className="w-full px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold text-lg hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  ← Back to Quiz List
                </button>
              </div>
            </div>
          </div>
        ) : (
          <MinimalQuizRenderer
            question={questions[selectedQuestionIndex]}
            questionIndex={selectedQuestionIndex}
            totalQuestions={questions.length}
            selectedAnswer={selectedOptions[selectedQuestionIndex]}
            onAnswerSelect={(answer) => setSelectedOptions({...selectedOptions, [selectedQuestionIndex]: answer})}
            onNext={() => {
              if (selectedQuestionIndex === questions.length - 1) {
                calculateResult();
              } else {
                setSelectedQuestionIndex(selectedQuestionIndex + 1);
              }
            }}
            onPrevious={() => {
              if (selectedQuestionIndex > 0) {
                setSelectedQuestionIndex(selectedQuestionIndex - 1);
              }
            }}
            timeLeft={secondsLeft}
            examTitle={examData?.name || "Quiz"}
          />
        )
      )}

      {view === "result" && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
          {result.verdict === "Pass" && <Confetti width={width} height={height} />}

          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
              {/* Modern Header */}
              <div className={`px-8 py-10 text-center relative ${
                result.verdict === "Pass"
                  ? "bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10"
                  : "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10"
              }`}>
                <div className="relative">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg ${
                    result.verdict === "Pass"
                      ? "bg-gradient-to-br from-emerald-500 to-green-600"
                      : "bg-gradient-to-br from-amber-500 to-orange-600"
                  }`}>
                    <img
                      src={result.verdict === "Pass" ? Pass : Fail}
                      alt={result.verdict}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <h1 className={`text-4xl font-black mb-4 tracking-tight ${
                    result.verdict === "Pass" ? "text-emerald-700" : "text-amber-700"
                  }`}>
                    {result.verdict === "Pass" ? "Excellent Work!" : "Keep Pushing!"}
                  </h1>
                  <p className="text-xl text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                    {result.verdict === "Pass"
                      ? "You've mastered this exam with flying colors!"
                      : "Every challenge makes you stronger. Try again!"}
                  </p>
                </div>
              </div>

              {/* Modern Statistics Cards */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Score Card */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-indigo-500/10 rounded-2xl border border-blue-200/50 p-6 hover:shadow-lg transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative text-center">
                      <div className="text-4xl font-black text-blue-600 mb-2 tracking-tight">
                        {Math.round(((result.correctAnswers?.length || 0) / questions.length) * 100)}%
                      </div>
                      <div className="text-sm font-bold text-blue-700/80 uppercase tracking-wider">Your Score</div>
                    </div>
                  </div>

                  {/* Correct vs Total */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/5 to-green-500/10 rounded-2xl border border-emerald-200/50 p-6 hover:shadow-lg transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative text-center">
                      <div className="text-4xl font-black text-emerald-600 mb-2 tracking-tight">
                        {Array.isArray(result.correctAnswers) ? result.correctAnswers.length : 0}/{questions.length}
                      </div>
                      <div className="text-sm font-bold text-emerald-700/80 uppercase tracking-wider">Correct</div>
                    </div>
                  </div>

                  {/* Pass Status */}
                  <div className={`group relative overflow-hidden rounded-2xl border p-6 hover:shadow-lg transition-all duration-300 ${
                    result.verdict === "Pass"
                      ? "bg-gradient-to-br from-emerald-500/5 to-green-500/10 border-emerald-200/50"
                      : "bg-gradient-to-br from-amber-500/5 to-orange-500/10 border-amber-200/50"
                  }`}>
                    <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                      result.verdict === "Pass" ? "from-emerald-500/5" : "from-amber-500/5"
                    } to-transparent`}></div>
                    <div className="relative text-center">
                      <div className={`text-4xl font-black mb-2 tracking-tight ${
                        result.verdict === "Pass" ? "text-emerald-600" : "text-amber-600"
                      }`}>
                        {result.verdict === "Pass" ? "PASS" : "RETRY"}
                      </div>
                      <div className={`text-sm font-bold uppercase tracking-wider ${
                        result.verdict === "Pass" ? "text-emerald-700/80" : "text-amber-700/80"
                      }`}>
                        {result.verdict === "Pass" ? "Success!" : `Need ${examData.passingMarks}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modern Progress Visualization */}
                <div className="mb-8">
                  <div className="relative bg-slate-100 rounded-2xl p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-slate-700 mb-1">Performance Overview</h3>
                      <p className="text-sm text-slate-500">Your achievement level</p>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-slate-200 rounded-full h-4 shadow-inner overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 shadow-sm relative overflow-hidden ${
                            result.verdict === "Pass"
                              ? "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"
                              : "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
                          }`}
                          style={{ width: `${((result.correctAnswers?.length || 0) / questions.length) * 100}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs font-medium text-slate-500">0%</span>
                        <span className={`text-lg font-black tracking-tight ${
                          result.verdict === "Pass" ? "text-emerald-600" : "text-amber-600"
                        }`}>
                          {Math.round(((Array.isArray(result.correctAnswers) ? result.correctAnswers.length : 0) / questions.length) * 100)}%
                        </span>
                        <span className="text-xs font-medium text-slate-500">100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* XP Display */}
                {result.xpData && (
                  <div className="mb-8">
                    <XPResultDisplay xpData={result.xpData} />
                  </div>
                )}

                {/* Modern Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    onClick={() => setView("review")}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative">Review Answers</span>
                  </button>


                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "review" && (
        <MinimalReviewRenderer
          questions={questions}
          selectedOptions={selectedOptions}
          explanations={explanations}
          fetchExplanation={fetchExplanation}
          setView={setView}
          examData={examData}
          setSelectedQuestionIndex={setSelectedQuestionIndex}
          setSelectedOptions={setSelectedOptions}
          setResult={setResult}
          setTimeUp={setTimeUp}
          setSecondsLeft={setSecondsLeft}
          setExplanations={setExplanations}
        />
      )}
    </div>
  ) : null;
}

export default WriteExam;
import { message } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getExamById } from "../../../apicalls/exams";
import { addReport } from "../../../apicalls/reports";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import Instructions from "./Instructions";
import Pass from '../../../assets/pass.gif';
import Fail from '../../../assets/fail.gif';
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";
import PassSound from '../../../assets/pass.mp3';
import FailSound from '../../../assets/fail.mp3';


function WriteExam() {
  const [examData, setExamData] = React.useState(null);
  const [questions = [], setQuestions] = React.useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = React.useState(0);
  const [selectedOptions, setSelectedOptions] = React.useState({});
  const [result = {}, setResult] = React.useState({});
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [view, setView] = useState("instructions");
  const [secondsLeft = 0, setSecondsLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const { user } = useSelector((state) => state.users);
  const [isMobile, setIsMobile] = useState(false);
  const { width, height } = useWindowSize();

  const getExamData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getExamById({
        examId: params.id,
      });
      dispatch(HideLoading());
      if (response.success) {
        setQuestions(response.data.questions);
        setExamData(response.data);
        setSecondsLeft(response.data.duration);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const calculateResult = async () => {
    try {
      let correctAnswers = [];
      let wrongAnswers = [];

      questions.forEach((question, index) => {
        if (question.correctOption === selectedOptions[index]) {
          correctAnswers.push(question);
        } else {
          wrongAnswers.push(question);
        }
      });

      let verdict = "Pass";
      if (correctAnswers.length < examData.passingMarks) {
        verdict = "Fail";
      }

      const tempResult = {
        correctAnswers,
        wrongAnswers,
        verdict,
      };
      setResult(tempResult);
      dispatch(ShowLoading());
      const response = await addReport({
        exam: params.id,
        result: tempResult,
        user: user._id,
      });
      dispatch(HideLoading());
      if (response.success) {
        setView("result");
        window.scrollTo(0, 0);
        new Audio(verdict === "Pass" ? PassSound : FailSound).play();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const startTimer = () => {
    let totalSeconds = examData.duration;
    const intervalId = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds = totalSeconds - 1;
        setSecondsLeft(totalSeconds);
      } else {
        setTimeUp(true);
      }
    }, 1000);
    setIntervalId(intervalId);
  };

  useEffect(() => {
    if (timeUp && view === "questions") {
      clearInterval(intervalId);
      calculateResult();
    }
  }, [timeUp]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsMobile(true);
    }
    if (params.id) {
      getExamData();
    }
  }, []);
  return (
    examData && (
      <div className="mt-2">
        <div className="divider"></div>
        <h1 className={`text-center ${isMobile ? 'text-xl' : ''}`}>{examData.name}</h1>
        <div className="divider"></div>

        {view === "instructions" && (
          <Instructions
            examData={examData}
            setView={setView}
            startTimer={startTimer}
          />
        )}


        {view === "questions" && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <h1 className={isMobile ? 'text-lg' : 'text-2xl'}>
                {selectedQuestionIndex + 1} :{" "}
                {questions[selectedQuestionIndex].name}
              </h1>

              <div className="timer">
                <span className={isMobile ? 'text-lg' : 'text-2xl'}>{secondsLeft}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {Object.keys(questions[selectedQuestionIndex].options).map(
                (option, index) => {
                  return (
                    <div
                      className={`flex gap-2 flex-col ${selectedOptions[selectedQuestionIndex] === option
                        ? "selected-option"
                        : "option"
                        }`}
                      key={index}
                      onClick={() => {
                        setSelectedOptions({
                          ...selectedOptions,
                          [selectedQuestionIndex]: option,
                        });
                      }}
                    >
                      <h1 className={isMobile ? 'text-md' : 'text-xl'}>
                        {option} :{" "}
                        {questions[selectedQuestionIndex].options[option]}
                      </h1>
                    </div>
                  );
                }
              )}
            </div>

            <div className="flex justify-between">
              {selectedQuestionIndex > 0 && (
                <button
                  className="primary-outlined-btn"
                  onClick={() => {
                    setSelectedQuestionIndex(selectedQuestionIndex - 1);
                  }}
                >
                  Previous
                </button>
              )}

              {selectedQuestionIndex < questions.length - 1 && (
                <button
                  className="primary-contained-btn"
                  onClick={() => {
                    setSelectedQuestionIndex(selectedQuestionIndex + 1);
                  }}
                >
                  Next
                </button>
              )}

              {selectedQuestionIndex === questions.length - 1 && (
                <button
                  className="primary-contained-btn"
                  onClick={() => {
                    // clearInterval(intervalId);
                    setTimeUp(true);

                  }}
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        )}

        {view === "result" && (
          <>
            {result.verdict === "Pass" && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} />}
            <div style={{ display: 'flex', justifyContent: 'center' }} >
              <img src={result.verdict !== "Pass" ? Fail : Pass} width={isMobile ? '250' : '550'} height={isMobile ? '200' : '270'} alt="Verdict Gif" />
            </div>
            <div className="flex items-center mt-2 justify-center ">
              <div className="flex flex-col gap-2 result">

                <h1 className={isMobile ? 'text-lg' : 'text-2xl'}> RESULT</h1>
                <div className="marks">
                  <h1 className="text-md">
                    Total Marks : {examData.totalMarks}
                  </h1>
                  <h1 className="text-md">
                    obtained Marks :
                    {result.correctAnswers.length}
                  </h1>
                  <h1 className="text-md">
                    Wrong Answers : {result.wrongAnswers.length}
                  </h1>
                  <h1 className="text-md">passing Marks : {examData.passingMarks}</h1>
                  <h1 className="text-md"> VERDICT :
                    {result.verdict}</h1>

                  <div className="flex gap-2 mt-2">
                    <button
                      className={`primary-outline-btn ${isMobile ? 'mobile-btn' : ''}`}
                      onClick={() => {
                        setView("instructions");
                        setSelectedQuestionIndex(0);
                        setSelectedOptions({});
                        setSecondsLeft(examData.duration);
                        setTimeUp(false);
                      }}
                    >
                      Retake Exam
                    </button>
                    <button
                      className={`primary-contained-btn ${isMobile ? 'mobile-btn' : ''}`}
                      onClick={() => {
                        setView("review");
                      }}>
                      Review Answers
                    </button>
                  </div>
                </div>
              </div>
              <div className="lottie-animation">
                {result.verdict === "Pass" && (
                  <lottie-player
                    src="https://assets2.lottiefiles.com/packages/lf20_ya4ycrti.json"
                    background="transparent"
                    speed="1"
                    loop
                    autoplay
                  ></lottie-player>
                )}


                {result.verdict === "Fail" && (
                  <lottie-player
                    src="https://assets4.lottiefiles.com/packages/lf20_qp1spzqv.json"
                    background="transparent"
                    speed="1"
                    loop
                    autoplay
                  ></lottie-player>
                )}
              </div>
            </div>
          </>
        )}


        {view === "review" && (
          <div className="flex flex-col gap-2">
            {questions.map((question, index) => {
              const isCorrect =
                question.correctOption === selectedOptions[index];
              return (
                <div
                  className={`
                  flex flex-col gap-1 p-2 ${isCorrect ? "bg-success" : "bg-error"
                    }
                `}
                  key={index}
                >
                  <h1 className={isMobile ? 'text-md' : 'text-xl'}>
                    {index + 1} : {question.name}
                  </h1>
                  <h1 className={isMobile ? 'text-sm' : 'text-md'}>
                    Submitted Answer : {selectedOptions[index]} -{" "}
                    {question.options[selectedOptions[index]]}
                  </h1>
                  <h1 className={isMobile ? 'text-sm' : 'text-md'}>
                    Correct Answer : {question.correctOption} -{" "}
                    {question.options[question.correctOption]}
                  </h1>
                </div>
              );
            })}

            <div className="flex justify-center gap-2">
              <button
                className="primary-outlined-btn"
                onClick={() => {
                  navigate("/user/quiz");
                }}
              >
                Close
              </button>
              <button
                className="primary-contained-btn"
                onClick={() => {
                  setView("instructions");
                  setSelectedQuestionIndex(0);
                  setSelectedOptions({});
                  setSecondsLeft(examData.duration);
                  setTimeUp(false);
                }}
              >
                Retake Exam
              </button>
            </div>
          </div>
        )}
      </div>
    )
  );
}

export default WriteExam;
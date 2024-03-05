import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { message, Col, Row } from "antd";
import { getAllExams } from "../../../apicalls/exams";
import { getAllReportsByUser } from "../../../apicalls/reports";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import PageTitle from "../../../components/PageTitle";
import { useNavigate } from "react-router-dom";

function Quiz() {
  const [exams, setExams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);

  const getExams = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getAllExams();
      if (response.success) {
        setExams(response.data.reverse());
      } else {
        message.error(response.message);
      }
      dispatch(HideLoading());
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  useEffect(() => {
    getExams();
  }, []);

  const verifyRetake = async (exam) => {
    try {
      dispatch(ShowLoading());
      const response = await getAllReportsByUser();
      const retakeCount = response.data.filter(item => item.exam && item.exam._id === exam._id).length;
      console.log(retakeCount);
      if (retakeCount >= 20) {
        message.error('Max attempts reached');
        dispatch(HideLoading());
        return;
      }
    } catch (error) {
      message.error('Unable to verify retake');
      dispatch(HideLoading());
      return;
    }
    dispatch(HideLoading());
    navigate(`/user/write-exam/${exam._id}`);
  };

  // Function to handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
// Filter exams based on search query
const filteredExams = exams.filter((exam) =>
  (exam.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
  exam.category?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
  exam.class?.toLowerCase().includes(searchQuery.toLowerCase().trim()))
);

  // Check if the length of filtered exams is less than total exams
  const shouldRenderFilteredExams = filteredExams.length < exams.length;

  return (
    user && (
      <div>
        <PageTitle title={`Hi ${user.name}, Welcome its time to study!!`} />
        <div className="divider"></div>
        {/* Search input field */}
        <input
          type="text"
          className="w-25 mb-2"
          placeholder="Search exams"
          value={searchQuery}
          onChange={handleSearch}
        />
        {shouldRenderFilteredExams && (
          <div className="mb-2">
            <span>{`Filtered ${filteredExams.length} out of ${exams.length}`}</span>
          </div>
        )}
        
        <Row gutter={[16, 16]}>
          {/* Render filtered exams only if there are fewer filtered exams than total exams */}
          {filteredExams.map((exam, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <div
                style={{ backgroundColor: "aliceblue" }}
                className="card-lg flex flex-col gap-1 p-2"
              >
                <h1 className="text-2xl">{exam?.name}</h1>
                <h1 className="text-md">Subject : {exam.category}</h1>
                <h1 className="text-md">Class : {exam.class}</h1>
                <h1 className="text-md">Total Marks : {exam.totalMarks}</h1>
                <h1 className="text-md">
                  Passing Marks : {exam.passingMarks}
                </h1>
                <h1 className="text-md">Duration : {exam.duration}</h1>
                <button
                  className="primary-outlined-btn"
                  onClick={(e) => verifyRetake(exam)}
                >
                  Start Exam
                </button>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    )
  );
}

export default Quiz;
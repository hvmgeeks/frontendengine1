import { Col, message, Row } from "antd";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllExams } from "../../../apicalls/exams";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import PageTitle from "../../../components/PageTitle";
import { useNavigate } from "react-router-dom";
import { getAllReportsByUser } from "../../../apicalls/reports";
function Home() {
  const [exams, setExams] = React.useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);
  const getExams = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getAllExams();
      if (response.success) {
        setExams(response.data);
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
      if (retakeCount >= 3) {
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

  return (
    user && (
      <div>
        <PageTitle title={`Hi ${user.name}, Welcome its time to study!!`} />
        <div className="divider"></div>
        <Row gutter={[16, 16]}>
          {exams.map((exam, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <div style={{ backgroundColor: 'aliceblue' }} className="card-lg flex flex-col gap-1 p-2">
                <h1 className="text-2xl">{exam?.name}</h1>

                <h1 className="text-md">Category : {exam.category}</h1>

                <h1 className="text-md">Total Marks : {exam.totalMarks}</h1>
                <h1 className="text-md">Passing Marks : {exam.passingMarks}</h1>
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

export default Home;
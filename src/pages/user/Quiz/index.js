import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { message, Col, Row } from "antd";
import { getAllExams } from "../../../apicalls/exams";
import { getAllReportsByUser } from "../../../apicalls/reports";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import PageTitle from "../../../components/PageTitle";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

const primaryClasses = [
  { value: "1", label: "Class 1" },
  { value: "2", label: "Class 2" },
  { value: "3", label: "Class 3" },
  { value: "4", label: "Class 4" },
  { value: "5", label: "Class 5" },
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
];

const secondaryClasses = [
  { value: "Form-1", label: "Form 1" },
  { value: "Form-2", label: "Form 2" },
  { value: "Form-3", label: "Form 3" },
  { value: "Form-4", label: "Form 4" },
  { value: "Form-5", label: "Form 5" },
  { value: "Form-6", label: "Form 6" },
];

function Quiz() {
  const [exams, setExams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [reportsData, setReportsData] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const availableClasses =
    user?.schoolType === "primary" ? primaryClasses : secondaryClasses;

  useEffect(() => {
    if (user && user.class) {
      const defaultSelectedClass = availableClasses.find(
        (option) => option.value === user.class
      );
      setSelectedClass(defaultSelectedClass);
    }
  }, [user, availableClasses]);

  const handleClassChange = (selectedOption) => {
    setSelectedClass(selectedOption);
  };

  const filteredExams = exams.filter(
    (exam) =>
      (!selectedClass || exam.class === selectedClass.value) &&
      (exam.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        exam.category
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase().trim()) ||
        exam.class?.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  );

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

  const filterReportsData = (data) => {
    const reportsMap = {};

    // Iterate over the response data (reports)
    data.forEach(report => {
      const examId = report.exam._id;
      const verdict = report.result.verdict;

      // If the examId is not already in the map, add it
      if (!reportsMap[examId]) {
        reportsMap[examId] = report;
      } else {
        // If there is already an entry for this exam, keep the one with "pass" verdict, or just keep the first one if no "pass"
        if (verdict === "Pass" && reportsMap[examId].result.verdict !== "Pass") {
          reportsMap[examId] = report; // Replace with the "pass" verdict report
        }
      }
    });

    return Object.values(reportsMap);
  };

  const getData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getAllReportsByUser();
      if (response.success) {

        setReportsData(filterReportsData(response.data));
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
    getData();
    getExams();
  }, []);

  const verifyRetake = async (exam) => {
    try {
      dispatch(ShowLoading());
      const response = await getAllReportsByUser();
      const retakeCount = response.data.filter(
        (item) => item.exam && item.exam._id === exam._id
      ).length;
      console.log("Retake count for exam:", retakeCount);
    } catch (error) {
      message.error("Unable to verify retake");
      dispatch(HideLoading());
      return;
    }
    dispatch(HideLoading());
    navigate(`/user/write-exam/${exam._id}`);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const shouldRenderFilteredExams = filteredExams.length < exams.length;
  console.log("user123", user);
  return (
    user && (
      <div style={{ minHeight: "80vh", paddingBottom: '20px' }}>
        <PageTitle title={`Hi ${user.name}, Welcome it's time to study!!`} />
        <div className="divider"></div>


        <div
          className="flex justify-between items-center mb-2 flex-wrap"
          style={{ marginRight: "20px" }}
        >
          <div className="flex flex-col gap-1">
            {/* Search Bar */}
            <div>Search Quiz Title:</div>
            <input
              type="text"
              className="w-100 mb-2"
              placeholder="Search quizes"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="flex flex-col gap-1">
            {/* Class Selector */}
            <div>Please Select Class:</div>
            <Select
              options={availableClasses}
              value={selectedClass}
              onChange={handleClassChange}
              placeholder="Select Class"
              styles={{ width: "300px" }}
            />
          </div>
        </div>

        {shouldRenderFilteredExams && (
          <div className="mb-2">
            <span>{`Filtered ${filteredExams.length} out of ${exams.length}`}</span>
          </div>
        )}

        <Row gutter={[16, 16]} style={{ marginLeft: 0, marginRight: 0 }}>
          {filteredExams.map((exam, index) => {
            const examReport = reportsData.find(
              (report) => report.exam && report.exam._id === exam._id
            );

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                <div
                  style={{
                    backgroundColor:
                      examReport?.result?.verdict?.toLowerCase() === "fail"
                        ? "#ffc1b3"
                        : examReport?.result?.verdict?.toLowerCase() === "pass"
                          ? "#cfffb3"
                          : "aliceblue",
                    height: "100%",
                    boxSizing: "border-box",
                  }}
                  className="card-lg flex flex-col gap-1 p-2"
                >
                  <h1 className="text-2xl">{exam?.name}</h1>
                  <h1 className="text-md">Subject: {exam.category}</h1>
                  <h1 className="text-md">Class: {exam.class}</h1>
                  <h1 className="text-md">Total Marks: {exam.totalMarks}</h1>
                  <h1 className="text-md">
                    Passing Marks: {exam.passingMarks}
                  </h1>
                  <h1 className="text-md">Duration: {exam.duration}</h1>
                  <button
                    className="primary-outlined-btn"
                    onClick={() => verifyRetake(exam)}
                  >
                    Start Exam
                  </button>
                </div>
              </Col>
            );
          })}
        </Row>
      </div>
    )
  );
}

export default Quiz;

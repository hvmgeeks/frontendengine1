import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { message, Col, Row } from "antd";
import { getAllExams } from "../../../apicalls/exams";
import { getAllReportsByUser } from "../../../apicalls/reports";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import PageTitle from "../../../components/PageTitle";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import "./style.css";
import { BsBookFill } from "react-icons/bs";


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
  const [lgSize, setLgSize] = useState(8);

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

  useEffect(() => {
    const updateLgSize = () => {
      setLgSize(window.innerWidth < 1380 ? 9 : 7);
    };

    // Set initial lg size
    updateLgSize();

    // Add event listener for window resize
    window.addEventListener("resize", updateLgSize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", updateLgSize);
    };
  }, []);

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

  return (
    user && (
      <div style={{ minHeight: "80vh", paddingBottom: '20px' }}>
        <PageTitle title={`Welcome back, ${user.name} Ready to shine today?`} />
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
              isSearchable={false}
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
              <Col xs={24} sm={12} md={9} lg={lgSize} key={index}>
                <div
                  style={{
                    height: "100%",
                    boxSizing: "border-box",
                    border: `1px solid ${examReport?.result?.verdict?.toLowerCase() === "fail"
                      ? "#FE8267"
                      : examReport?.result?.verdict?.toLowerCase() === "pass"
                        ? "#43C46C"
                        : "#0E8FE9"}`
                  }}
                  className={`card-lg flex flex-col gap-1 p-2 card-design ${examReport?.result?.verdict?.toLowerCase() === "fail"
                    ? "fail"
                    : examReport?.result?.verdict?.toLowerCase() === "pass"
                      ? "pass"
                      : "no-attempts"}`}
                >
                  <h1 className="text-2xl flex items-center gap-1">
                    <span className={`box-tags-icon  ${examReport?.result?.verdict?.toLowerCase() === "fail"
                      ? "fail-dark"
                      : examReport?.result?.verdict?.toLowerCase() === "pass"
                        ? "pass-dark"
                        : "no-attempts-dark"}`}>
                      <BsBookFill />
                    </span>
                    {exam?.name}
                  </h1>

                  <span style={{
                    position: 'absolute', top: '20px', right: '30px', fontSize: '14px', fontWeight: 'bold', color: examReport?.result?.verdict?.toLowerCase() === "fail"
                      ? "#FE8267"
                      : examReport?.result?.verdict?.toLowerCase() === "pass"
                        ? "#43C46C"
                        : "#0E8FE9"
                  }}>
                    {examReport?.result?.verdict?.toLowerCase() === "fail"
                      ? "Failed"
                      : examReport?.result?.verdict?.toLowerCase() === "pass"
                        ? "Passed"
                        : "No Attempts"}
                  </span>

                  <h1 className="text-xl">Subject: {exam.category}</h1>
                  <div className="flex justify-between">
                    <h1 className="text-md box-tags">Total Marks: {exam.totalMarks}</h1>

                    <h1 className="text-md box-tags">
                      Passing Marks: {exam.passingMarks}
                    </h1>
                  </div>

                  <div className="flex justify-between items-center">
                    <h1 className="text-md box-tags">Duration: {exam.duration}</h1>

                    <button
                      className={`box-tags-button text-md ${examReport?.result?.verdict?.toLowerCase() === "fail"
                        ? "fail-dark"
                        : examReport?.result?.verdict?.toLowerCase() === "pass"
                          ? "pass-dark"
                          : "no-attempts-dark"}`}
                      onClick={() => verifyRetake(exam)}
                    >
                      Start Quiz
                    </button>
                  </div>
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

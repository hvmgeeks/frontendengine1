import { Col, Form, message, Row, Select, Table } from "antd";
import React, { useEffect, useState } from "react";
import {
  addExam,
  deleteQuestionById,
  editExamById,
  getExamById,
} from "../../../apicalls/exams";
import PageTitle from "../../../components/PageTitle";
import { useNavigate, useParams } from "react-router-dom";

import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { Tabs } from "antd";
import AddEditQuestion from "./AddEditQuestion";
import { primarySubjects, primaryKiswahiliSubjects, secondarySubjects, advanceSubjects } from "../../../data/Subjects";
const { TabPane } = Tabs;

function AddEditExam() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [level, setLevel] = useState('');
  const [showAddEditQuestionModal, setShowAddEditQuestionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [classValue, setClassValue] = useState('');
  const params = useParams();



  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());
      let response;

      if (params.id) {
        response = await editExamById({
          ...values,
          examId: params.id,
        });
      } else {
        response = await addExam(values);
      }
      if (response.success) {
        message.success(response.message);

        // Dispatch event to notify other components about new exam creation
        if (!params.id) { // Only for new exams, not edits
          window.dispatchEvent(new CustomEvent('newExamCreated', {
            detail: {
              examName: values.name,
              level: values.level,
              timestamp: Date.now()
            }
          }));

          // For new exams, navigate to edit mode so user can add questions
          const newExamId = response.data?._id || response.data?.id;
          if (newExamId) {
            dispatch(HideLoading()); // Hide loading before navigation
            navigate(`/admin/exams/edit/${newExamId}`);
            return; // Don't continue with the rest of the function
          }
        }

        // For edits, stay on the same page and refresh data
        if (params.id) {
          getExamData(); // Refresh the exam data
        }
      } else {
        message.error(response.message);
      }
      dispatch(HideLoading());
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const getExamData = async () => {
    try {
      dispatch(ShowLoading());

      // Get user data from localStorage for the API call
      const user = JSON.parse(localStorage.getItem("user"));

      const response = await getExamById({
        examId: params.id,
        userId: user?._id, // Add userId for backend validation
      });

      setClassValue(response?.data?.class);
      setLevel(response?.data?.level);
      dispatch(HideLoading());
      if (response.success) {
        setExamData(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  useEffect(() => {
    if (params.id) {
      getExamData();
    }
  }, []);

  const deleteQuestion = async (questionId) => {
    try {
      dispatch(ShowLoading());
      const response = await deleteQuestionById({
        questionId,
        examId: params.id
      });
      dispatch(HideLoading());
      if (response.success) {
        message.success(response.message);
        getExamData();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const questionsColumns = [
    {
      title: "Question",
      dataIndex: "name",
    },
    {
      title: "Options",
      dataIndex: "options",
      render: (text, record) => {
        if (record?.options && typeof record.options === 'object' && Object.keys(record.options).length > 0) {
          return Object.keys(record.options).map((key) => (
            <div key={key}>
              {key}: {record.options[key]}
            </div>
          ));
        } else {
          return <div>No options available for this question.</div>;
        }
      },
    },
    {
      title: "Correct Answer",
      dataIndex: "correctAnswer",
      render: (text, record) => {
        // Handle both old (correctOption) and new (correctAnswer) formats
        const correctAnswer = record.correctAnswer || record.correctOption;

        if (record.answerType === "Free Text" || record.type === "fill" || record.type === "text") {
          return <div>{correctAnswer}</div>;
        } else {
          return (
            <div>
              {correctAnswer}: {record.options && record.options[correctAnswer] ? record.options[correctAnswer] : correctAnswer}
            </div>
          );
        }
      },
    },
    {
      title: "Source",
      dataIndex: "source",
      render: (text, record) => (
        <div className="flex items-center gap-1">
          {record?.isAIGenerated ? (
            <span className="flex items-center gap-1 text-blue-600 text-sm">
              🤖 AI
            </span>
          ) : (
            <span className="text-gray-600 text-sm">Manual</span>
          )}
          {(record?.image || record?.imageUrl) && (
            <span title="Has Image">🖼️</span>
          )}
        </div>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (text, record) => (
        <div className="flex gap-2 items-center">
          {/* Edit Button */}
          <i
            className="ri-pencil-line cursor-pointer text-blue-600 hover:text-blue-800"
            title="Edit Question"
            onClick={() => {
              setSelectedQuestion(record);
              setShowAddEditQuestionModal(true);
            }}
          ></i>

          {/* Add Image Button for AI-generated questions without images */}
          {record?.isAIGenerated && !record?.image && !record?.imageUrl && (
            <i
              className="ri-image-add-line cursor-pointer text-green-600 hover:text-green-800"
              title="Add Image to AI Question"
              onClick={() => {
                setSelectedQuestion(record);
                setShowAddEditQuestionModal(true);
              }}
            ></i>
          )}

          {/* AI Generated Indicator */}
          {record?.isAIGenerated && (
            <span
              className="text-blue-500 text-sm"
              title="AI Generated Question"
            >
              🤖
            </span>
          )}

          {/* Image Indicator */}
          {(record?.image || record?.imageUrl) && (
            <span
              className="text-green-500 text-sm"
              title="Has Image"
            >
              🖼️
            </span>
          )}

          {/* Delete Button */}
          <i
            className="ri-delete-bin-line cursor-pointer text-red-600 hover:text-red-800"
            title="Delete Question"
            onClick={() => {
              deleteQuestion(record._id);
            }}
          ></i>
        </div>
      ),
    },
  ];

  const handleLevelChange = (e) => {
    setLevel(e.target.value);
    setClassValue(""); // Reset class
  };

  console.log(classValue, "classValue")



  return (
    <div>
      {/* Header with Dashboard Shortcut */}
      <div className="flex items-center justify-between mb-4">
        <PageTitle title={params.id ? "Edit Exam" : "Add Exam"} />

        {/* Dashboard Shortcut */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/admin/exams')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 border border-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="font-medium">All Exams</span>
          </button>
        </div>
      </div>

      <div className="divider"></div>

      {(examData || !params.id) && (
        <Form layout="vertical" onFinish={onFinish} initialValues={examData}>
          <Tabs defaultActiveKey="1">
            <TabPane tab="Exam Details" key="1">
              <Row gutter={[10, 10]}>
                <Col span={8}>
                  <Form.Item label="Exam Name" name="name">
                    <input type="text" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Topic" name="topic">
                    <input type="text" placeholder="Enter quiz topic (e.g., Algebra, Cell Biology)" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Exam Duration (Seconds)" name="duration">
                    <input type="number" />
                  </Form.Item>
                </Col>



                <Col span={8}>
                  <Form.Item name="level" label="Level" initialValue="">
                    <select value={level} onChange={handleLevelChange}   >
                      <option value="" disabled >
                        Select Level
                      </option>
                      <option value="Primary">Primary</option>
                      <option value="Primary_Kiswahili">Primary Kiswahili</option>
                      <option value="Secondary">Secondary</option>
                      <option value="Advance">Advance</option>
                    </select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item label="Category" name="category">
                    <select name="" id="">
                      <option value="">Select Category</option>
                      {level.toLowerCase() === "primary" && (
                        <>
                          {primarySubjects.map((subject, index) => (
                            <option key={index} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </>
                      )}
                      {level.toLowerCase() === "primary_kiswahili" && (
                        <>
                          {primaryKiswahiliSubjects.map((subject, index) => (
                            <option key={index} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </>
                      )}
                      {level.toLowerCase() === "secondary" && (
                        <>
                          {secondarySubjects.map((subject, index) => (
                            <option key={index} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </>
                      )}
                      {level.toLowerCase() === "advance" && (
                        <>
                          {advanceSubjects.map((subject, index) => (
                            <option key={index} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </Form.Item>
                </Col>

                <Col span={8}>

                  <Form.Item name="class" label="Class" initialValue="" required>
                    <select value={classValue} onChange={(e) => setClassValue(e.target.value)}>
                      <option value=""  >
                        Select Class
                      </option>
                      {level.toLowerCase() === "primary" && (
                        <>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                          <option value="6">6</option>
                          <option value="7">7</option>
                        </>
                      )}
                      {level.toLowerCase() === "primary_kiswahili" && (
                        <>
                          <option value="1">Darasa la 1</option>
                          <option value="2">Darasa la 2</option>
                          <option value="3">Darasa la 3</option>
                          <option value="4">Darasa la 4</option>
                          <option value="5">Darasa la 5</option>
                          <option value="6">Darasa la 6</option>
                          <option value="7">Darasa la 7</option>
                        </>
                      )}
                      {level.toLowerCase() === "secondary" && (
                        <>
                          <option value="Form-1">Form-1</option>
                          <option value="Form-2">Form-2</option>
                          <option value="Form-3">Form-3</option>
                          <option value="Form-4">Form-4</option>
                        </>
                      )}
                      {level.toLowerCase() === "advance" && (
                        <>
                          <option value="Form-5">Form-5</option>
                          <option value="Form-6">Form-6</option>
                        </>
                      )}
                    </select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Total Marks" name="totalMarks">
                    <input type="number" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Passing Marks" name="passingMarks">
                    <input type="number" />
                  </Form.Item>
                </Col>
              </Row>
              <div className="flex justify-end gap-2">
                <button
                  className="primary-outlined-btn"
                  type="button"
                  onClick={() => navigate("/admin/exams")}
                >
                  Cancel
                </button>
                <button className="primary-contained-btn" type="submit">
                  Save
                </button>
              </div>
            </TabPane>
            {params.id && (
              <TabPane tab="Questions" key="2">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Exam Questions</h3>
                    <p className="text-gray-600">Add and manage questions for this exam</p>
                  </div>
                  <button
                    className="primary-contained-btn"
                    type="button"
                    onClick={() => setShowAddEditQuestionModal(true)}
                  >
                    Add Question
                  </button>
                </div>

                <Table
                  columns={questionsColumns}
                  dataSource={examData?.questions || []}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                  }}
                  locale={{
                    emptyText: examData?.questions?.length === 0 ?
                      'No questions added yet. Click "Add Question" to add questions.' :
                      'Loading questions...'
                  }}
                />
              </TabPane>
            )}
          </Tabs>
        </Form>
      )}

      {showAddEditQuestionModal && (
        <AddEditQuestion
          setShowAddEditQuestionModal={setShowAddEditQuestionModal}
          showAddEditQuestionModal={showAddEditQuestionModal}
          examId={params.id}
          refreshData={getExamData}
          selectedQuestion={selectedQuestion}
          setSelectedQuestion={setSelectedQuestion}
        />
      )}


    </div>
  );
}

export default AddEditExam;
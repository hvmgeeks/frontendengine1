import { Form, message, Modal } from "antd";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addQuestionToExam, editQuestionById } from "../../../apicalls/exams";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";

function AddEditQuestion({
  showAddEditQuestionModal,
  setShowAddEditQuestionModal,
  refreshData,
  examId,
  selectedQuestion,
  setSelectedQuestion,
}) {
  const dispatch = useDispatch();
  const [answerType, setAnswerType] = useState(
    selectedQuestion?.answerType || "Options"
  );
  const [imageFile, setImageFile] = useState(null);

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());

      // Prepare form data for file upload
      const formData = new FormData();
      
      // Append question details
      formData.append('name', values.name);
      formData.append('answerType', answerType);
      formData.append('exam', examId);
      
      // Append correct answer based on answer type
      if (answerType === "Free Text") {
        formData.append('correctOption', values.correctAnswer);
      } else {
        formData.append('correctOption', values.correctOption);
        formData.append('options[A]', values.A);
        formData.append('options[B]', values.B);
        formData.append('options[C]', values.C);
        formData.append('options[D]', values.D);
      }

      // Append image if selected
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (selectedQuestion?.image) {
        formData.append("image", selectedQuestion.image); // Retain existing image if editing
      }

      let response;
      if (selectedQuestion) {
        // For editing, include question ID
        formData.append('questionId', selectedQuestion._id);
        response = await editQuestionById(formData);
      } else {
        response = await addQuestionToExam(formData);
      }

      if (response.success) {
        message.success(response.message);
        refreshData();
        setShowAddEditQuestionModal(false);
        setImageFile(null);
      } else {
        message.error(response.message);
      }

      setSelectedQuestion(null);
      dispatch(HideLoading());
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file || null);
  };

  return (
    <Modal
      title={selectedQuestion ? "Edit Question" : "Add Question"}
      visible={showAddEditQuestionModal}
      footer={false}
      onCancel={() => {
        setShowAddEditQuestionModal(false);
        setSelectedQuestion(null);
        setImageFile(null);
      }}
    >
      <Form
        onFinish={onFinish}
        layout="vertical"
        initialValues={{
          name: selectedQuestion?.name,
          correctAnswer: selectedQuestion?.correctAnswer,
          correctOption: selectedQuestion?.correctOption,
          A: selectedQuestion?.options?.A,
          B: selectedQuestion?.options?.B,
          C: selectedQuestion?.options?.C,
          D: selectedQuestion?.options?.D,
        }}
      >
        <Form.Item name="name" label="Question">
          <input type="text" />
        </Form.Item>

        {/* Answer Type Selection */}
        <Form.Item name="answerType" label="Answer Type">
          <select
            value={answerType}
            onChange={(e) => setAnswerType(e.target.value)}
          >
            <option value="Options">Options</option>
            <option value="Free Text">Free Text</option>
          </select>
        </Form.Item>

        {/* Conditional Fields */}
        {answerType === "Options" && (
          <>
            <Form.Item name="correctOption" label="Correct Option">
              <input type="text" />
            </Form.Item>
            <div className="flex gap-3">
              <Form.Item name="A" label="Option A">
                <input type="text" />
              </Form.Item>
              <Form.Item name="B" label="Option B">
                <input type="text" />
              </Form.Item>
            </div>
            <div className="flex gap-3">
              <Form.Item name="C" label="Option C">
                <input type="text" />
              </Form.Item>
              <Form.Item name="D" label="Option D">
                <input type="text" />
              </Form.Item>
            </div>
          </>
        )}

        {answerType === "Free Text" && (
          <Form.Item name="correctAnswer" label="Correct Answer">
            <input type="text" />
          </Form.Item>
        )}

        {/* Image Upload */}
        <Form.Item name="image" label="Question Image (Optional)">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
          />
          {imageFile && (
            <div className="mt-2 text-sm text-gray-600">
              Selected file: {imageFile.name}
            </div>
          )}
          {selectedQuestion?.image && !imageFile && (
            <div className="mt-2">
              <img 
                src={selectedQuestion.image} 
                alt="Current question" 
                className="max-w-[200px] max-h-[200px] object-cover"
              />
            </div>
          )}
        </Form.Item>

        {/* Buttons */}
        <div className="flex justify-end mt-2 gap-3">
          <button
            className="primary-outlined-btn"
            type="button"
            onClick={() => {
              setShowAddEditQuestionModal(false);
              setSelectedQuestion(null);
              setImageFile(null);
            }}
          >
            Cancel
          </button>
          <button className="primary-contained-btn">Save</button>
        </div>
      </Form>
    </Modal>
  );
}

export default AddEditQuestion;
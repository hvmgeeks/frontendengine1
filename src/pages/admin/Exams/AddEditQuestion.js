import { Form, message, Modal } from "antd";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addQuestionToExam, editQuestionById } from "../../../apicalls/exams";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import ContentRenderer from "../../../components/ContentRenderer";
import MathPreview from "../../../components/MathPreview";

function AddEditQuestion({
  showAddEditQuestionModal,
  setShowAddEditQuestionModal,
  refreshData,
  examId,
  selectedQuestion,
  setSelectedQuestion,
}) {
  const dispatch = useDispatch();
  const [questionType, setQuestionType] = useState(() => {
    if (selectedQuestion?.type) {
      return selectedQuestion.type;
    }
    if (selectedQuestion?.answerType === "Options") {
      return selectedQuestion?.image || selectedQuestion?.imageUrl ? "image" : "mcq";
    }
    if (selectedQuestion?.answerType === "Fill in the Blank" || selectedQuestion?.answerType === "Free Text") {
      return "fill";
    }
    // Default for AI-generated questions
    if (selectedQuestion?.isAIGenerated) {
      if (selectedQuestion?.questionType === "picture_based") return "image";
      if (selectedQuestion?.questionType === "fill_blank") return "fill";
      return "mcq";
    }
    return "mcq";
  });
  const [imageFile, setImageFile] = useState(null);
  const [questionText, setQuestionText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [optionTexts, setOptionTexts] = useState(["", "", "", ""]);

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());

      // Prepare form data for file upload
      const formData = new FormData();

      // Append question details
      formData.append('name', values.name);
      formData.append('type', questionType);
      formData.append('exam', examId);
      formData.append('topic', values.topic || 'General');
      formData.append('classLevel', values.classLevel || 'General');

      // Set legacy answerType for backward compatibility
      if (questionType === "mcq") {
        formData.append('answerType', 'Options');
      } else if (questionType === "fill") {
        formData.append('answerType', 'Fill in the Blank');
      } else if (questionType === "image") {
        formData.append('answerType', 'Options'); // Image questions can have MCQ options
      }

      // Append correct answer - unified for all types
      formData.append('correctAnswer', values.correctAnswer);

      // Append options for MCQ and image questions
      if (questionType === "mcq" || questionType === "image") {
        formData.append('options[A]', values.A);
        formData.append('options[B]', values.B);
        formData.append('options[C]', values.C);
        formData.append('options[D]', values.D);
        // Legacy field for backward compatibility
        formData.append('correctOption', values.correctAnswer);
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
      open={showAddEditQuestionModal}
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
          correctAnswer: selectedQuestion?.correctAnswer || selectedQuestion?.correctOption,
          topic: selectedQuestion?.topic || 'General',
          classLevel: selectedQuestion?.classLevel || 'General',
          A: selectedQuestion?.options?.A || selectedQuestion?.options?.a || '',
          B: selectedQuestion?.options?.B || selectedQuestion?.options?.b || '',
          C: selectedQuestion?.options?.C || selectedQuestion?.options?.c || '',
          D: selectedQuestion?.options?.D || selectedQuestion?.options?.d || '',
        }}
      >
        {/* AI-Generated Question Indicator */}
        {selectedQuestion?.isAIGenerated && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-lg">🤖</span>
              <span className="text-blue-800 font-semibold">AI-Generated Question</span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              This question was generated by AI. You can edit all fields and add images as needed.
            </p>
          </div>
        )}

        {/* Missing Image Alert for Image-based Questions */}
        {(questionType === "image" || selectedQuestion?.questionType === "picture_based") &&
         !selectedQuestion?.image && !selectedQuestion?.imageUrl && !imageFile && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-amber-600 text-lg">⚠️</span>
              <span className="text-amber-800 font-semibold">Image Required</span>
            </div>
            <p className="text-amber-700 text-sm mt-1">
              This is an image-based question but no image is currently attached. Please upload an image below.
            </p>
          </div>
        )}
        <Form.Item name="name" label="Question">
          <div className="space-y-3">
            <textarea
              rows={3}
              placeholder="Enter your question here. Use LaTeX for math: \\(x^2 + y^2 = z^2\\) for inline or \\[E = mc^2\\] for block equations"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Math Formula Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">📐 Mathematical Formula Support</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Inline math:</strong> Use \\(formula\\) - Example: \\(x^2 + 3x + 2\\)</p>
                <p><strong>Block math:</strong> Use \\[formula\\] - Example: \\[E = mc^2\\]</p>
                <p><strong>Common symbols:</strong> ^2 (superscript), _&#123;sub&#125; (subscript), \\frac&#123;a&#125;&#123;b&#125; (fraction), \\sqrt&#123;x&#125; (square root)</p>
              </div>
            </div>

            {/* Live Math Preview */}
            <MathPreview text={questionText} showPreview={true} />
          </div>
        </Form.Item>

        {/* Question Type Selection */}
        <Form.Item name="questionType" label="Question Type">
          <div className="space-y-2">
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="fill">Fill in the Blank</option>
              <option value="image">Image-based Question</option>
            </select>

            {/* Helpful hints for AI-generated questions */}
            {selectedQuestion?.isAIGenerated && (
              <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                💡 <strong>Tip:</strong> Change to "Image-based Question" to add visual content to this AI-generated question
              </div>
            )}

            {/* Type change notification */}
            {questionType === "image" && selectedQuestion?.questionType !== "picture_based" && selectedQuestion?.answerType !== "Options" && (
              <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                ✓ Converting to image-based question. You can now upload an image below.
              </div>
            )}
          </div>
        </Form.Item>

        {/* Additional Fields */}
        <div className="flex gap-3">
          <Form.Item name="topic" label="Topic">
            <input type="text" placeholder="e.g., Mathematics, Science" />
          </Form.Item>
          <Form.Item name="classLevel" label="Class Level">
            <input type="text" placeholder="e.g., Primary 1, Secondary 2" />
          </Form.Item>
        </div>

        {/* Image Upload for Image-based Questions */}
        {questionType === "image" && (
          <Form.Item name="image" label="Question Image">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
            <small>Upload an image for this question</small>
          </Form.Item>
        )}

        {/* Correct Answer - Universal Field */}
        <Form.Item name="correctAnswer" label="Correct Answer">
          <input
            type="text"
            placeholder={
              questionType === "mcq" || questionType === "image"
                ? "Enter the correct option (A, B, C, or D)"
                : "Enter the correct answer"
            }
          />
        </Form.Item>

        {/* Options for MCQ and Image Questions */}
        {(questionType === "mcq" || questionType === "image") && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Answer Options (Math formulas supported)</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["A", "B", "C", "D"].map((option, index) => (
                <Form.Item key={option} name={option} label={`Option ${option}`}>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={`Enter option ${option} (use LaTeX for math: \\\\(x^2\\\\))`}
                      value={optionTexts[index]}
                      onChange={(e) => {
                        const newOptions = [...optionTexts];
                        newOptions[index] = e.target.value;
                        setOptionTexts(newOptions);
                      }}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {optionTexts[index] && (
                      <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                        <span className="text-gray-600">Preview: </span>
                        <ContentRenderer text={optionTexts[index]} />
                      </div>
                    )}
                  </div>
                </Form.Item>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Image Upload Section */}
        <Form.Item
          name="image"
          label={
            <div className="flex items-center gap-2">
              <span>Question Image</span>
              {(questionType === "image" || selectedQuestion?.questionType === "picture_based") && (
                <span className="text-red-500">*</span>
              )}
              {selectedQuestion?.isAIGenerated && !selectedQuestion?.image && !selectedQuestion?.imageUrl && (
                <span className="text-blue-600 text-sm">(Add image for AI question)</span>
              )}
            </div>
          }
        >
          <div className="space-y-3">
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-2">
                {questionType === "image" || selectedQuestion?.questionType === "picture_based"
                  ? "Upload an image for this image-based question"
                  : "Upload an image (optional)"}
              </p>
            </div>

            {/* Selected File Preview */}
            {imageFile && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-green-800 font-medium">New image selected:</span>
                  <span className="text-green-700">{imageFile.name}</span>
                </div>
              </div>
            )}

            {/* Current Image Display */}
            {(selectedQuestion?.image || selectedQuestion?.imageUrl) && !imageFile && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Current image:</p>
                <div className="border rounded-lg p-2 bg-gray-50">
                  <img
                    src={selectedQuestion.image || selectedQuestion.imageUrl}
                    alt="Current question"
                    className="max-w-[300px] max-h-[200px] object-contain rounded"
                  />
                </div>
                <p className="text-sm text-gray-500">Upload a new image above to replace this one</p>
              </div>
            )}
          </div>
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
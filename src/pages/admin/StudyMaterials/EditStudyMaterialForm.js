import React, { useState, useEffect } from "react";
import { Form, message, Select, Upload, Button } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { 
  updateVideo, 
  updateNote, 
  updatePastPaper, 
  updateBook 
} from "../../../apicalls/study";
import { primarySubjects, secondarySubjects, advanceSubjects } from "../../../data/Subjects";
import {
  FaUpload,
  FaVideo,
  FaFileAlt,
  FaBook,
  FaGraduationCap,
  FaCloudUploadAlt,
  FaSave,
  FaTimes
} from "react-icons/fa";
import "./EditStudyMaterialForm.css";

const { Option } = Select;

function EditStudyMaterialForm({ material, onSuccess, onCancel }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [thumbnailList, setThumbnailList] = useState([]);
  const [selectedAdditionalClasses, setSelectedAdditionalClasses] = useState([]);
  const [uploadMethod, setUploadMethod] = useState("youtube");

  // Get subjects based on level
  const getSubjectsForLevel = (level) => {
    switch (level) {
      case "primary":
        return primarySubjects;
      case "secondary":
        return secondarySubjects;
      case "advance":
        return advanceSubjects;
      default:
        return [];
    }
  };

  // Get classes based on level
  const getClassesForLevel = (level) => {
    switch (level) {
      case "primary":
        return ["1", "2", "3", "4", "5"];
      case "secondary":
        return ["6", "7", "8", "9", "10", "11"];
      case "advance":
        return ["12", "13"];
      default:
        return [];
    }
  };

  // Initialize form with material data
  useEffect(() => {
    if (material) {
      form.setFieldsValue({
        level: material.level,
        className: material.className,
        subject: material.subject,
        title: material.title,
        year: material.year,
        videoID: material.videoID,
        videoUrl: material.videoUrl,
        thumbnailUrl: material.thumbnail
      });

      // Set additional classes for videos
      if (material.type === "videos" && material.additionalClasses) {
        setSelectedAdditionalClasses(material.additionalClasses);
      }

      // Set upload method for videos
      if (material.type === "videos") {
        if (material.videoID && !material.videoUrl) {
          setUploadMethod("youtube");
        } else if (material.videoUrl) {
          setUploadMethod("s3url");
        }
      }
    }
  }, [material, form]);

  // Handle level change
  const handleLevelChange = (level) => {
    form.setFieldsValue({ className: "", subject: "" });
    setSelectedAdditionalClasses([]);
  };

  // Handle additional classes change for videos
  const handleAdditionalClassesChange = (classes) => {
    setSelectedAdditionalClasses(classes);
  };

  // Get available additional classes (exclude core class)
  const getAvailableAdditionalClasses = () => {
    const currentLevel = form.getFieldValue("level");
    const currentClass = form.getFieldValue("className");
    
    if (!currentLevel || !currentClass) return [];
    
    return getClassesForLevel(currentLevel).filter(cls => cls !== currentClass);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      dispatch(ShowLoading());

      let response;

      if (material.type === "videos") {
        // Handle video updates
        const videoValues = {
          ...values,
          additionalClasses: selectedAdditionalClasses
        };

        if (uploadMethod === "youtube") {
          // Send JSON data for YouTube videos
          response = await updateVideo(material._id, videoValues);
        } else if (uploadMethod === "s3url") {
          // Handle S3 URL method with optional thumbnail upload
          if (thumbnailList.length > 0 && thumbnailList[0].originFileObj) {
            const formData = new FormData();
            Object.keys(videoValues).forEach(key => {
              if (key === "additionalClasses") {
                formData.append(key, JSON.stringify(videoValues[key]));
              } else {
                formData.append(key, videoValues[key]);
              }
            });
            formData.append("thumbnail", thumbnailList[0].originFileObj);
            response = await updateVideo(material._id, formData);
          } else {
            response = await updateVideo(material._id, videoValues);
          }
        }
      } else {
        // Handle other material types (notes, past papers, books)
        const formData = new FormData();
        
        Object.keys(values).forEach(key => {
          if (values[key] !== undefined && values[key] !== null) {
            formData.append(key, values[key]);
          }
        });

        // Add file if uploaded
        if (fileList.length > 0 && fileList[0].originFileObj) {
          formData.append("document", fileList[0].originFileObj);
        }

        // Add thumbnail for books
        if (material.type === "books" && thumbnailList.length > 0 && thumbnailList[0].originFileObj) {
          formData.append("thumbnail", thumbnailList[0].originFileObj);
        }

        // Call appropriate API
        switch (material.type) {
          case "study-notes":
            response = await updateNote(material._id, formData);
            break;
          case "past-papers":
            response = await updatePastPaper(material._id, formData);
            break;
          case "books":
            response = await updateBook(material._id, formData);
            break;
          default:
            throw new Error("Invalid material type");
        }
      }

      if (response.status === 200 && response.data.success) {
        message.success(response.data.message);
        onSuccess(material.type);
      } else {
        const errorMessage = response.data?.message || "Failed to update material";
        message.error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating material:", error);
      message.error("Failed to update material");
    } finally {
      setLoading(false);
      dispatch(HideLoading());
    }
  };

  // Get material title
  const getMaterialTitle = () => {
    switch (material?.type) {
      case "videos":
        return "Video";
      case "study-notes":
        return "Study Note";
      case "past-papers":
        return "Past Paper";
      case "books":
        return "Book";
      default:
        return "Material";
    }
  };

  // Get material icon
  const getMaterialIcon = () => {
    switch (material?.type) {
      case "videos":
        return <FaVideo className="form-icon" />;
      case "study-notes":
        return <FaFileAlt className="form-icon" />;
      case "past-papers":
        return <FaGraduationCap className="form-icon" />;
      case "books":
        return <FaBook className="form-icon" />;
      default:
        return <FaFileAlt className="form-icon" />;
    }
  };

  // Upload props for documents
  const documentUploadProps = {
    beforeUpload: (file) => {
      const isValidType = file.type === "application/pdf" || 
                         file.type.startsWith("application/") ||
                         file.type.startsWith("text/");
      if (!isValidType) {
        message.error("Please upload a valid document file");
        return false;
      }
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error("File must be smaller than 50MB");
        return false;
      }
      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  // Upload props for thumbnails
  const thumbnailUploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("Please upload an image file");
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("Image must be smaller than 5MB");
        return false;
      }
      setThumbnailList([file]);
      return false;
    },
    onRemove: () => {
      setThumbnailList([]);
    },
  };

  if (!material) {
    return <div>No material selected for editing</div>;
  }

  return (
    <div className="edit-study-material-form">
      <div className="form-header">
        <div className="header-content">
          {getMaterialIcon()}
          <div>
            <h2>Edit {getMaterialTitle()}</h2>
            <p>Update the details of "{material.title}"</p>
          </div>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="material-form"
      >
        <div className="form-row">
          <Form.Item
            label="Level"
            name="level"
            rules={[{ required: true, message: "Please select a level" }]}
            className="form-item-half"
          >
            <Select
              placeholder="Select level"
              onChange={handleLevelChange}
              size="large"
            >
              <Option value="primary">Primary</Option>
              <Option value="secondary">Secondary</Option>
              <Option value="advance">Advance</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Class"
            name="className"
            rules={[{ required: true, message: "Please select a class" }]}
            className="form-item-half"
          >
            <Select
              placeholder="Select class"
              size="large"
              disabled={!form.getFieldValue("level")}
            >
              {getClassesForLevel(form.getFieldValue("level")).map(cls => (
                <Option key={cls} value={cls}>Class {cls}</Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          label="Subject"
          name="subject"
          rules={[{ required: true, message: "Please select a subject" }]}
        >
          <Select
            placeholder="Select subject"
            size="large"
            disabled={!form.getFieldValue("level")}
          >
            {getSubjectsForLevel(form.getFieldValue("level")).map(subject => (
              <Option key={subject} value={subject}>{subject}</Option>
            ))}
          </Select>
        </Form.Item>

        {/* Additional Classes for Videos */}
        {material.type === "videos" && (
          <Form.Item
            label="Additional Classes (Optional)"
            className="additional-classes-section"
          >
            <Select
              mode="multiple"
              placeholder="Select additional classes that can access this video"
              value={selectedAdditionalClasses}
              onChange={handleAdditionalClassesChange}
              size="large"
              disabled={!form.getFieldValue("className")}
            >
              {getAvailableAdditionalClasses().map(cls => (
                <Option key={cls} value={cls}>Class {cls}</Option>
              ))}
            </Select>
            <div className="additional-classes-note">
              <small>Note: The video will be available to the core class and all selected additional classes</small>
            </div>
          </Form.Item>
        )}

        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter a title" }]}
        >
          <input
            type="text"
            placeholder={`Enter ${getMaterialTitle().toLowerCase()} title`}
            className="form-input"
          />
        </Form.Item>

        {(material.type === "past-papers" || material.type === "books") && (
          <Form.Item
            label="Year"
            name="year"
            rules={[{ required: true, message: "Please enter the year" }]}
          >
            <input
              type="text"
              placeholder="Enter year (e.g., 2023)"
              className="form-input"
            />
          </Form.Item>
        )}

        {/* Video-specific fields */}
        {material.type === "videos" && (
          <>
            <div className="upload-method-section">
              <label className="section-label">Video Source</label>
              <div className="upload-method-options">
                <div 
                  className={`method-option ${uploadMethod === "youtube" ? "active" : ""}`}
                  onClick={() => setUploadMethod("youtube")}
                >
                  <FaVideo className="method-icon" />
                  <span>YouTube Video</span>
                </div>
                <div 
                  className={`method-option ${uploadMethod === "s3url" ? "active" : ""}`}
                  onClick={() => setUploadMethod("s3url")}
                >
                  <FaCloudUploadAlt className="method-icon" />
                  <span>S3 URL</span>
                </div>
              </div>
            </div>

            {uploadMethod === "youtube" && (
              <Form.Item
                label="YouTube Video ID"
                name="videoID"
                rules={[{ required: true, message: "Please enter YouTube video ID" }]}
              >
                <input
                  type="text"
                  placeholder="Enter YouTube video ID (e.g., dQw4w9WgXcQ)"
                  className="form-input"
                />
              </Form.Item>
            )}

            {uploadMethod === "s3url" && (
              <>
                <Form.Item
                  label="S3 Video URL"
                  name="videoUrl"
                  rules={[{ required: true, message: "Please enter S3 video URL" }]}
                >
                  <input
                    type="url"
                    placeholder="Enter S3 video URL"
                    className="form-input"
                  />
                </Form.Item>

                <Form.Item
                  label="Thumbnail URL (Optional)"
                  name="thumbnailUrl"
                >
                  <input
                    type="url"
                    placeholder="Enter thumbnail URL or upload below"
                    className="form-input"
                  />
                </Form.Item>

                <Form.Item
                  label="Upload New Thumbnail (Optional)"
                  className="upload-section"
                >
                  <Upload
                    {...thumbnailUploadProps}
                    fileList={thumbnailList}
                    onChange={({ fileList }) => setThumbnailList(fileList)}
                    className="thumbnail-upload"
                  >
                    <div className="upload-area small">
                      <FaUpload className="upload-icon" />
                      <p>Drag & drop thumbnail or click to upload</p>
                      <p className="upload-hint">Supports JPG, PNG, GIF (Max: 5MB)</p>
                    </div>
                  </Upload>
                </Form.Item>
              </>
            )}
          </>
        )}

        {/* Document upload for non-video materials */}
        {material.type !== "videos" && (
          <Form.Item
            label="Upload New Document (Optional)"
            className="upload-section"
          >
            <Upload
              {...documentUploadProps}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              className="document-upload"
            >
              <div className="upload-area">
                <FaUpload className="upload-icon" />
                <p>Click or drag file to upload new document</p>
                <p className="upload-hint">Leave empty to keep current document</p>
              </div>
            </Upload>
          </Form.Item>
        )}

        {/* Thumbnail upload for books */}
        {material.type === "books" && (
          <Form.Item
            label="Upload New Thumbnail (Optional)"
            className="upload-section"
          >
            <Upload
              {...thumbnailUploadProps}
              fileList={thumbnailList}
              onChange={({ fileList }) => setThumbnailList(fileList)}
              className="thumbnail-upload"
            >
              <div className="upload-area small">
                <FaUpload className="upload-icon" />
                <p>Upload new book cover</p>
                <p className="upload-hint">Leave empty to keep current thumbnail</p>
              </div>
            </Upload>
          </Form.Item>
        )}

        <div className="form-actions">
          <Button
            type="default"
            size="large"
            onClick={onCancel}
            className="cancel-button"
            icon={<FaTimes />}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            className="submit-button"
            icon={<FaSave />}
          >
            Update {getMaterialTitle()}
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default EditStudyMaterialForm;

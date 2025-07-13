import React, { useState } from "react";
import { Form, message, Select, Upload, Button } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { addVideo, addNote, addPastPaper, addBook } from "../../../apicalls/study";
import { primarySubjects, primaryKiswahiliSubjects, secondarySubjects, advanceSubjects } from "../../../data/Subjects";
import {
  FaUpload,
  FaVideo,
  FaFileAlt,
  FaBook,
  FaGraduationCap,
  FaCloudUploadAlt
} from "react-icons/fa";
import "./AddStudyMaterialForm.css";

const { Option } = Select;

function AddStudyMaterialForm({ materialType, onSuccess, onCancel }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [thumbnailList, setThumbnailList] = useState([]);
  const [videoFileList, setVideoFileList] = useState([]);
  const [uploadMethod, setUploadMethod] = useState("youtube"); // "youtube", "upload", or "s3url"
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(""); // "uploading", "processing", "complete"
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Get subjects based on level
  const getSubjectsForLevel = (level) => {
    switch (level) {
      case "primary":
        return primarySubjects;
      case "primary_kiswahili":
        return primaryKiswahiliSubjects;
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
        return ["1", "2", "3", "4", "5", "6", "7"];
      case "primary_kiswahili":
        return ["1", "2", "3", "4", "5", "6", "7"];
      case "secondary":
        return ["1", "2", "3", "4"];
      case "advance":
        return ["5", "6"];
      default:
        return [];
    }
  };

  const [availableSubjects, setAvailableSubjects] = useState(primarySubjects);
  const [availableClasses, setAvailableClasses] = useState(["1", "2", "3", "4", "5", "6", "7"]);
  const [selectedAdditionalClasses, setSelectedAdditionalClasses] = useState([]);

  const handleLevelChange = (level) => {
    setAvailableSubjects(getSubjectsForLevel(level));
    setAvailableClasses(getClassesForLevel(level));
    setSelectedAdditionalClasses([]); // Reset additional classes when level changes
    form.setFieldsValue({ subject: undefined, className: undefined });
  };

  const handleAdditionalClassesChange = (classes) => {
    setSelectedAdditionalClasses(classes);
  };

  const handleCoreClassChange = (value) => {
    // Remove the newly selected core class from additional classes if it's there
    const filteredAdditionalClasses = selectedAdditionalClasses.filter(cls => cls !== value);
    setSelectedAdditionalClasses(filteredAdditionalClasses);
  };

  const handleSubmit = async (values) => {
    let timeoutId;
    try {
      setLoading(true);
      setUploadProgress(0);
      setUploadStatus("");
      dispatch(ShowLoading());

      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (uploadProgress === 100) {
          setLoading(false);
          setUploadProgress(0);
          setUploadStatus("");
          dispatch(HideLoading());
          message.success("Video uploaded successfully! Thumbnail generation continues in background.");
        }
      }, 10000); // 10 seconds after upload completes

      let response;

      if (materialType === "videos") {
        // Add additional classes to values for videos
        const videoValues = {
          ...values,
          additionalClasses: selectedAdditionalClasses
        };

        // For videos, handle YouTube, S3 URL, and file upload methods
        if (uploadMethod === "youtube") {
          // Send JSON data for YouTube videos
          setUploadStatus("Adding YouTube video...");
          response = await addVideo(videoValues);
        } else if (uploadMethod === "s3url") {
          // Handle S3 URL method with optional thumbnail upload
          if (thumbnailList.length > 0 && thumbnailList[0].originFileObj) {
            // If thumbnail is provided, create FormData to upload thumbnail
            const formData = new FormData();

            // Add form fields
            Object.keys(videoValues).forEach(key => {
              if (videoValues[key] !== undefined && videoValues[key] !== null) {
                if (Array.isArray(videoValues[key])) {
                  // Handle arrays (like additionalClasses)
                  videoValues[key].forEach(item => formData.append(key, item));
                } else {
                  formData.append(key, videoValues[key]);
                }
              }
            });

            // Add thumbnail file
            formData.append("thumbnail", thumbnailList[0].originFileObj);
            setUploadStatus("Uploading thumbnail and adding video...");
            response = await addVideo(formData);
          } else {
            // No thumbnail, send JSON data
            setUploadStatus("Adding S3 video...");
            response = await addVideo(videoValues);
          }
        } else {
          // Create FormData for video file upload
          const formData = new FormData();

          // Add form fields
          Object.keys(videoValues).forEach(key => {
            if (videoValues[key] !== undefined && videoValues[key] !== null) {
              if (Array.isArray(videoValues[key])) {
                // Handle arrays (like additionalClasses)
                videoValues[key].forEach(item => formData.append(key, item));
              } else {
                formData.append(key, videoValues[key]);
              }
            }
          });

          // Add video file
          if (videoFileList.length > 0 && videoFileList[0].originFileObj) {
            formData.append("video", videoFileList[0].originFileObj);
            setUploadStatus("Uploading video file...");
          }

          // Add thumbnail file if provided
          if (thumbnailList.length > 0 && thumbnailList[0].originFileObj) {
            console.log('📎 Adding thumbnail to upload:', thumbnailList[0].name);
            formData.append("thumbnail", thumbnailList[0].originFileObj);
          }

          // Upload with enhanced progress tracking
          setUploadStartTime(Date.now());
          response = await addVideo(formData, (progress, loaded, total) => {
            setUploadProgress(progress);

            // Calculate upload speed and estimated time
            if (uploadStartTime) {
              const elapsedTime = (Date.now() - uploadStartTime) / 1000; // seconds
              const uploadedBytes = loaded || (total * progress / 100);
              const speed = uploadedBytes / elapsedTime; // bytes per second
              const remainingBytes = total - uploadedBytes;
              const estimatedSeconds = remainingBytes / speed;

              setUploadSpeed(speed);
              setEstimatedTime(estimatedSeconds);
            }

            if (progress === 100) {
              setUploadStatus("Finalizing upload...");
            } else if (progress > 0) {
              setUploadStatus(`Uploading... ${progress}%`);
            }
          });
        }
      } else {
        // For other materials, create FormData
        const formData = new FormData();
        
        // Add form fields
        Object.keys(values).forEach(key => {
          if (values[key] !== undefined && values[key] !== null) {
            formData.append(key, values[key]);
          }
        });

        // Add files
        if (fileList.length > 0 && fileList[0].originFileObj) {
          formData.append("document", fileList[0].originFileObj);
        }

        if (materialType === "books" && thumbnailList.length > 0 && thumbnailList[0].originFileObj) {
          formData.append("thumbnail", thumbnailList[0].originFileObj);
        }

        // Call appropriate API
        switch (materialType) {
          case "study-notes":
            response = await addNote(formData);
            break;
          case "past-papers":
            response = await addPastPaper(formData);
            break;
          case "books":
            response = await addBook(formData);
            break;
          default:
            throw new Error("Invalid material type");
        }
      }

      if (response.status === 201 && response.data.success) {
        message.success(response.data.message);
        form.resetFields();
        setFileList([]);
        setThumbnailList([]);
        setVideoFileList([]);
        setSelectedAdditionalClasses([]);
        setUploadMethod("youtube");
        setUploadProgress(0);
        setUploadStatus("");
        onSuccess(materialType);
      } else {
        const errorMessage = response.data?.message || "Failed to add material";
        message.error(errorMessage);
      }
    } catch (error) {
      console.error("Error adding material:", error);

      // Provide specific error messages based on error type
      if (error.code === 'ECONNABORTED') {
        message.error("Upload timeout. Please try with a smaller file or check your internet connection.");
      } else if (error.response?.status === 413) {
        message.error("File too large. Please use a file smaller than 500MB.");
      } else if (error.response?.status === 400) {
        message.error(error.response.data?.message || "Invalid file or form data.");
      } else if (error.response?.status === 500) {
        message.error("Server error. Please try again later.");
      } else {
        message.error("Upload failed. Please check your internet connection and try again.");
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);
      setUploadProgress(0);
      setUploadStatus("");
      dispatch(HideLoading());
    }
  };

  const uploadProps = {
    beforeUpload: () => false, // Prevent auto upload
    maxCount: 1,
    accept: materialType === "videos" ? undefined : ".pdf,.doc,.docx,.ppt,.pptx",
  };

  const videoUploadProps = {
    beforeUpload: () => false,
    maxCount: 1,
    accept: "video/*",
  };

  const thumbnailUploadProps = {
    beforeUpload: () => false,
    maxCount: 1,
    accept: "image/*",
  };

  const getMaterialIcon = () => {
    switch (materialType) {
      case "videos":
        return <FaVideo />;
      case "study-notes":
        return <FaFileAlt />;
      case "past-papers":
        return <FaGraduationCap />;
      case "books":
        return <FaBook />;
      default:
        return <FaFileAlt />;
    }
  };

  const getMaterialTitle = () => {
    switch (materialType) {
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

  return (
    <div className="add-material-form">
      <div className="form-card">
        <div className="form-header-icon">
          {getMaterialIcon()}
          <h3>Add New {getMaterialTitle()}</h3>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ level: "primary" }}
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
                onChange={handleCoreClassChange}
              >
                {availableClasses.map(cls => (
                  <Option key={cls} value={cls}>{cls}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: "Please select a subject" }]}
          >
            <Select placeholder="Select subject" size="large">
              {availableSubjects.map(subject => (
                <Option key={subject} value={subject}>{subject}</Option>
              ))}
            </Select>
          </Form.Item>

          {materialType === "videos" && (
            <Form.Item
              label="Additional Classes (Optional)"
              className="additional-classes-section"
            >
              <div className="additional-classes-info">
                <p>Select additional classes that can access this video (besides the core class selected above)</p>
              </div>
              <Select
                mode="multiple"
                placeholder="Select additional classes (optional)"
                size="large"
                value={selectedAdditionalClasses}
                onChange={handleAdditionalClassesChange}
                style={{ width: '100%' }}
              >
                {availableClasses
                  .filter(cls => cls !== form.getFieldValue('className')) // Exclude the core class
                  .map(cls => (
                    <Option key={cls} value={cls}>{cls}</Option>
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

          {(materialType === "past-papers" || materialType === "books") && (
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

          {materialType === "videos" && (
            <>
              <Form.Item
                label="Upload Method"
                className="upload-method-section"
              >
                <div className="upload-method-selector">
                  <div
                    className={`method-option ${uploadMethod === "youtube" ? "active" : ""}`}
                    onClick={() => setUploadMethod("youtube")}
                  >
                    <FaVideo className="method-icon" />
                    <span>YouTube Video</span>
                    <p>Add video using YouTube ID</p>
                  </div>
                  <div
                    className={`method-option ${uploadMethod === "s3url" ? "active" : ""}`}
                    onClick={() => setUploadMethod("s3url")}
                  >
                    <FaCloudUploadAlt className="method-icon" />
                    <span>S3 Object URL</span>
                    <p>Add video using S3 bucket URL</p>
                  </div>
                  <div
                    className={`method-option ${uploadMethod === "upload" ? "active" : ""}`}
                    onClick={() => setUploadMethod("upload")}
                  >
                    <FaCloudUploadAlt className="method-icon" />
                    <span>Upload Video File</span>
                    <p>Upload video file to server</p>
                  </div>
                </div>
              </Form.Item>

              {uploadMethod === "youtube" ? (
                <>
                  <Form.Item
                    label="Video ID (YouTube)"
                    name="videoID"
                    rules={[{ required: uploadMethod === "youtube", message: "Please enter YouTube video ID" }]}
                  >
                    <input
                      type="text"
                      placeholder="Enter YouTube video ID (e.g., dQw4w9WgXcQ)"
                      className="form-input"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Video URL (Optional)"
                    name="videoUrl"
                  >
                    <input
                      type="url"
                      placeholder="Enter video URL (optional)"
                      className="form-input"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Thumbnail URL (Optional)"
                    name="thumbnailUrl"
                  >
                    <input
                      type="url"
                      placeholder="Enter thumbnail URL (optional)"
                      className="form-input"
                    />
                  </Form.Item>
                </>
              ) : uploadMethod === "s3url" ? (
                <>
                  <Form.Item
                    label="S3 Object URL"
                    name="videoUrl"
                    rules={[{ required: uploadMethod === "s3url", message: "Please enter S3 object URL" }]}
                  >
                    <input
                      type="url"
                      placeholder="Enter S3 object URL (e.g., https://your-bucket.s3.amazonaws.com/video.mp4)"
                      className="form-input"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Drag & Drop Thumbnail (Optional)"
                    className="upload-section"
                  >
                    <Upload
                      {...thumbnailUploadProps}
                      fileList={thumbnailList}
                      onChange={({ fileList }) => setThumbnailList(fileList)}
                      className="thumbnail-upload"
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const files = Array.from(e.dataTransfer.files);
                        const imageFiles = files.filter(file => file.type.startsWith('image/'));
                        if (imageFiles.length > 0) {
                          const file = imageFiles[0];
                          // Validate file size (5MB limit)
                          if (file.size > 5 * 1024 * 1024) {
                            message.error('Thumbnail file size must be less than 5MB');
                            return;
                          }
                          setThumbnailList([{
                            uid: '-1',
                            name: file.name,
                            status: 'done',
                            originFileObj: file,
                            url: URL.createObjectURL(file)
                          }]);
                          message.success('Thumbnail uploaded successfully!');
                        } else {
                          message.error('Please drop an image file (JPG, PNG, GIF)');
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                      }}
                    >
                      <div className={`upload-area small thumbnail-drop-zone ${isDragOver ? 'drag-over' : ''}`}>
                        <FaUpload className="upload-icon" />
                        <p>{isDragOver ? 'Drop thumbnail here!' : 'Drag & drop thumbnail or click to upload'}</p>
                        <p className="upload-hint">Auto-generated if not provided</p>
                        <p className="upload-hint">Supports JPG, PNG, GIF (Max: 5MB)</p>
                      </div>
                    </Upload>
                  </Form.Item>
                </>
              ) : (
                <>
                  <Form.Item
                    label="Upload Video File"
                    className="upload-section"
                  >
                    <Upload
                      {...videoUploadProps}
                      fileList={videoFileList}
                      onChange={({ fileList }) => setVideoFileList(fileList)}
                      className="video-upload"
                    >
                      <div className="upload-area">
                        <FaCloudUploadAlt className="upload-icon" />
                        <p>Click or drag video file to upload</p>
                        <p className="upload-hint">Supports MP4, AVI, MOV, WMV (Max: 500MB)</p>
                        <p className="upload-hint">Large files may take several minutes to upload</p>
                      </div>
                    </Upload>
                  </Form.Item>

                  <Form.Item
                    label="Upload Custom Thumbnail (Optional)"
                    className="upload-section"
                  >
                    <Upload
                      {...thumbnailUploadProps}
                      fileList={thumbnailList}
                      onChange={({ fileList }) => setThumbnailList(fileList)}
                      className="thumbnail-upload"
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const files = Array.from(e.dataTransfer.files);
                        const imageFiles = files.filter(file => file.type.startsWith('image/'));
                        if (imageFiles.length > 0) {
                          const file = imageFiles[0];
                          // Validate file size (5MB limit)
                          if (file.size > 5 * 1024 * 1024) {
                            message.error('Thumbnail file size must be less than 5MB');
                            return;
                          }
                          setThumbnailList([{
                            uid: '-1',
                            name: file.name,
                            status: 'done',
                            originFileObj: file,
                            url: URL.createObjectURL(file)
                          }]);
                          message.success('Thumbnail uploaded successfully!');
                        } else {
                          message.error('Please drop an image file (JPG, PNG, GIF)');
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                      }}
                    >
                      <div className={`upload-area small thumbnail-drop-zone ${isDragOver ? 'drag-over' : ''}`}>
                        <FaUpload className="upload-icon" />
                        <p>{isDragOver ? 'Drop thumbnail here!' : 'Drag & drop thumbnail or click to upload'}</p>
                        <p className="upload-hint">Auto-generated if not provided</p>
                        <p className="upload-hint">Supports JPG, PNG, GIF (Max: 5MB)</p>
                      </div>
                    </Upload>
                  </Form.Item>
                </>
              )}
            </>
          )}

          {materialType !== "videos" && (
            <Form.Item
              label={`Upload ${getMaterialTitle()} Document`}
              className="upload-section"
            >
              <Upload
                {...uploadProps}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                className="document-upload"
              >
                <div className="upload-area">
                  <FaCloudUploadAlt className="upload-icon" />
                  <p>Click or drag file to upload</p>
                  <p className="upload-hint">Supports PDF, DOC, DOCX, PPT, PPTX</p>
                </div>
              </Upload>
            </Form.Item>
          )}

          {materialType === "books" && (
            <Form.Item
              label="Upload Thumbnail (Optional)"
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
                  <p>Upload book cover</p>
                </div>
              </Upload>
            </Form.Item>
          )}

          {/* Enhanced Upload Progress Indicator */}
          {loading && uploadMethod === "upload" && materialType === "videos" && (
            <div className="upload-progress-section">
              <div className="progress-header">
                <div className="progress-info">
                  <span className="progress-text">{uploadStatus}</span>
                  <span className="progress-percentage">{uploadProgress}%</span>
                </div>
                {uploadSpeed > 0 && (
                  <div className="upload-stats">
                    <span className="upload-speed">
                      📊 {(uploadSpeed / (1024 * 1024)).toFixed(2)} MB/s
                    </span>
                    {estimatedTime > 0 && estimatedTime < 3600 && (
                      <span className="estimated-time">
                        ⏱️ {Math.ceil(estimatedTime)}s remaining
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${uploadProgress}%`,
                    transition: 'width 0.3s ease'
                  }}
                ></div>
              </div>

              <div className="progress-details">
                {uploadProgress < 100 ? (
                  <div className="uploading-info">
                    <span>📤 Uploading video file to server...</span>
                    <small>Please keep this tab open until upload completes</small>
                  </div>
                ) : (
                  <div className="processing-info">
                    <span>🎬 Upload complete! Processing video and generating thumbnail...</span>
                    <small>This may take a few moments for large files</small>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
            <Button
              type="default"
              onClick={onCancel}
              size="large"
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              className="submit-btn"
            >
              {loading ? (
                uploadMethod === "upload" && materialType === "videos" ?
                "Uploading..." : "Adding..."
              ) : (
                `Add ${getMaterialTitle()}`
              )}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default AddStudyMaterialForm;

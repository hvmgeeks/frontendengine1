import React, { useState } from 'react';
import { Form, Input, Select, Upload, Button, message, Row, Col } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { addLiterature } from '../../../apicalls/study';

const { Option } = Select;
const { TextArea } = Input;

const LiteratureForm = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [thumbnailList, setThumbnailList] = useState([]);
  const [selectedAdditionalClasses, setSelectedAdditionalClasses] = useState([]);

  const secondaryClasses = ['1', '2', '3', '4'];
  const subjects = ['English', 'Kiswahili', 'Literature'];
  const genres = [
    { value: 'play', label: 'Play' },
    { value: 'novel', label: 'Novel' },
    { value: 'poetry', label: 'Poetry' },
    { value: 'short-story', label: 'Short Story' },
    { value: 'drama', label: 'Drama' }
  ];
  const languages = [
    { value: 'english', label: 'English' },
    { value: 'kiswahili', label: 'Kiswahili' }
  ];

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      if (fileList.length === 0) {
        message.error('Please upload a document file');
        return;
      }

      const formData = new FormData();
      formData.append('className', values.className);
      formData.append('additionalClasses', JSON.stringify(selectedAdditionalClasses));
      formData.append('subject', values.subject);
      formData.append('title', values.title);
      formData.append('description', values.description || '');
      formData.append('year', values.year || '');
      formData.append('author', values.author || '');
      formData.append('genre', values.genre);
      formData.append('language', values.language);
      formData.append('tags', values.tags || '');
      formData.append('document', fileList[0].originFileObj);

      // Add thumbnail if provided
      if (thumbnailList.length > 0) {
        formData.append('thumbnail', thumbnailList[0].originFileObj);
      }

      const response = await addLiterature(formData);

      if (response.data.success) {
        message.success('Literature material added successfully!');
        form.resetFields();
        setFileList([]);
        setThumbnailList([]);
        setSelectedAdditionalClasses([]);
        onSuccess && onSuccess();
      } else {
        message.error(response.data.message || 'Failed to add literature material');
      }
    } catch (error) {
      console.error('Error adding literature:', error);
      message.error('Failed to add literature material. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleThumbnailChange = ({ fileList: newFileList }) => {
    setThumbnailList(newFileList);
  };

  const beforeUpload = (file) => {
    const isPDF = file.type === 'application/pdf';
    if (!isPDF) {
      message.error('You can only upload PDF files!');
      return false;
    }
    const isLt50M = file.size / 1024 / 1024 < 50;
    if (!isLt50M) {
      message.error('File must be smaller than 50MB!');
      return false;
    }
    return false; // Prevent automatic upload
  };

  const beforeThumbnailUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }
    return false; // Prevent automatic upload
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#f39c12' }}>
        Add Literature Material (Secondary Level Only)
      </h2>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          language: 'english'
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="className"
              label="Primary Class"
              rules={[{ required: true, message: 'Please select a primary class!' }]}
            >
              <Select placeholder="Select primary class">
                {secondaryClasses.map(cls => (
                  <Option key={cls} value={cls}>Form {cls}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: 'Please select a subject!' }]}
            >
              <Select placeholder="Select subject">
                {subjects.map(subject => (
                  <Option key={subject} value={subject}>{subject}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Additional Classes (Optional)"
              help="Select additional classes where this literature material can be used"
            >
              <Select
                mode="multiple"
                placeholder="Select additional classes (optional)"
                value={selectedAdditionalClasses}
                onChange={setSelectedAdditionalClasses}
                style={{ width: '100%' }}
              >
                {secondaryClasses.map(cls => (
                  <Option key={cls} value={cls}>Form {cls}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter the title!' }]}
            >
              <Input placeholder="Enter literature title" />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="author"
              label="Author"
            >
              <Input placeholder="Enter author name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="genre"
              label="Genre"
              rules={[{ required: true, message: 'Please select a genre!' }]}
            >
              <Select placeholder="Select genre">
                {genres.map(genre => (
                  <Option key={genre.value} value={genre.value}>{genre.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="language"
              label="Language"
              rules={[{ required: true, message: 'Please select a language!' }]}
            >
              <Select placeholder="Select language">
                {languages.map(lang => (
                  <Option key={lang.value} value={lang.value}>{lang.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="year"
              label="Publication Year"
            >
              <Input placeholder="Enter publication year" />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="tags"
              label="Tags (comma separated)"
            >
              <Input placeholder="e.g. classic, drama, african literature" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea 
            rows={4} 
            placeholder="Enter a brief description of the literature material" 
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Document File (PDF)"
              required
            >
              <Upload
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={beforeUpload}
                accept=".pdf"
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>
                  Select PDF File
                </Button>
              </Upload>
              <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
                Only PDF files are allowed. Maximum size: 50MB
              </div>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Thumbnail Image (Optional)"
            >
              <Upload
                fileList={thumbnailList}
                onChange={handleThumbnailChange}
                beforeUpload={beforeThumbnailUpload}
                accept="image/*"
                maxCount={1}
                listType="picture"
              >
                <Button icon={<UploadOutlined />}>
                  Select Thumbnail
                </Button>
              </Upload>
              <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
                Image files only. Maximum size: 5MB. Will be displayed as book cover.
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: '30px' }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            style={{ 
              marginRight: '10px',
              backgroundColor: '#f39c12',
              borderColor: '#f39c12'
            }}
          >
            Add Literature Material
          </Button>
          <Button onClick={onCancel}>
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LiteratureForm;

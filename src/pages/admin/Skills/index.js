import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { message, Modal, Button, Table, Space, Tag, Input, Select, Form } from 'antd';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaVideo, 
  FaStar,
  FaSearch,
  FaFilter,
  FaUpload
} from 'react-icons/fa';
import { getAllSkillsAdmin, createSkill, updateSkill, deleteSkill } from '../../../apicalls/skills';
import './Skills.css';

const { Option } = Select;
const { TextArea } = Input;

const AdminSkills = () => {
  const { user } = useSelector((state) => state.user);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [form] = Form.useForm();
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  // Skill levels
  const skillLevels = [
    { value: 'beginner', label: 'Beginner', color: 'green' },
    { value: 'amateur', label: 'Amateur', color: 'blue' },
    { value: 'professional', label: 'Professional', color: 'orange' },
    { value: 'expert', label: 'Expert', color: 'red' }
  ];

  // Target audiences
  const targetAudiences = [
    { value: 'all', label: 'All Levels' },
    { value: 'primary', label: 'Primary' },
    { value: 'primary_kiswahili', label: 'Primary Kiswahili' },
    { value: 'secondary', label: 'Secondary' },
    { value: 'advance', label: 'Advanced' }
  ];

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const response = await getAllSkillsAdmin({
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      if (response.success) {
        setSkills(response.data);
      } else {
        message.error('Failed to fetch skills');
      }
    } catch (error) {
      message.error('Error fetching skills');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (file) => {
    if (!file) return null;

    setUploading(true);
    try {
      // For now, we'll just use the file name as a placeholder
      // In a real implementation, you would upload to your preferred storage service
      message.info('Video file selected. Please provide a video URL for now.');
      return null;
    } catch (error) {
      message.error('Error handling video file');
      console.error('Upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      let videoUrl = values.videoUrl;
      
      // Upload video if file is selected
      if (videoFile) {
        videoUrl = await handleVideoUpload(videoFile);
        if (!videoUrl) return;
      }

      const skillData = {
        ...values,
        videoUrl,
        createdBy: user._id,
        userId: user._id
      };

      let response;
      if (editingSkill) {
        response = await updateSkill(editingSkill._id, skillData);
      } else {
        response = await createSkill(skillData);
      }

      if (response.success) {
        message.success(`Skill ${editingSkill ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        setEditingSkill(null);
        setVideoFile(null);
        form.resetFields();
        fetchSkills();
      } else {
        message.error(response.message || 'Operation failed');
      }
    } catch (error) {
      message.error('Error saving skill');
      console.error('Error:', error);
    }
  };

  const handleEdit = (skill) => {
    setEditingSkill(skill);
    form.setFieldsValue({
      title: skill.title,
      description: skill.description,
      level: skill.level,
      category: skill.category,
      subject: skill.subject,
      targetAudience: skill.targetAudience,
      videoUrl: skill.videoUrl,
      duration: skill.duration,
      estimatedTime: skill.estimatedTime,
      difficulty: skill.difficulty,
      isActive: skill.isActive,
      isFeatured: skill.isFeatured,
      tags: skill.tags?.join(', ')
    });
    setModalVisible(true);
  };

  const handleDelete = async (skillId) => {
    Modal.confirm({
      title: 'Delete Skill',
      content: 'Are you sure you want to delete this skill? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await deleteSkill(skillId);
          if (response.success) {
            message.success('Skill deleted successfully');
            fetchSkills();
          } else {
            message.error('Failed to delete skill');
          }
        } catch (error) {
          message.error('Error deleting skill');
          console.error('Error:', error);
        }
      }
    });
  };

  const openCreateModal = () => {
    setEditingSkill(null);
    setVideoFile(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Filter skills based on search and level
  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || skill.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text, record) => (
        <div>
          <div className="font-semibold">{text}</div>
          <div className="text-xs text-gray-500">{record.category}</div>
        </div>
      )
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level) => {
        const levelConfig = skillLevels.find(l => l.value === level);
        return (
          <Tag color={levelConfig?.color || 'default'}>
            {levelConfig?.label || level}
          </Tag>
        );
      }
    },
    {
      title: 'Target Audience',
      dataIndex: 'targetAudience',
      key: 'targetAudience',
      width: 120,
      render: (audience) => {
        const audienceConfig = targetAudiences.find(a => a.value === audience);
        return <Tag color="blue">{audienceConfig?.label || audience}</Tag>;
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? 'Active' : 'Inactive'}
          </Tag>
          {record.isFeatured && <Tag color="gold">Featured</Tag>}
        </div>
      )
    },
    {
      title: 'Video',
      key: 'video',
      width: 80,
      render: (_, record) => (
        <div className="text-center">
          {record.videoUrl ? (
            <FaVideo className="text-green-500" />
          ) : (
            <span className="text-gray-400">No video</span>
          )}
        </div>
      )
    },
    {
      title: 'Views',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 80,
      render: (count) => count || 0
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<FaEdit />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            icon={<FaTrash />}
            onClick={() => handleDelete(record._id)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="admin-skills-container">
      <div className="skills-header">
        <div className="header-content">
          <h1 className="page-title">
            <FaVideo className="title-icon" />
            Skills Management
          </h1>
          <p className="page-description">
            Manage skill videos and learning content for students
          </p>
        </div>
        
        <Button
          type="primary"
          size="large"
          icon={<FaPlus />}
          onClick={openCreateModal}
          className="create-btn"
        >
          Add New Skill
        </Button>
      </div>

      {/* Filters */}
      <div className="skills-filters">
        <div className="filter-group">
          <Input
            placeholder="Search skills..."
            prefix={<FaSearch />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <Select
            value={levelFilter}
            onChange={setLevelFilter}
            className="level-filter"
            placeholder="Filter by level"
          >
            <Option value="all">All Levels</Option>
            {skillLevels.map(level => (
              <Option key={level.value} value={level.value}>
                {level.label}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Skills Table */}
      <div className="skills-table-container">
        <Table
          columns={columns}
          dataSource={filteredSkills}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} skills`
          }}
          scroll={{ x: 1000 }}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        title={editingSkill ? 'Edit Skill' : 'Create New Skill'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingSkill(null);
          setVideoFile(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
        className="skill-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="skill-form"
        >
          <div className="form-row">
            <Form.Item
              name="title"
              label="Skill Title"
              rules={[{ required: true, message: 'Please enter skill title' }]}
              className="form-item-half"
            >
              <Input placeholder="Enter skill title" />
            </Form.Item>

            <Form.Item
              name="level"
              label="Skill Level"
              rules={[{ required: true, message: 'Please select skill level' }]}
              className="form-item-half"
            >
              <Select placeholder="Select skill level">
                {skillLevels.map(level => (
                  <Option key={level.value} value={level.value}>
                    {level.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Enter skill description" />
          </Form.Item>

          <div className="form-row">
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please enter category' }]}
              className="form-item-half"
            >
              <Input placeholder="e.g., Programming, Design, etc." />
            </Form.Item>

            <Form.Item
              name="subject"
              label="Subject"
              className="form-item-half"
            >
              <Input placeholder="Related subject" />
            </Form.Item>
          </div>

          <div className="form-row">
            <Form.Item
              name="targetAudience"
              label="Target Audience"
              rules={[{ required: true, message: 'Please select target audience' }]}
              className="form-item-half"
            >
              <Select placeholder="Select target audience">
                {targetAudiences.map(audience => (
                  <Option key={audience.value} value={audience.value}>
                    {audience.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="difficulty"
              label="Difficulty (1-5)"
              className="form-item-half"
            >
              <Select placeholder="Select difficulty">
                {[1, 2, 3, 4, 5].map(num => (
                  <Option key={num} value={num}>
                    {num} {'⭐'.repeat(num)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Video Upload Section */}
          <div className="video-upload-section">
            <h4>Video Content</h4>
            
            <Form.Item
              name="videoUrl"
              label="Video URL (Optional - if you have a direct link)"
            >
              <Input placeholder="https://example.com/video.mp4" />
            </Form.Item>

            <div className="file-upload-section">
              <label className="upload-label">
                <FaUpload /> Upload Video File
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files[0])}
                className="file-input"
              />
              {videoFile && (
                <div className="file-info">
                  Selected: {videoFile.name}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <Form.Item
              name="duration"
              label="Video Duration"
              className="form-item-half"
            >
              <Input placeholder="e.g., 10:30" />
            </Form.Item>

            <Form.Item
              name="estimatedTime"
              label="Estimated Learning Time"
              className="form-item-half"
            >
              <Input placeholder="e.g., 30 minutes" />
            </Form.Item>
          </div>

          <Form.Item
            name="tags"
            label="Tags (comma separated)"
          >
            <Input placeholder="programming, javascript, tutorial" />
          </Form.Item>

          <div className="form-row">
            <Form.Item
              name="isActive"
              label="Status"
              className="form-item-half"
              initialValue={true}
            >
              <Select>
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="isFeatured"
              label="Featured"
              className="form-item-half"
              initialValue={false}
            >
              <Select>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="form-actions">
            <Button
              type="default"
              onClick={() => {
                setModalVisible(false);
                setEditingSkill(null);
                setVideoFile(null);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={uploading}
              icon={editingSkill ? <FaEdit /> : <FaPlus />}
            >
              {uploading ? 'Uploading...' : (editingSkill ? 'Update Skill' : 'Create Skill')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminSkills;

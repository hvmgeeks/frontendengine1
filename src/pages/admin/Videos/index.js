import React, { useState, useEffect } from 'react';
import { message, Table, Button, Modal, Form, Input, Select, Space, Popconfirm } from 'antd';
import { TbVideo, TbPlus, TbEdit, TbTrash, TbEye } from 'react-icons/tb';
import PageTitle from '../../../components/PageTitle';
import { useDispatch } from 'react-redux';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';

const { Option } = Select;

const AdminVideos = () => {
  const [videos, setVideos] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  // Mock data for demonstration
  const mockVideos = [
    {
      _id: '1',
      title: 'Introduction to Mathematics',
      subject: 'Mathematics',
      className: '1',
      level: 'Primary',
      videoUrl: 'https://example.com/video1.mp4',
      description: 'Basic math concepts for beginners',
      duration: '15:30',
      views: 1250,
      createdAt: '2024-01-15'
    },
    {
      _id: '2',
      title: 'English Grammar Basics',
      subject: 'English',
      className: '2',
      level: 'Primary',
      videoUrl: 'https://example.com/video2.mp4',
      description: 'Understanding basic grammar rules',
      duration: '20:45',
      views: 890,
      createdAt: '2024-01-10'
    }
  ];

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      dispatch(ShowLoading());
      // TODO: Replace with actual API call
      // const response = await getAllVideos();
      setVideos(mockVideos);
    } catch (error) {
      message.error('Failed to fetch videos');
    } finally {
      dispatch(HideLoading());
    }
  };

  const handleAddVideo = () => {
    setEditingVideo(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditVideo = (video) => {
    setEditingVideo(video);
    form.setFieldsValue(video);
    setIsModalVisible(true);
  };

  const handleDeleteVideo = async (videoId) => {
    try {
      dispatch(ShowLoading());
      // TODO: Replace with actual API call
      // await deleteVideo(videoId);
      setVideos(videos.filter(video => video._id !== videoId));
      message.success('Video deleted successfully');
    } catch (error) {
      message.error('Failed to delete video');
    } finally {
      dispatch(HideLoading());
    }
  };

  const handleSubmit = async (values) => {
    try {
      dispatch(ShowLoading());
      if (editingVideo) {
        // TODO: Replace with actual API call
        // await updateVideo(editingVideo._id, values);
        setVideos(videos.map(video => 
          video._id === editingVideo._id ? { ...video, ...values } : video
        ));
        message.success('Video updated successfully');
      } else {
        // TODO: Replace with actual API call
        // const response = await createVideo(values);
        const newVideo = { ...values, _id: Date.now().toString(), views: 0, createdAt: new Date().toISOString() };
        setVideos([...videos, newVideo]);
        message.success('Video added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to save video');
    } finally {
      dispatch(HideLoading());
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.description}</div>
        </div>
      )
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject'
    },
    {
      title: 'Class',
      dataIndex: 'className',
      key: 'className',
      render: (className, record) => `${record.level} - Class ${className}`
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration'
    },
    {
      title: 'Views',
      dataIndex: 'views',
      key: 'views',
      render: (views) => views.toLocaleString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<TbEye />}
            onClick={() => window.open(record.videoUrl, '_blank')}
          >
            View
          </Button>
          <Button
            type="default"
            size="small"
            icon={<TbEdit />}
            onClick={() => handleEditVideo(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this video?"
            onConfirm={() => handleDeleteVideo(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<TbTrash />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <PageTitle title="Video Management" />
        <Button
          type="primary"
          icon={<TbPlus />}
          onClick={handleAddVideo}
        >
          Add Video
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={videos}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} videos`
        }}
      />

      <Modal
        title={editingVideo ? 'Edit Video' : 'Add Video'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Video Title"
            rules={[{ required: true, message: 'Please enter video title' }]}
          >
            <Input placeholder="Enter video title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={3} placeholder="Enter video description" />
          </Form.Item>

          <Form.Item
            name="videoUrl"
            label="Video URL"
            rules={[{ required: true, message: 'Please enter video URL' }]}
          >
            <Input placeholder="Enter video URL" />
          </Form.Item>

          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please select subject' }]}
          >
            <Select placeholder="Select subject">
              <Option value="Mathematics">Mathematics</Option>
              <Option value="English">English</Option>
              <Option value="Science">Science</Option>
              <Option value="Kiswahili">Kiswahili</Option>
              <Option value="History">History</Option>
              <Option value="Geography">Geography</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="level"
            label="Level"
            rules={[{ required: true, message: 'Please select level' }]}
          >
            <Select placeholder="Select level">
              <Option value="Primary">Primary</Option>
              <Option value="Secondary">Secondary</Option>
              <Option value="Advanced">Advanced</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="className"
            label="Class"
            rules={[{ required: true, message: 'Please enter class' }]}
          >
            <Input placeholder="Enter class number" />
          </Form.Item>

          <Form.Item
            name="duration"
            label="Duration"
            rules={[{ required: true, message: 'Please enter duration' }]}
          >
            <Input placeholder="e.g., 15:30" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingVideo ? 'Update' : 'Add'} Video
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminVideos;

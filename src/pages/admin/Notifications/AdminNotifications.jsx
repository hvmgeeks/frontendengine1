import React, { useState, useEffect } from 'react';
import { message, Modal, Input, Select, Button, Card, List, Tag, Space } from 'antd';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TbBell,
  TbSend,
  TbUsers,
  TbPlus,
  TbTrash,
  TbDashboard
} from 'react-icons/tb';
import { useDispatch } from 'react-redux';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';
import { 
  sendAdminNotification, 
  getAdminNotifications,
  deleteAdminNotification 
} from '../../../apicalls/notifications';
import { getAllUsers } from '../../../apicalls/users';
import './AdminNotifications.css';

const { TextArea } = Input;
const { Option } = Select;

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    recipients: 'all', // 'all', 'specific', 'level', 'class'
    specificUsers: [],
    level: '',
    class: '',
    priority: 'medium'
  });
  const [users, setUsers] = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchUsers();
    fetchSentNotifications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getAllUsers();
      if (response.success) {
        setUsers(response.data.filter(user => !user.isAdmin));
      }
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      dispatch(HideLoading());
    }
  };

  const fetchSentNotifications = async () => {
    try {
      const response = await getAdminNotifications();
      if (response.success) {
        setSentNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch sent notifications:', error);
    }
  };

  const handleSendNotification = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      message.error('Please fill in title and message');
      return;
    }

    try {
      setLoading(true);
      const response = await sendAdminNotification(form);
      
      if (response.success) {
        message.success(`Notification sent to ${response.data.recipientCount} users`);
        setIsModalVisible(false);
        resetForm();
        fetchSentNotifications();
      } else {
        message.error(response.message || 'Failed to send notification');
      }
    } catch (error) {
      message.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      message: '',
      recipients: 'all',
      specificUsers: [],
      level: '',
      class: '',
      priority: 'medium'
    });
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const response = await deleteAdminNotification(notificationId);
      if (response.success) {
        message.success('Notification deleted');
        fetchSentNotifications();
      }
    } catch (error) {
      message.error('Failed to delete notification');
    }
  };

  const getRecipientText = (notification) => {
    if (notification.recipientType === 'all') return 'All Users';
    if (notification.recipientType === 'level') return `Level: ${notification.targetLevel}`;
    if (notification.recipientType === 'class') return `Class: ${notification.targetClass}`;
    if (notification.recipientType === 'specific') return `${notification.recipientCount} specific users`;
    return 'Unknown';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'blue';
      case 'medium': return 'orange';
      case 'high': return 'red';
      case 'urgent': return 'purple';
      default: return 'blue';
    }
  };

  return (
    <div className="admin-notifications">
      <div className="admin-notifications-header">
        <div className="flex items-center gap-4 mb-4">
          {/* Dashboard Shortcut */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-md"
          >
            <TbDashboard className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
          </motion.button>

          <div>
            <h1 className="page-title">
              <TbBell className="title-icon" />
              Send Notifications
            </h1>
            <p className="page-description">
              Send notifications to users that will appear in their notification dashboard
            </p>
          </div>
        </div>

        <Button
          type="primary" 
          icon={<TbPlus />}
          onClick={() => setIsModalVisible(true)}
          size="large"
        >
          Send New Notification
        </Button>
      </div>

      {/* Sent Notifications List */}
      <Card title="Recently Sent Notifications" className="sent-notifications-card">
        <List
          dataSource={sentNotifications}
          renderItem={(notification) => (
            <List.Item
              actions={[
                <Button 
                  type="text" 
                  icon={<TbTrash />} 
                  danger
                  onClick={() => handleDeleteNotification(notification._id)}
                >
                  Delete
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {notification.title}
                    <Tag color={getPriorityColor(notification.priority)}>
                      {notification.priority}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <p>{notification.message}</p>
                    <Space size="large" className="notification-meta">
                      <span>
                        <TbUsers className="meta-icon" />
                        {getRecipientText(notification)}
                      </span>
                      <span>
                        Sent: {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </Space>
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: 'No notifications sent yet' }}
        />
      </Card>

      {/* Send Notification Modal */}
      <Modal
        title="Send New Notification"
        open={isModalVisible}
        onOk={handleSendNotification}
        onCancel={() => {
          setIsModalVisible(false);
          resetForm();
        }}
        confirmLoading={loading}
        width={600}
        okText="Send Notification"
        okButtonProps={{ icon: <TbSend /> }}
      >
        <div className="notification-form">
          <div className="form-group">
            <label>Title *</label>
            <Input
              placeholder="Enter notification title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Message *</label>
            <TextArea
              placeholder="Enter notification message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <Select
              value={form.priority}
              onChange={(value) => setForm({ ...form, priority: value })}
              style={{ width: '100%' }}
            >
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </div>

          <div className="form-group">
            <label>Send To</label>
            <Select
              value={form.recipients}
              onChange={(value) => setForm({ ...form, recipients: value })}
              style={{ width: '100%' }}
            >
              <Option value="all">All Users</Option>
              <Option value="level">Specific Level</Option>
              <Option value="class">Specific Class</Option>
              <Option value="specific">Specific Users</Option>
            </Select>
          </div>

          {form.recipients === 'level' && (
            <div className="form-group">
              <label>Level</label>
              <Select
                value={form.level}
                onChange={(value) => setForm({ ...form, level: value })}
                style={{ width: '100%' }}
                placeholder="Select level"
              >
                <Option value="primary">Primary</Option>
                <Option value="secondary">Secondary</Option>
                <Option value="advance">Advance</Option>
              </Select>
            </div>
          )}

          {form.recipients === 'class' && (
            <div className="form-group">
              <label>Class</label>
              <Select
                value={form.class}
                onChange={(value) => setForm({ ...form, class: value })}
                style={{ width: '100%' }}
                placeholder="Select class"
              >
                {[1,2,3,4,5,6,7].map(num => (
                  <Option key={num} value={num.toString()}>{num}</Option>
                ))}
              </Select>
            </div>
          )}

          {form.recipients === 'specific' && (
            <div className="form-group">
              <label>Select Users</label>
              <Select
                mode="multiple"
                value={form.specificUsers}
                onChange={(value) => setForm({ ...form, specificUsers: value })}
                style={{ width: '100%' }}
                placeholder="Select users"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {users.map(user => (
                  <Option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </Option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminNotifications;

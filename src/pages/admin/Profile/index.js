import React, { useState, useEffect } from 'react';
import { message, Button, Input, Upload, Card, Form } from 'antd';
import { TbUser, TbEdit, TbDeviceFloppy, TbX, TbCamera } from 'react-icons/tb';
import { MdVerified } from 'react-icons/md';
import PageTitle from '../../../components/PageTitle';
import { useDispatch, useSelector } from 'react-redux';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';
import { getUserInfo, updateUserInfo } from '../../../apicalls/users';

const AdminProfile = () => {
  const { user } = useSelector(state => state.user);
  const [userDetails, setUserDetails] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getUserInfo();
      if (response.success) {
        setUserDetails(response.data);
        setImageUrl(response.data.profileImage || '');
        form.setFieldsValue({
          name: response.data.name,
          email: response.data.email,
          username: response.data.username
        });
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('Failed to fetch user details');
    } finally {
      dispatch(HideLoading());
    }
  };

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // TODO: Replace with actual image upload API
      // const response = await uploadProfileImage(formData);
      // if (response.success) {
      //   setImageUrl(response.data.url);
      //   message.success('Profile image updated successfully');
      // }
      
      // Mock implementation
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target.result);
        message.success('Profile image updated successfully');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      message.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload
  };

  const handleSave = async (values) => {
    try {
      dispatch(ShowLoading());
      const updateData = {
        ...values,
        profileImage: imageUrl
      };
      
      const response = await updateUserInfo(updateData);
      if (response.success) {
        setUserDetails({ ...userDetails, ...updateData });
        setEdit(false);
        message.success('Profile updated successfully');
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('Failed to update profile');
    } finally {
      dispatch(HideLoading());
    }
  };

  const handleCancel = () => {
    setEdit(false);
    form.setFieldsValue({
      name: userDetails?.name,
      email: userDetails?.email,
      username: userDetails?.username
    });
    setImageUrl(userDetails?.profileImage || '');
  };

  if (!userDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <PageTitle title="Admin Profile" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Profile</h1>
          <p className="text-gray-600">Manage your administrator account settings</p>
        </div>

        <Card className="shadow-xl">
          <div className="p-8">
            {/* Profile Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <TbUser className="w-16 h-16 text-white" />
                  )}
                </div>
                {edit && (
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleImageUpload}
                    className="absolute bottom-0 right-0"
                  >
                    <Button
                      shape="circle"
                      icon={<TbCamera />}
                      className="bg-blue-500 border-blue-500 text-white hover:bg-blue-600"
                      loading={uploading}
                    />
                  </Upload>
                )}
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{userDetails.name}</h2>
                  <MdVerified className="w-6 h-6 text-blue-500" title="Verified Admin" />
                </div>
                <p className="text-lg text-blue-600 font-medium">Administrator</p>
                <p className="text-gray-500">@{userDetails.username}</p>
              </div>
            </div>

            {/* Profile Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              className="max-w-2xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                  name="name"
                  label="Full Name"
                  rules={[{ required: true, message: 'Please enter your name' }]}
                >
                  <Input
                    size="large"
                    disabled={!edit}
                    className={!edit ? 'bg-gray-50' : ''}
                  />
                </Form.Item>

                <Form.Item
                  name="username"
                  label="Username"
                  rules={[{ required: true, message: 'Please enter your username' }]}
                >
                  <Input
                    size="large"
                    disabled={!edit}
                    className={!edit ? 'bg-gray-50' : ''}
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input
                    size="large"
                    disabled={!edit}
                    className={!edit ? 'bg-gray-50' : ''}
                  />
                </Form.Item>

                <div className="flex items-end">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <Input
                      size="large"
                      value="Administrator"
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 mt-8">
                {!edit ? (
                  <Button
                    type="primary"
                    size="large"
                    icon={<TbEdit />}
                    onClick={() => setEdit(true)}
                    className="px-8"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      size="large"
                      icon={<TbX />}
                      onClick={handleCancel}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      icon={<TbDeviceFloppy />}
                      htmlType="submit"
                      className="px-6"
                    >
                      Save Changes
                    </Button>
                  </>
                )}
              </div>
            </Form>

            {/* Admin Stats */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">Admin</div>
                  <div className="text-sm text-gray-600">Account Type</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">Active</div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Date(userDetails.createdAt).getFullYear()}
                  </div>
                  <div className="text-sm text-gray-600">Member Since</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfile;

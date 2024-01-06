import React, { useEffect, useState } from "react";
import './index.css';
import PageTitle from "../../../components/PageTitle";
import { getUserInfo, updateUserInfo, updateUserPhoto, sendOTP } from "../../../apicalls/users";
import { Form, message } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";

const Profile = () => {
    const [userDetails, setUserDetails] = useState('');
    const [edit, setEdit] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });
    const [profileImage, setProfileImage] = useState(null);
    const [serverGeneratedOTP, setServerGeneratedOTP] = useState(null);
    const dispatch = useDispatch();

    const getUserData = async () => {
        dispatch(ShowLoading());
        try {
            const response = await getUserInfo();
            if (response.success) {
                setUserDetails(response.data);
                setFormData({
                    ...formData,
                    name: response.data.name,
                    email: response.data.email
                });
                if (response.data.profileImage) {
                    setProfileImage(response.data.profileImage);
                }
                dispatch(HideLoading());
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        }
    };

    useEffect(() => {
        if (localStorage.getItem("token")) {
            getUserData();
        }
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    };

    const discardChanges = () => {
        setFormData({
            ...formData,
            name: userDetails.name,
            email: userDetails.email
        })
        setEdit(false);
    };

    const sendOTPRequest = async (email) => {
        dispatch(ShowLoading());
        try {
            const response = await sendOTP({ email });
            if (response.success) {
                message.success('Please verify new email!');
                setEdit(false);
                setServerGeneratedOTP(response.data);
            } else {
                message.error(response.message);
                discardChanges();
            }
        } catch (error) {
            message.error(error.message);
            discardChanges();
        }
        dispatch(HideLoading());
    };

    const handleUpdate = async ({ skipOTP }) => {
        if (formData.name === userDetails.name && formData.email === userDetails.email) {
            return;
        }
        if (!skipOTP && formData.email !== userDetails.email) {
            sendOTPRequest(formData.email);
            return;
        }
        dispatch(ShowLoading());
        try {
            const response = await updateUserInfo(formData);
            if (response.success) {
                message.success('Info updated successfully!');
                setEdit(false);
                setServerGeneratedOTP(null);
                getUserData();
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        }
        dispatch(HideLoading());
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setProfileImage(file);
    };

    const handleImageUpload = async () => {
        const formData = new FormData();
        formData.append('profileImage', profileImage);
        try {
            const response = await updateUserPhoto(formData);
            if (response.success) {
                message.success('Photo updated successfully!');
                getUserData();
            } else {
                message.error(response.message);
            }
        } catch (error) {
            message.error(error.message);
        }
    };

    const verifyUser = async (values) => {
        if (values.otp === serverGeneratedOTP) {
            handleUpdate({ skipOTP: true });
        }
        else {
            message.error('Invalid OTP');
        }
    }

    return (
        <div className="Profile">
            <PageTitle title="Profile" />
            <div className="divider"></div>
            {serverGeneratedOTP ?
                <div className="card p-3 bg-white">
                    <div>
                        <h1 className="text-2xl">
                            - Verification<i className="ri-user-add-line"></i>
                        </h1>
                        <div className="divider"></div>
                        <Form layout="vertical" className="mt-2" onFinish={verifyUser}>
                            <Form.Item name="otp" label="OTP" initialValue="">
                                <input type="number" />
                            </Form.Item>
                            <div className="flex flex-col gap-2">
                                <button
                                    type="submit"
                                    className="primary-contained-btn mt-2 w-100"
                                >
                                    Submit
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
                :
                <>
                    <div className="profile-picture-container">
                        <div className="profile-picture" onClick={() => document.getElementById('profileImageInput').click()}>
                            {profileImage ? (
                                <img src={profileImage instanceof File ? URL.createObjectURL(profileImage) : profileImage} alt="Profile" />
                            ) : (
                                <>
                                    <div className="overlay">Upload Image</div>
                                </>
                            )}
                        </div>
                        <input
                            id="profileImageInput"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                        />
                        {profileImage instanceof File && (
                            <button className="btn btn-mt" onClick={handleImageUpload}>
                                Save
                            </button>
                        )}
                    </div>
                    <div className="input-container">
                        <label htmlFor="name" className="label">
                            User Name
                        </label>
                        <br />
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="input"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={!edit}
                        />
                    </div>
                    <div className="input-container">
                        <label htmlFor="email" className="label">
                            Email Address
                        </label>
                        <br />
                        <input
                            type="text"
                            id="email"
                            name="email"
                            className="input"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!edit}
                        />
                    </div>
                    {!edit ?
                        <div className="edit-btn-div">
                            <button className="btn" onClick={(e) => setEdit(true)}>Edit</button>
                        </div>
                        :
                        <div className="btns-container">
                            <button className="btn" onClick={discardChanges}>Cancel</button>
                            <button className="btn" onClick={handleUpdate}>Update</button>
                        </div>
                    }
                </>
            }
        </div>
    );
}

export default Profile;
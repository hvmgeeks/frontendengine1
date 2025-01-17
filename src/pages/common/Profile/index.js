import React, { useEffect, useState } from "react";
import "./index.css";
import PageTitle from "../../../components/PageTitle";
import {
  getUserInfo,
  updateUserInfo,
  updateUserPhoto,
  sendOTP,
} from "../../../apicalls/users";
import { Form, message } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { getAllReportsForRanking } from "../../../apicalls/reports";

const Profile = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [rankingData, setRankingData] = useState(null);
  const [userRanking, setUserRanking] = useState(null);
  const [edit, setEdit] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    school: "",
    schoolType: "", // New field for school type
    class_: "",
    phoneNumber: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [serverGeneratedOTP, setServerGeneratedOTP] = useState(null);
  const dispatch = useDispatch();

  const fetchReports = async () => {
    try {
      const response = await getAllReportsForRanking();
      if (response.success) {
        setRankingData(response.data);
      } else {
        message.error(response.message);
      }
      dispatch(HideLoading());
    } catch (error) {
      message.error(error.message);
    }
  };

  const getUserStats = () => {
    const Ranking = rankingData
      .map((user, index) => ({
        user,
        ranking: index + 1,
      }))
      .filter((item) => item.user.userId.includes(userDetails._id));
    setUserRanking(Ranking);
  };

  useEffect(() => {
    if (rankingData) {
      getUserStats();
    }
  }, [rankingData]);

  const getUserData = async () => {
    dispatch(ShowLoading());
    try {
      const response = await getUserInfo();
      if (response.success) {
        setUserDetails(response.data);
        setFormData({
          ...formData,
          name: response.data.name,
          email: response.data.email,
          school: response.data.school,
          class_: response.data.class,
          schoolType: response.data.schoolType,
          phoneNumber:response.data.phoneNumber,
        });
        fetchReports();
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
  const { name, value } = e.target;

  if (name === "phoneNumber" && value.length > 10) return; // Limit to 10 digits

  setFormData((prevFormData) => ({
    ...prevFormData,
    [name]: value,
    ...(name === "schoolType" ? { class_: "" } : {}),
  }));
};

  const discardChanges = () => {
    setFormData({
      ...formData,
      name: userDetails.name,
      email: userDetails.email,
      school: userDetails.school,
      class_: userDetails.class,
      schoolType: userDetails.schoolType,
    });
    setEdit(false);
  };

  const sendOTPRequest = async (email) => {
    dispatch(ShowLoading());
    try {
      const response = await sendOTP({ email });
      if (response.success) {
        message.success("Please verify new email!");
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
    if (
      formData.name === userDetails.name &&
      formData.email === userDetails.email &&
      formData.school === userDetails.school &&
      formData.class_ === userDetails.class &&
      formData.phoneNumber === userDetails.phoneNumber &&
      formData.schoolType === useDispatch.schoolType
    ) {
      return;
    }

    if (!formData.class_) {
      message.error("Please select a class before updating your profile.");
      return;
    }

    // Check if any other fields have been updated
    if (
      formData.name === userDetails.name &&
      formData.email === userDetails.email &&
      formData.school === userDetails.school &&
      formData.class_ === userDetails.class &&
      formData.phoneNumber === userDetails.phoneNumber &&
      formData.schoolType === userDetails.schoolType
    ) {
      message.info("No changes detected to update.");
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
        message.success("Info updated successfully!");
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
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProfileImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    const formData = new FormData();
    formData.append("profileImage", profileImage);
    dispatch(ShowLoading());
    try {
      const response = await updateUserPhoto(formData);
      if (response.success) {
        message.success("Photo updated successfully!");
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
    } else {
      message.error("Invalid OTP");
    }
  };

  return (
    <div className="Profile">
      <PageTitle title="Profile" />
      <div className="divider"></div>
      {serverGeneratedOTP ? (
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
      ) : (
        <>
          <div className="profile-picture-container">
            <div
              className="profile-picture"
              onClick={() =>
                document.getElementById("profileImageInput").click()
              }
            >
              {imagePreview && <img src={imagePreview} alt="Profile Preview" />}
              {profileImage ? (
                <img src={profileImage} alt="Profile" />
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
              style={{ display: "none" }}
            />
            {profileImage instanceof File && (
              <button className="btn btn-mt" onClick={handleImageUpload}>
                Save
              </button>
            )}
          </div>
          {userRanking && !userDetails.isAdmin && (
            <div className="flex flex-row">
              <h1 className="ranking-data">
                Position:{" "}
                {userRanking[0]?.ranking
                  ? `#${userRanking[0].ranking}`
                  : "Not Ranked"}
              </h1>
              <h1 className="ranking-data">
                Score:{" "}
                {userRanking[0]?.user.score ? userRanking[0].user.score : "0"}
              </h1>
            </div>
          )}
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
            <label htmlFor="school" className="label">
              School
            </label>
            <br />
            <input
              type="text"
              id="school"
              name="school"
              className="input"
              value={formData.school ? formData.school : ""}
              onChange={handleChange}
              disabled={!edit}
            />
          </div>
          <div className="input-container">
            <label htmlFor="schoolType" className="label">
              School Type
            </label>
            <br />
            <select
              id="schoolType"
              name="schoolType"
              className="input"
              value={formData.schoolType}
              onChange={handleChange}
              disabled={!edit}
            >
              <option value="">Select School Type</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </div>

          <div className="input-container">
            <label htmlFor="class" className="label">
              Class
            </label>
            <br />
            <select
              id="class"
              name="class_"
              className="input"
              value={formData.class_}
              onChange={handleChange}
              disabled={!edit || !formData.schoolType}
            >
              <option value="">Select Class</option>

              {formData.schoolType === "primary" && (
                <>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                </>
              )}

              {formData.schoolType === "secondary" && (
                <>
                  <option value="Form-1">Form-1</option>
                  <option value="Form-2">Form-2</option>
                  <option value="Form-3">Form-3</option>
                  <option value="Form-4">Form-4</option>
                  <option value="Form-5">Form-5</option>
                  <option value="Form-6">Form-6</option>
                </>
              )}
            </select>
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
          <div className="input-container">
            <label htmlFor="email" className="label">
              Phone Number
            </label>
            <br />
            <input
              type="number"
              id="phoneNumber"
              name="phoneNumber"
              className="input"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={!edit}
            />
          </div>
          {!edit ? (
            <div className="edit-btn-div">
              <button className="btn" onClick={(e) => setEdit(true)}>
                Edit
              </button>
            </div>
          ) : (
            <div className="btns-container">
              <button className="btn" onClick={discardChanges}>
                Cancel
              </button>
              <button className="btn" onClick={handleUpdate}>
                Update
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;

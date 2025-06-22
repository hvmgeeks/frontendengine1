import { Form, message, Select } from "antd"; // Added Select for dropdown
import React, { useState } from "react";
import "./index.css";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, sendOTP } from "../../../apicalls/users";

function Register() {
  const [verification, setVerification] = useState(false);
  const [data, setData] = useState("");
  const [otp, setOTP] = useState("");
  const [loading, setLoading] = useState(false);
  const [schoolType, setSchoolType] = useState(""); // State to store selected school type
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const response = await registerUser(values);
      if (response.success) {
        message.success(response.message);
        navigate("/login");
      } else {
        message.error(response.message);
        setVerification(false);
      }
    } catch (error) {
      message.error(error.message);
      setVerification(false);
    }
    console.log(values);
  };

  const verifyUser = async (values) => {
    if (values.otp === otp) {
      onFinish(data);
    } else {
      message.error("Invalid OTP");
    }
  };

  const generateOTP = async (formData) => {
    if (!formData.name || !formData.email || !formData.password) {
      message.error("Please fill all fields!");
      return;
    }
    setLoading(true);
    try {
      const response = await sendOTP(formData);
      if (response.success) {
        message.success(response.message);
        setData(formData);
        setOTP(response.data);
        setVerification(true);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    }
    setLoading(false);
  };

  const handleSchoolTypeChange = (value) => {
    setSchoolType(value); // Update the state with selected school type
  };

  return (
    <div className="flex justify-center items-center bg-primary main">
      <div className="card p-3 bg-white">
        {verification ? (
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
        ) : (
          <div className="flex flex-col">
            <h1 className="text-2xl">
              - REGISTER<i className="ri-user-add-line"></i>
            </h1>
            <div className="divider"></div>
            <Form layout="vertical" className="mt-2" onFinish={onFinish}>
              <Form.Item name="name" label="Name" initialValue="" rules={[{ required: true, message: "Please enter your name!" }]}>
                <input type="text" />
              </Form.Item>
              <Form.Item name="school" label="School" initialValue="" rules={[{ required: true, message: "Please enter your school!" }]}>
                <input type="text" />
              </Form.Item>

              <Form.Item name="schoolType" label="School Type" initialValue="" rules={[{ required: true, message: "Please select your school type!" }]}
              >
                <select onChange={(e) => setSchoolType(e.target.value)}>
                  <option value="" disabled selected>
                    Select School Type
                  </option>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                </select>
              </Form.Item>

              <Form.Item name="class" label="Class" initialValue="" rules={[{ required: true, message: "Please select your class!" }]}>
                <select>
                  <option value="" disabled selected>
                    Select Class
                  </option>
                  {schoolType === "primary" && (
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
                  {schoolType === "secondary" && (
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
              </Form.Item>

              <Form.Item name="email" label="Email" initialValue="" rules={[{ required: true, message: "Please enter your email!" }]}>
                <input type="text" />
              </Form.Item>

              <Form.Item
                name="phoneNumber"
                label="Phone Number"
                initialValue=""
                rules={[
                  {
                    required: true,
                    message: "Please enter your phone number!",
                  },
                  {
                    pattern: /^\d{10}$/,
                    message: "Phone number must be exactly 10 digits!",
                  },
                ]}
                extra="This phone number will be used for the payment process."
              >
                <input type="text" maxLength="10" />
              </Form.Item>

              <Form.Item name="password" label="Password" initialValue="" rules={[{ required: true, message: "Please enter your password!" }]}>
                <input type="password" />
              </Form.Item>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  className="primary-contained-btn mt-2 w-100"
                  disabled={loading}
                >
                  Register
                </button>
                <Link to="/login">Already a member? Login</Link>
              </div>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;

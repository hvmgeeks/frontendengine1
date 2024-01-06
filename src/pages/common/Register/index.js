import { Form, message } from "antd";
import React, { useState } from "react";
import './index.css';
import { Link, useNavigate } from "react-router-dom";
import { registerUser, sendOTP } from "../../../apicalls/users";

function Register() {
  const [verification, setVerification] = useState(false);
  const [data, setData] = useState('');
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const onFinish = async (values) => {
    try {
      const response = await registerUser(values);
      if (response.success) {
        message.success(response.message);
        navigate('/login');
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
    }
    else {
      message.error('Invalid OTP');
    }
  }

  const generateOTP = async (formData) => {
    if (!formData.name || !formData.email || !formData.password) {
      message.error('Please fill all fields!');
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
  }

  return (
    <div className="flex justify-center items-center h-screen w-screen bg-primary">
      <div className="card p-3 bg-white">
        {verification ?
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
          :
          <div className="flex flex-col">
            <h1 className="text-2xl">
              - REGISTER<i className="ri-user-add-line"></i>
            </h1>
            <div className="divider"></div>
            <Form layout="vertical" className="mt-2" onFinish={generateOTP}>
              {/* <Form layout="vertical" className="mt-2" onFinish={onFinish}> */}
              <Form.Item name="name" label="Name" initialValue="">
                <input type="text" />
              </Form.Item>
              <Form.Item name="school" label="School" initialValue="">
                <input type="text" />
              </Form.Item>
              <Form.Item name="email" label="Email" initialValue="">
                <input type="text" />
              </Form.Item>
              <Form.Item name="password" label="Password" initialValue="">
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
        }
      </div>
    </div>
  );
}

export default Register;


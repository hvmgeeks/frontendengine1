import { Form, message } from "antd";
import React from "react";
import './index.css';
import Logo from '../../../assets/logo.png';
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../../apicalls/users";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";

function Login() {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());
      const response = await loginUser(values);
      dispatch(HideLoading());
      if (response.success) {

        message.success(response.message);
        localStorage.setItem("token", response.data);

        if (response.response.isAdmin) {
          window.location.href = "/admin/users";
        }

        if (!response.response.isAdmin) {
          window.location.href = "/user/quiz";

        }

      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen w-screen bg-primary">
      <div className="card p-3 bg-white">
        <div className="flex flex-col">
          <div className="flex justify-center">
            <img src={Logo} alt="brainwave-logo" className="login-logo"/>
          </div>
          <div className="divider"></div>
          <Form layout="vertical" className="mt-2" onFinish={onFinish}>
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
              >
                Login
              </button>
              <Link to="/register" className="underline">
                Not a member? Register
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default Login;
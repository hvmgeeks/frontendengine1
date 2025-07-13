import { Form, message, Input } from "antd";
import React, { useEffect } from "react";
import './index.css';
import Logo from '../../../assets/logo.png';
import { useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../../../apicalls/users";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { SetUser } from "../../../redux/usersSlice";

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [form] = Form.useForm();

  // Handle pre-filled data from registration
  useEffect(() => {
    if (location.state?.autoFill) {
      const { username, password, message: welcomeMessage } = location.state;

      // Pre-fill the form
      form.setFieldsValue({
        email: username, // Using email field for username
        password: password
      });

      // Show welcome message
      if (welcomeMessage) {
        message.success({
          content: welcomeMessage,
          duration: 4,
          style: { marginTop: '20px' }
        });
      }

      // Clear the state to prevent re-filling on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, form]);

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());
      const response = await loginUser(values);
      dispatch(HideLoading());

      console.log('Login response:', response);

      if (response.success) {
        message.success(response.message);
        localStorage.setItem("token", response.data);

        // Store user data in localStorage for consistency
        if (response.response) {
          localStorage.setItem("user", JSON.stringify(response.response));

          // IMPORTANT: Set user data in Redux immediately to prevent redirect issues
          dispatch(SetUser(response.response));
        }

        // Check admin status from response.response (user object)
        if (response.response?.isAdmin) {
          console.log("Admin user detected, redirecting to admin dashboard");
          navigate("/admin/dashboard");
        } else {
          // Always redirect regular users to hub first
          console.log("Regular user detected, redirecting to user hub");
          navigate("/user/hub");
        }
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      console.error('Login error:', error);
      message.error("Login failed. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={Logo} alt="BrainWave Logo" className="login-logo" />
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your account to continue learning</p>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} className="login-form">
          <Form.Item
            name="email"
            label="Username or Email"
            rules={[
              { required: true, message: "Please input your username or email!" }
            ]}
          >
            <Input
              className="form-input"
              placeholder="Enter your username or email"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              className="form-input"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <button type="submit" className="login-btn">
              Sign In
            </button>
          </Form.Item>
        </Form>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="login-link">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

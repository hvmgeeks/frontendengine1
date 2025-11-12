import { Form, message, Input, Checkbox } from "antd";
import React, { useEffect, useState, useRef } from "react";
import './index.css';
import Logo from '../../../assets/logo.png';
import { useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../../../apicalls/users";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { SetUser } from "../../../redux/usersSlice";
import { saveCredentials, getCredentials, clearCredentials, hasStoredCredentials } from "../../../utils/secureStorage";

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [form] = Form.useForm();
  const [rememberMe, setRememberMe] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const autoLoginInProgress = useRef(false);

  // Auto-login with saved credentials on component mount
  useEffect(() => {
    const attemptAutoLogin = async () => {
      // Prevent multiple auto-login attempts
      if (autoLoginInProgress.current || autoLoginAttempted) {
        return;
      }

      // Don't auto-login if coming from registration with pre-filled data
      if (location.state?.autoFill) {
        setAutoLoginAttempted(true);
        return;
      }

      // Check if user is already logged in
      const existingToken = localStorage.getItem('token');
      const existingUser = localStorage.getItem('user');
      if (existingToken && existingUser) {
        console.log('✅ User already logged in, redirecting...');
        try {
          const user = JSON.parse(existingUser);
          dispatch(SetUser(user));
          if (user.isAdmin) {
            navigate("/admin/dashboard");
          } else {
            navigate("/user/hub");
          }
        } catch (error) {
          console.error('Error parsing existing user:', error);
        }
        setAutoLoginAttempted(true);
        return;
      }

      // Try auto-login with saved credentials
      if (hasStoredCredentials()) {
        autoLoginInProgress.current = true;
        console.log('🔐 Found saved credentials, attempting auto-login...');

        const credentials = getCredentials();
        if (credentials && credentials.email && credentials.password) {
          try {
            dispatch(ShowLoading());
            const response = await loginUser({
              email: credentials.email,
              password: credentials.password
            });
            dispatch(HideLoading());

            if (response.success) {
              console.log('✅ Auto-login successful!');

              // Store authentication data
              localStorage.setItem("token", response.data);
              if (response.response) {
                localStorage.setItem("user", JSON.stringify(response.response));
                dispatch(SetUser(response.response));
              }

              message.success('Welcome back! Auto-login successful.', 2);

              // Navigate based on user role
              if (response.response?.isAdmin) {
                navigate("/admin/dashboard");
              } else {
                navigate("/user/hub");
              }
            } else {
              console.log('⚠️ Auto-login failed:', response.message);
              // Clear invalid credentials
              clearCredentials();
              // Pre-fill email for manual login
              form.setFieldsValue({ email: credentials.email });
            }
          } catch (error) {
            console.error('❌ Auto-login error:', error);
            dispatch(HideLoading());
            clearCredentials();
          }
        }
        autoLoginInProgress.current = false;
      }

      setAutoLoginAttempted(true);
    };

    attemptAutoLogin();
  }, [form, dispatch, navigate, location.state, autoLoginAttempted]);

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
        console.log('🔐 Login successful, storing token and user data');
        console.log('Token to store:', response.data);
        console.log('User to store:', response.response);
        console.log('Payment status:', response.paymentStatus);

        localStorage.setItem("token", response.data);
        console.log('✅ Token stored in localStorage');

        // Store user data in localStorage for consistency
        if (response.response) {
          localStorage.setItem("user", JSON.stringify(response.response));
          console.log('✅ User data stored in localStorage');

          // IMPORTANT: Set user data in Redux immediately to prevent redirect issues
          dispatch(SetUser(response.response));
          console.log('✅ User data set in Redux');
        }

        // Handle "Remember Me" functionality with secure storage
        if (rememberMe) {
          const saved = saveCredentials(values.email, values.password);
          if (saved) {
            console.log('✅ User credentials saved securely for auto-login');
          } else {
            console.error('❌ Failed to save credentials');
          }
        } else {
          // Remove saved credentials if "Remember Me" is unchecked
          clearCredentials();
          console.log('🗑️ Credentials cleared (Remember Me unchecked)');
        }

        // Verify storage immediately
        console.log('🔍 Verification - Token in localStorage:', localStorage.getItem('token'));
        console.log('🔍 Verification - User in localStorage:', localStorage.getItem('user'));

        // Handle different payment statuses
        if (response.paymentStatus === "PENDING") {
          message.warning({
            content: (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  Welcome! Payment Pending
                </div>
                <div style={{ marginBottom: '4px' }}>
                  {response.message}
                </div>
                {response.pendingSubscription && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Plan: {response.pendingSubscription.plan} |
                    Amount: {response.pendingSubscription.amount?.toLocaleString()} TZS
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>
                  Redirecting to subscription page...
                </div>
              </div>
            ),
            duration: 5,
            style: { marginTop: '20px' }
          });

          // Redirect to subscription page
          setTimeout(() => {
            navigate("/user/subscription");
          }, 2000);

        } else if (response.paymentStatus === "REQUIRED") {
          message.info({
            content: (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  Welcome! Subscription Required
                </div>
                <div style={{ marginBottom: '4px' }}>
                  {response.message}
                </div>
                <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>
                  Redirecting to subscription page...
                </div>
              </div>
            ),
            duration: 5,
            style: { marginTop: '20px' }
          });

          // Redirect to subscription page
          setTimeout(() => {
            navigate("/user/subscription");
          }, 2000);

        } else {
          // Normal login flow for users with active subscriptions
          message.success(response.message);

          // Check admin status from response.response (user object)
          if (response.response?.isAdmin) {
            console.log("Admin user detected, redirecting to admin dashboard");
            navigate("/admin/dashboard");
          } else {
            // Always redirect regular users to hub first
            console.log("Regular user detected, redirecting to user hub");
            navigate("/user/hub");
          }
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
            <div className="remember-me-container" style={{ marginBottom: '1rem' }}>
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ color: '#64748b' }}
              >
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  Remember me on this device
                </span>
              </Checkbox>
            </div>
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

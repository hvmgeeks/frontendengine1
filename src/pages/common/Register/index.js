import { Form, message, Input, Select } from "antd";
import React, { useState } from "react";
import "./index.css";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../../apicalls/users";
import Logo from "../../../assets/logo.png";

const { Option } = Select;

function Register() {
  const [loading, setLoading] = useState(false);
  const [schoolType, setSchoolType] = useState("");
  const [suggestedUsername, setSuggestedUsername] = useState("");
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Generate username from names (simplified - no middle name)
  const generateUsername = (firstName, lastName) => {
    if (!firstName) return "";

    const cleanName = (name) => name?.toLowerCase().replace(/[^a-z]/g, '') || '';
    const first = cleanName(firstName);
    const last = cleanName(lastName);

    // Generate different username options
    const options = [
      `${first}.${last}`,
      `${first}${last}`,
      `${first}_${last}`,
      `${first}${last}${Math.floor(Math.random() * 100)}`,
    ].filter(option => option.length >= 3);

    return options[0] || `user${Math.floor(Math.random() * 10000)}`;
  };

  // Generate automatic email from username
  const generateEmail = (username) => {
    if (!username) return '';
    const timestamp = Date.now();
    return `${username}.${timestamp}@brainwave.temp`;
  };

  // Handle name changes to auto-generate username and email
  const handleNameChange = () => {
    const firstName = form.getFieldValue('firstName');
    const lastName = form.getFieldValue('lastName');

    if (firstName) {
      const username = generateUsername(firstName, lastName);
      const email = generateEmail(username);
      setSuggestedUsername(username);

      console.log('🔄 Auto-generating:', { username, email });

      form.setFieldsValue({
        username,
        email // Auto-generate email
      });
    }
  };

  const onFinish = async (values) => {
    console.log("🚀 Registration data:", values);
    
    try {
      setLoading(true);
      
      // Prepare registration data with auto-generated email
      const autoEmail = values.email || generateEmail(values.username);

      const registrationData = {
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
        email: autoEmail, // Auto-generated email
        school: values.school,
        level: values.level === "Primary_Kiswahili" ? "primary_kiswahili" : values.level.toLowerCase(),
        class: values.class,
        phoneNumber: values.phoneNumber,
        password: values.password
      };
      
      const response = await registerUser(registrationData);
      if (response.success) {
        message.success({
          content: "🎉 Registration successful! Redirecting to login...",
          duration: 3,
          style: { marginTop: '20px' }
        });
        // Add a small delay to let user see the success message, then redirect with pre-filled data
        setTimeout(() => {
          navigate("/login", {
            state: {
              username: values.username,
              password: values.password,
              autoFill: true,
              message: "Account created successfully! Please login with your credentials."
            }
          });
        }, 1500);
      } else {
        message.error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      message.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <img src={Logo} alt="BrainWave Logo" className="register-logo" />
          <h1 className="register-title">Join BrainWave</h1>
          <p className="register-subtitle">Create your account and start learning</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="register-form"
        >
          {/* First Name */}
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: "Please enter your first name" }]}
          >
            <Input
              className="form-input"
              placeholder="Enter your first name"
              onChange={handleNameChange}
            />
          </Form.Item>

          {/* Last Name */}
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: "Please enter your last name" }]}
          >
            <Input
              className="form-input"
              placeholder="Enter your last name"
              onChange={handleNameChange}
            />
          </Form.Item>

          {/* Auto-Generated Email (Hidden but shown for transparency) */}
          <Form.Item
            name="email"
            label="Email Address"
            help="📧 We'll automatically create a unique email for you. You can update it later in your profile."
          >
            <Input
              className="form-input"
              placeholder="Auto-generated email will appear here"
              disabled
              style={{
                backgroundColor: '#f5f5f5',
                color: '#666',
                cursor: 'not-allowed'
              }}
            />
          </Form.Item>

          {/* Username */}
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please enter a username" }]}
          >
            <Input
              className="form-input"
              placeholder="Your username will be auto-generated"
              suffix={
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {suggestedUsername && `Suggested: ${suggestedUsername}`}
                </span>
              }
            />
          </Form.Item>

          {/* School */}
          <Form.Item
            name="school"
            label="School Name"
            rules={[{ required: true, message: "Please enter your school name" }]}
          >
            <Input
              className="form-input"
              placeholder="Enter your school name"
            />
          </Form.Item>

          {/* Education Level */}
          <Form.Item
            name="level"
            label="Education Level"
            rules={[{ required: true, message: "Please select your education level" }]}
          >
            <select
              className="form-input mobile-dropdown-fix"
              onChange={(e) => {
                setSchoolType(e.target.value);
                form.setFieldsValue({ level: e.target.value, class: undefined });
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                minHeight: '48px',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '16px',
                paddingRight: '40px'
              }}
            >
              <option value="">Select your education level</option>
              <option value="Primary">Primary Education (Classes 1-7)</option>
              <option value="Primary_Kiswahili">Elimu ya Msingi - Kiswahili (Madarasa 1-7)</option>
              <option value="Secondary">Secondary Education (Forms 1-4)</option>
              <option value="Advance">Advanced Level (Forms 5-6)</option>
            </select>
          </Form.Item>

          {/* Class/Form */}
          <Form.Item
            name="class"
            label="Class/Form"
            rules={[{ required: true, message: "Please select your class or form" }]}
          >
            <select
              className="form-input mobile-dropdown-fix"
              disabled={!schoolType}
              onChange={(e) => {
                form.setFieldsValue({ class: e.target.value });
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: schoolType ? 'white' : '#f9fafb',
                minHeight: '48px',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '16px',
                paddingRight: '40px',
                cursor: schoolType ? 'pointer' : 'not-allowed',
                opacity: schoolType ? 1 : 0.6
              }}
            >
              <option value="">{schoolType ? "Select your class/form" : "Please select education level first"}</option>
              {schoolType === "Primary" && [1, 2, 3, 4, 5, 6, 7].map((i) => (
                <option key={i} value={i}>{`Class ${i}`}</option>
              ))}
              {schoolType === "Primary_Kiswahili" && [1, 2, 3, 4, 5, 6, 7].map((i) => (
                <option key={i} value={i}>{`Darasa la ${i}`}</option>
              ))}
              {schoolType === "Secondary" && [1, 2, 3, 4].map((i) => (
                <option key={i} value={i}>{`Form ${i}`}</option>
              ))}
              {schoolType === "Advance" && [5, 6].map((i) => (
                <option key={i} value={i}>{`Form ${i}`}</option>
              ))}
            </select>
          </Form.Item>

          {/* Phone Number */}
          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            help="📱 This number will be used for payment confirmations and important notifications"
            rules={[
              { required: true, message: "Please enter your phone number" },
              { pattern: /^0[67]\d{8}$/, message: "Phone number must start with 06 or 07 and be 10 digits" }
            ]}
          >
            <Input
              type="tel"
              className="form-input"
              placeholder="Enter mobile number (e.g., 0712345678)"
              maxLength={10}
            />
          </Form.Item>

          {/* Password */}
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password
              className="form-input"
              placeholder="Create a password"
            />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Registering...
                </>
              ) : (
                "🚀 Create Account"
              )}
            </button>
          </Form.Item>

          {/* Login Link */}
          <div className="login-link">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Register;

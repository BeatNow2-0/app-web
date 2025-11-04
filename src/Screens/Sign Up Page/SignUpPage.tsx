import React, { ChangeEvent, FocusEvent, FormEvent, useState } from 'react';
import './SignUpPage.css';
import { Link } from 'react-router-dom';
import logo2 from '../../assets/Frame 2.png';
import CustomPopup from '../../components/Popup/CustomPopup';
import Header from '../../Layout/Header/Header';
import VerifyPopup from '../../components/VerifyPopup/VerifyPopup';
import LoadingPopup from '../../components/Loading/Loading';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import {
  checkAvailability,
  registerUser,
  requestAccessToken,
  sendConfirmationEmail,
} from '../../Model/api/auth';

const passwordRequirements = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,20}$/;

type FieldName = 'full_name' | 'username' | 'email' | 'password' | 'confirmPassword';

function SignUpPage() {
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [token, setToken] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState('');
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState(true);

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name as FieldName]: value }));
    if (name === 'email') {
      setEmailAvailable(true);
    }
    if (name === 'username') {
      setUsernameAvailable(true);
    }
  };

  const handleClose = () => {
    setShowPopup(false);
  };

  const handleAvailabilityBlur = async (event: FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name !== 'email' && name !== 'username') {
      return;
    }

    const field = name as 'email' | 'username';
    const isAvailable = await checkAvailability(field, value);
    if (field === 'email') {
      setEmailAvailable(isAvailable);
    } else {
      setUsernameAvailable(isAvailable);
    }

    if (!isAvailable && value) {
      setMessage(field === 'email' ? 'This email is already registered.' : 'This username is already taken.');
      setShowPopup(true);
    }
  };

  const validateForm = () => {
    if (!form.full_name || form.full_name.length > 40) {
      return 'Please enter a full name (max 40 characters).';
    }
    if (!form.username || form.username.length > 16 || /\s/.test(form.username)) {
      return 'Username must be less than 16 characters and contain no spaces.';
    }
    if (!form.email || form.email.length > 40 || !/\S+@\S+\.\S+/.test(form.email)) {
      return 'Please enter a valid email (max 40 characters).';
    }
    if (!passwordRequirements.test(form.password)) {
      return 'Password must be 8-20 characters and include uppercase, lowercase, number, and special character.';
    }
    if (form.confirmPassword !== form.password) {
      return 'Passwords do not match.';
    }
    if (!emailAvailable) {
      return 'This email is already registered.';
    }
    if (!usernameAvailable) {
      return 'This username is already taken.';
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errorMessage = validateForm();

    if (errorMessage) {
      setMessage(errorMessage);
      setShowPopup(true);
      return;
    }

    setShowLoading(true);

    try {
      await registerUser({
        full_name: form.full_name,
        username: form.username,
        email: form.email,
        password: form.password,
        is_active: false,
      });

      const accessToken = await requestAccessToken({
        username: form.username,
        password: form.password,
      });
      setToken(accessToken);

      try {
        await sendConfirmationEmail(accessToken);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      setShowVerify(true);
      setShowPopup(false);
    } catch (error) {
      console.error('Error during registration:', error);
      setMessage('Registration failed. Please try again.');
      setShowPopup(true);
    } finally {
      setShowLoading(false);
    }
  };

  return (
    <div className="app sign-up-page">
      {showPopup && <CustomPopup message={message} onClose={handleClose} />} 
      {showLoading && <LoadingPopup message="" />} 
      {showVerify && token && <VerifyPopup token={token} />} 

      <Header />

      <AuthLayout
        className="sign-up-page"
        reverse
        illustration={<img className="auth-illustration" src={logo2} alt="BeatNow illustration" />}
      >
        <div className="auth-content">
          <div>
            <h2 className="auth-title">Create New Account</h2>
            <p className="auth-subtitle">Please fill in the form to continue</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              className="auth-input"
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleFieldChange}
              placeholder="Full Name"
              maxLength={40}
            />

            <div className="field-grid">
              <input
                className="auth-input"
                type="text"
                name="username"
                value={form.username}
                onChange={handleFieldChange}
                onBlur={handleAvailabilityBlur}
                placeholder="Username"
                maxLength={16}
              />
              <input
                className="auth-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleFieldChange}
                onBlur={handleAvailabilityBlur}
                placeholder="Email"
                maxLength={40}
              />
            </div>

            <div className="field-grid">
              <input
                className="auth-input"
                type="password"
                name="password"
                value={form.password}
                onChange={handleFieldChange}
                placeholder="Password"
                maxLength={20}
              />
              <input
                className="auth-input"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleFieldChange}
                placeholder="Confirm Password"
                maxLength={20}
              />
            </div>

            <button className="btn btn-primary" type="submit">
              Sign up
            </button>
          </form>

          <p className="auth-note sign-in-cta">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </AuthLayout>
    </div>
  );
}

export default SignUpPage;

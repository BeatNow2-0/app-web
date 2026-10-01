import React, { ChangeEvent, FocusEvent, FormEvent, useState } from 'react';
import './SignUpPage.css';
import { Link, useNavigate } from 'react-router-dom';
import logo2 from '../../assets/Frame 2.png';
import CustomPopup from '../../components/Popup/CustomPopup';
import LoadingPopup from '../../components/Loading/Loading';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import {
  checkAvailability,
  registerUser,
} from '../../Model/api/auth';
import { Eye, EyeOff } from 'lucide-react';

const passwordRequirements = /^.{8,128}$/;

type FieldName = 'full_name' | 'username' | 'email' | 'password' | 'confirmPassword';

function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showLoading, setShowLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState('');
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [showPasswords, setShowPasswords] = useState(false);
  const [registered, setRegistered] = useState(false);

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
    if (registered) navigate('/login');
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
    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(form.username)) {
      return 'Username must be 3-32 characters using letters, numbers, dots, dashes or underscores.';
    }
    if (!form.email || form.email.length > 254 || !/\S+@\S+\.\S+/.test(form.email)) {
      return 'Please enter a valid email address.';
    }
    if (!passwordRequirements.test(form.password)) {
      return 'Password must be 8-128 characters.';
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
    if (showLoading) return;
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
      });

      setRegistered(true);
      setMessage('Account created. Check your email for activation instructions, then sign in.');
      setShowPopup(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed. Please try again.');
      setShowPopup(true);
    } finally {
      setShowLoading(false);
    }
  };

  return (
    <div className="app sign-up-page">
      {showPopup && <CustomPopup message={message} onClose={handleClose} />} 
      {showLoading && <LoadingPopup message="" />} 
      <AuthLayout
        className="sign-up-page"
        reverse
        illustration={<img className="auth-illustration" src={logo2} alt="BeatNow illustration" />}
      >
        <div className="auth-content">
          <div>
            <p className="page-eyebrow">Join BeatNow</p>
            <h1 className="auth-title">Build your producer profile.</h1>
            <p className="auth-subtitle">Publish beats, grow your catalog and connect with creators.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field"><span>Full name</span><input
              className="auth-input"
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleFieldChange}
              placeholder="Your name"
              autoComplete="name"
              maxLength={40}
            /></label>

            <div className="field-grid">
              <label className="auth-field"><span>Username</span><input
                className="auth-input"
                type="text"
                name="username"
                value={form.username}
                onChange={handleFieldChange}
                onBlur={handleAvailabilityBlur}
                placeholder="producer_name"
                autoComplete="username"
                maxLength={32}
              /></label>
              <label className="auth-field"><span>Email</span><input
                className="auth-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleFieldChange}
                onBlur={handleAvailabilityBlur}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
              /></label>
            </div>

            <div className="field-grid">
              <label className="auth-field"><span>Password</span><div className="password-control"><input
                className="auth-input"
                type={showPasswords ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleFieldChange}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                maxLength={128}
              /><button type="button" onClick={() => setShowPasswords((value) => !value)} aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}>{showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
              <label className="auth-field"><span>Confirm password</span><input
                className="auth-input"
                type={showPasswords ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleFieldChange}
                placeholder="Repeat password"
                autoComplete="new-password"
                maxLength={128}
              /></label>
            </div>

            <button className="button" type="submit" disabled={showLoading}>
              {showLoading ? 'Creating account...' : 'Sign up'}
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

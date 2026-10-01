import React, { useState } from 'react';
import './LoginPage.css';
import logo2 from '../../assets/Frame 2.png';
import { Link, useNavigate } from 'react-router-dom';
import CustomPopup from '../../components/Popup/CustomPopup';
import UserSingleton from '../../Model/UserSingleton';
import LoadingPopup from '../../components/Loading/Loading';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import {
  AccountNotVerifiedError,
  Credentials,
  fetchUserProfile,
  clearStoredSession,
  persistSession,
  requestLogin,
  UserData,
} from '../../Model/api/auth';
import { Eye, EyeOff } from 'lucide-react';

function LoginPage() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<Credentials>({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setShowPopup(false);
  };

  const navigateToDashboard = (accessToken: string) => {
    navigate('/dashboard', { state: { token: accessToken } });
  };

  const populateUser = (userData: UserData) => {
    const user = UserSingleton.getInstance();
    user.setFullName(userData.full_name);
    user.setUsername(userData.username);
    user.setEmail(userData.email);
    user.setId(userData.id);
    if (userData.profile_image_url) {
      user.setPhotoProfile(userData.profile_image_url);
    }
    user.setIsActive(userData.is_active);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (!credentials.username.trim() || !credentials.password.trim()) {
        throw new Error('Please fill in all fields.');
      }

      const session = await requestLogin(credentials);
      persistSession(session);
      const profile = await fetchUserProfile(session.access_token);
      populateUser(profile);
      navigateToDashboard(session.access_token);
    } catch (error) {
      clearStoredSession();
      if (error instanceof AccountNotVerifiedError) {
        navigate('/confirm-email', {
          replace: true,
          state: {
            verificationToken: error.verificationToken,
            credentials,
          },
        });
        return;
      }
      setMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app login-page">
      {showPopup && <CustomPopup message={message} onClose={handleClose} />}
      {loading && <LoadingPopup message="" />}
      <AuthLayout
        className="login-page"
        illustration={<img className="auth-illustration" src={logo2} alt="BeatNow illustration" />}
      >
        <div className="auth-content">
          <div>
            <p className="page-eyebrow">Producer access</p>
            <h1 className="auth-title">Welcome back.</h1>
            <p className="auth-subtitle">Sign in to manage your sound and discover what is next.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field"><span>Username</span><input
              className="auth-input"
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleFieldChange}
              placeholder="Your username"
              autoComplete="username"
            /></label>
            <label className="auth-field"><span>Password</span><div className="password-control"><input
              className="auth-input"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={credentials.password}
              onChange={handleFieldChange}
              placeholder="Your password"
              autoComplete="current-password"
            /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            <div className="login-actions">
              <Link className="forgot-link" to="/forgotPwd">
                Forgot password?
              </Link>
            </div>
            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="auth-note sign-up-cta">
            Don&apos;t have an account?{' '}
            <Link to="/register">Sign up</Link>
          </p>
        </div>
      </AuthLayout>
    </div>
  );
}

export default LoginPage;

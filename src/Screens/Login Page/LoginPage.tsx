import React, { useState } from 'react';
import './LoginPage.css';
import logo2 from '../../assets/Frame 2.png';
import { Link, useNavigate } from 'react-router-dom';
import CustomPopup from '../../components/Popup/CustomPopup';
import UserSingleton from '../../Model/UserSingleton';
import Header from '../../Layout/Header/Header';
import { signInOrRegisterWithGoogle } from '../../Model/firebaseConfig';
import LoadingPopup from '../../components/Loading/Loading';
import VerifyPopup from '../../components/VerifyPopup/VerifyPopup';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import {
  Credentials,
  fetchUserProfile,
  requestAccessToken,
  requestLogin,
  UserData,
} from '../../Model/api/auth';

function LoginPage() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<Credentials>({ username: '', password: '' });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState('');

  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setShowPopup(false);
  };

  const navigateToDashboard = (accessToken: string) => {
    navigate('/Dashboard', { state: { token: accessToken } });
  };

  const populateUser = (userData: UserData) => {
    const user = UserSingleton.getInstance();
    user.setFullName(userData.full_name);
    user.setUsername(userData.username);
    user.setEmail(userData.email);
    user.setId(userData.id);
    user.setIsActive(userData.is_active);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (!credentials.username.trim() || !credentials.password.trim()) {
        throw new Error('Please fill in all fields.');
      }

      await requestLogin(credentials);
      const accessToken = await requestAccessToken(credentials);
      localStorage.setItem('token', accessToken);
      setToken(accessToken);

      const profile = await fetchUserProfile(accessToken);
      populateUser(profile);

      if (!profile.is_active) {
        setShowVerifyPopup(true);
      } else {
        navigateToDashboard(accessToken);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  function notAvailable() {
    setMessage('This feature is not available yet.');
    setShowPopup(true);
  }

  return (
    <div className="app login-page">
      {showPopup && <CustomPopup message={message} onClose={handleClose} />}
      {loading && <LoadingPopup message="" />}
      {showVerifyPopup && token && <VerifyPopup token={token} />}

      <Header />

      <AuthLayout
        className="login-page"
        illustration={<img className="auth-illustration" src={logo2} alt="BeatNow illustration" />}
      >
        <div className="auth-content">
          <div>
            <h2 className="auth-title">Welcome back!</h2>
            <p className="auth-subtitle">Please sign into your account</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              className="auth-input"
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleFieldChange}
              placeholder="Username"
              autoComplete="username"
            />
            <input
              className="auth-input"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleFieldChange}
              placeholder="Password"
              autoComplete="current-password"
            />
            <div className="login-actions">
              <Link className="forgot-link" to="/forgotPwd">
                Forgot password?
              </Link>
            </div>
            <button className="btn btn-primary" type="submit">
              Sign in
            </button>
          </form>

          <div className="auth-separator">
            <span>or continue with</span>
          </div>

          <div className="auth-social">
            <button
              className="social-button social-button--google"
              onClick={signInOrRegisterWithGoogle}
              type="button"
            >
              <img
                src="https://img.icons8.com/color/48/000000/google-logo.png"
                alt="Google"
              />
            </button>
            <button className="social-button social-button--x" onClick={notAvailable} type="button">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png"
                alt="X"
              />
            </button>
          </div>

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

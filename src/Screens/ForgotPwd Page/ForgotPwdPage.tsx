import React, { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import './ForgotPwdPage.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo2 from '../../assets/Frame 2.png';
import CustomPopup from '../../components/Popup/CustomPopup';
import Header from '../../Layout/Header/Header';
import { confirmPasswordReset, requestPasswordReset } from '../../Model/api/auth';

const passwordRequirements = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,20}$/;

function ForgotPwdPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const resetToken = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);
  const hasResetToken = Boolean(resetToken);

  const handleClose = () => {
    setShowPopup(false);
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleConfirmPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (hasResetToken) {
        if (!passwordRequirements.test(password)) {
          throw new Error('Password must be 8-20 characters and include uppercase, lowercase, number, and special character.');
        }
        if (confirmPassword !== password) {
          throw new Error('Passwords do not match.');
        }

        await confirmPasswordReset(resetToken, password);
        setMessage('Password changed successfully. You can now sign in.');
        setShowPopup(true);
        setTimeout(() => navigate('/login'), 1200);
      } else {
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
          throw new Error('Please enter a valid email address.');
        }

        await requestPasswordReset(email);
        setMessage('If the email exists, we sent you instructions to reset your password.');
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Password reset flow failed:', error);
      setMessage(error instanceof Error ? error.message : 'The operation could not be completed.');
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {showPopup && <CustomPopup message={message} onClose={handleClose} />}
      <Header />
      <div className="centerDiv2">
        <main>
          <section className="forgotPwdContent">
            <h2>{hasResetToken ? 'Set your new password' : 'Reset your password'}</h2>
            <form className="forgot-form" onSubmit={handleSubmit}>
              {hasResetToken ? (
                <div className="passwordInputs-Forgot">
                  <input
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="New password"
                    maxLength={20}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Confirm new password"
                    maxLength={20}
                  />
                </div>
              ) : (
                <div className="passwordInputs-Forgot">
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Your account email"
                    maxLength={80}
                  />
                </div>
              )}

              <button className="submitButton2" type="submit" disabled={loading}>
                {loading ? 'Please wait...' : hasResetToken ? 'Change Password' : 'Send reset email'}
              </button>

              <div className="signUpText">
                <h6>
                  Or go back to{' '}
                  <Link className="signIn" to="/login">
                    sign in
                  </Link>
                </h6>
              </div>
            </form>
          </section>

          <div className="dividerVert2"></div>
          <section className="logoSect2">
            <img className="logoPngCenter2" src={logo2} alt="Logo" />
          </section>
        </main>
      </div>
    </div>
  );
}

export default ForgotPwdPage;

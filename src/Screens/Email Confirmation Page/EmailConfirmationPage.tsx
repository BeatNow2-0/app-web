import React, { FormEvent, useEffect, useState } from 'react';
import './EmailConfirmationPage.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MailCheck, RefreshCw } from 'lucide-react';
import logo2 from '../../assets/Frame 2.png';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import CustomPopup from '../../components/Popup/CustomPopup';
import LoadingPopup from '../../components/Loading/Loading';
import {
  AccountNotVerifiedError,
  ConfirmationRateLimitError,
  clearStoredSession,
  confirmEmailCode,
  forgetVerificationToken,
  getVerificationTokenFromMemory,
  sendConfirmationEmail,
} from '../../Model/api/auth';

type ConfirmationState = {
  email?: string;
};

function EmailConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: ConfirmationState };
  const routeState = location.state;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const verificationToken = getVerificationTokenFromMemory();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const interval = window.setInterval(() => {
      setCooldown((value) => Math.max(value - 1, 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [cooldown]);

  const signInAfterConfirmation = async () => {
    forgetVerificationToken();
    navigate('/login', { replace: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const trimmedCode = code.trim();

    if (!verificationToken) {
      setMessage('Start by signing in again so BeatNow can issue a fresh verification token.');
      setShowPopup(true);
      return;
    }

    if (!/^\d{6}$/.test(trimmedCode)) {
      setMessage('Enter the confirmation code from your email.');
      setShowPopup(true);
      return;
    }

    setLoading(true);
    try {
      await confirmEmailCode(verificationToken, trimmedCode);
      await signInAfterConfirmation();
    } catch (error) {
      clearStoredSession();
      if (error instanceof AccountNotVerifiedError) {
        setMessage('The account still needs verification. Check the code and try again.');
      } else {
        setMessage(error instanceof Error ? error.message : 'Unable to confirm this email.');
      }
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading || cooldown > 0) return;

    if (!verificationToken) {
      setMessage('Start by signing in again so BeatNow can issue a fresh verification token.');
      setShowPopup(true);
      return;
    }

    setLoading(true);
    try {
      const response = await sendConfirmationEmail(verificationToken);
      if (response.retryAfter) setCooldown(response.retryAfter);
      setMessage('We sent a new confirmation code.');
      setShowPopup(true);
    } catch (error) {
      if (error instanceof ConfirmationRateLimitError) {
        setCooldown(error.retryAfter);
      }
      setMessage(error instanceof Error ? error.message : 'Unable to send a new confirmation code.');
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app email-confirmation-page">
      {showPopup && <CustomPopup message={message} onClose={() => setShowPopup(false)} />}
      {loading && <LoadingPopup message="" />}
      <AuthLayout
        className="email-confirmation-page"
        illustration={<img className="auth-illustration" src={logo2} alt="BeatNow illustration" />}
      >
        <div className="auth-content">
          <div>
            <p className="page-eyebrow">Email verification</p>
            <h1 className="auth-title">Enter your code.</h1>
            <p className="auth-subtitle">
              {routeState?.email ? `We sent a confirmation code to ${routeState.email}.` : 'Use the confirmation code from your email.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field"><span>Confirmation code</span><input
              className="auth-input verification-code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
            /></label>

            <div className="confirmation-actions">
              <button className="button" type="submit" disabled={loading}>
                <MailCheck size={18} />
                {loading ? 'Confirming...' : 'Confirm email'}
              </button>
              <button
                className="button button--secondary resend-button"
                type="button"
                onClick={handleResend}
                disabled={loading || cooldown > 0}
              >
                <RefreshCw size={18} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>

          <p className="confirmation-hint">
            Already confirmed? <Link to="/login">Back to sign in</Link>
          </p>
        </div>
      </AuthLayout>
    </div>
  );
}

export default EmailConfirmationPage;

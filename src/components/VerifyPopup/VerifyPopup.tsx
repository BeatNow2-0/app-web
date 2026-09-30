import React, { useEffect, useState } from 'react';
import VerificationInput from 'react-verification-input';
import './VerifyPopup.css';
import { useNavigate } from 'react-router-dom';
import { confirmEmailCode, sendConfirmationEmail } from '../../Model/api/auth';

interface VerifyPopupProps {
  token: string;
}

const VerifyPopup: React.FC<VerifyPopupProps> = ({ token }) => {
  const navigate = useNavigate();
  const [validToken, setValidToken] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (token) {
      setValidToken(token);
    }
  }, [token]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || verificationCode.length !== 6) {
      setFeedback('Enter the complete six-digit code.');
      return;
    }

    const currentToken = validToken || localStorage.getItem('token');
    if (!currentToken) {
      console.error('No token found');
      return;
    }

    try {
      setSubmitting(true);
      setFeedback('');
      await confirmEmailCode(currentToken, verificationCode);
      handleClose();
      navigate('/Dashboard', { state: { token: currentToken } });
    } catch (error) {
      console.error('Error verifying code:', error);
      setFeedback('The code is invalid or expired. Check it and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resendCode = async () => {
    if (submitting) return;
    const currentToken = validToken || localStorage.getItem('token');
    if (!currentToken) {
      console.error('No token found');
      return;
    }

    try {
      setSubmitting(true);
      await sendConfirmationEmail(currentToken);
      setFeedback('A new code has been sent.');
    } catch (error) {
      console.error('Error resending code:', error);
      setFeedback('We could not resend the code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`verify-popup ${isVisible ? 'visible' : ''}`}>
      <div className="verify-popup-content">
        <form className="verification-form" onSubmit={handleSubmit}>
          <div className="verification-texts">
            <h3>A verification code has been sent</h3>
            <br />
            <h5>Please check your email and input your code to complete registration: </h5>
          </div>
          <div className="verification-inputs">
            <VerificationInput
              length={6}
              placeholder=""
              autoFocus
              validChars="0-9"
              onChange={setVerificationCode}
              value={verificationCode}
            />
          </div>
          {feedback && <p role="status">{feedback}</p>}
          <button className="resend-button" type="button" onClick={resendCode} disabled={submitting}>
            Resend code
          </button>
          <button className="submit-verify" type="submit" disabled={submitting || verificationCode.length !== 6}>
            {submitting ? 'Checking...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyPopup;

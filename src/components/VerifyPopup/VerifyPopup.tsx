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

    const currentToken = validToken || localStorage.getItem('token');
    if (!currentToken) {
      console.error('No token found');
      return;
    }

    try {
      await confirmEmailCode(currentToken, verificationCode);
      handleClose();
      navigate('/Dashboard', { state: { token: currentToken } });
    } catch (error) {
      console.error('Error verifying code:', error);
    }
  };

  const resendCode = async () => {
    const currentToken = validToken || localStorage.getItem('token');
    if (!currentToken) {
      console.error('No token found');
      return;
    }

    try {
      await sendConfirmationEmail(currentToken);
    } catch (error) {
      console.error('Error resending code:', error);
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
          <button className="resend-button" type="button" onClick={resendCode}>
            Resend code
          </button>
          <button className="submit-verify" type="submit">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyPopup;

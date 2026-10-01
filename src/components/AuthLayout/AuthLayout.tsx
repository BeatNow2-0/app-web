import React, { ReactNode } from 'react';
import './AuthLayout.css';
import { Link } from 'react-router-dom';
import logo from '../../assets/Logo.png';

interface AuthLayoutProps {
  illustration: ReactNode;
  children: ReactNode;
  reverse?: boolean;
  className?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ illustration, children, reverse = false, className }) => {
  return (
    <div className={`auth-page ${className ?? ''}`.trim()}>
      <header className="auth-topbar"><Link to="/login"><img src={logo} alt="" /><strong>BeatNow</strong></Link><span>Made for producers.</span></header>
      <main className={`auth-card ${reverse ? 'auth-card--reverse' : ''}`.trim()}>
        <section className="auth-side auth-side--illustration">
          {illustration}
        </section>
        <div className="auth-divider" aria-hidden="true" />
        <section className="auth-side auth-side--form">
          {children}
        </section>
      </main>
      <footer className="auth-footer"><span>© 2026 BeatNow</span><div><Link to="/legal/privacy">Privacy</Link><Link to="/legal/terms">Terms</Link><Link to="/legal/copyright">Copyright</Link></div></footer>
    </div>
  );
};

export default AuthLayout;

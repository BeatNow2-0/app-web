import React, { ReactNode } from 'react';
import './AuthLayout.css';

interface AuthLayoutProps {
  illustration: ReactNode;
  children: ReactNode;
  reverse?: boolean;
  className?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ illustration, children, reverse = false, className }) => {
  return (
    <div className={`auth-page ${className ?? ''}`.trim()}>
      <main className={`auth-card ${reverse ? 'auth-card--reverse' : ''}`.trim()}>
        <section className="auth-side auth-side--illustration">
          {illustration}
        </section>
        <div className="auth-divider" aria-hidden="true" />
        <section className="auth-side auth-side--form">
          {children}
        </section>
      </main>
    </div>
  );
};

export default AuthLayout;

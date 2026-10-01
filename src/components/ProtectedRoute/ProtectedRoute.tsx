import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import UserSingleton from '../../Model/UserSingleton';
import { clearStoredSession, fetchUserProfile } from '../../Model/api/auth';
import Loading from '../Loading/Loading';

type SessionState = 'checking' | 'authenticated' | 'anonymous' | 'unavailable';

export default function ProtectedRoute() {
  const location = useLocation();
  const [sessionState, setSessionState] = useState<SessionState>('checking');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const token = localStorage.getItem('token');

    if (!token) {
      setSessionState('anonymous');
      return () => {
        active = false;
      };
    }

    fetchUserProfile(token, controller.signal)
      .then((profile) => {
        if (!active) return;
        const user = UserSingleton.getInstance();
        user.setFullName(profile.full_name);
        user.setUsername(profile.username);
        user.setEmail(profile.email);
        user.setId(profile.id);
        user.setIsActive(profile.is_active);
        if (profile.profile_image_url) user.setPhotoProfile(profile.profile_image_url);
        setSessionState('authenticated');
      })
      .catch((error: Error & { status?: number }) => {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          clearStoredSession();
          UserSingleton.getInstance().clear();
          setSessionState('anonymous');
        } else {
          setSessionState('unavailable');
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const expire = () => setSessionState('anonymous');
    window.addEventListener('beatnow:session-expired', expire);
    return () => window.removeEventListener('beatnow:session-expired', expire);
  }, []);

  if (sessionState === 'checking') {
    return <Loading message="Restoring your session..." />;
  }

  if (sessionState === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (sessionState === 'unavailable') {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#090909', color: '#fff' }}>
        <section style={{ maxWidth: 520, textAlign: 'center' }}>
          <h1>We could not connect to BeatNow</h1>
          <p>Your session is still stored. Check your connection and try again.</p>
          <button type="button" onClick={() => window.location.reload()}>Try again</button>
        </section>
      </main>
    );
  }

  return <Outlet />;
}

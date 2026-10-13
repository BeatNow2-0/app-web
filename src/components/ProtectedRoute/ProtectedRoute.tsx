import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { fetchUserProfile } from '../../Model/api/auth';
import { getAccessToken, restoreSession, isUnauthorized, clearSessionTokens } from '../../Model/api/client';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../Loading/Loading';
export default function ProtectedRoute() {
  const location = useLocation(); const { user, setUser } = useAuth();
  const [state, setState] = useState<'checking' | 'authenticated' | 'anonymous' | 'unavailable'>(user ? 'authenticated' : 'checking');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState('checking');
    (async () => {
      if (!getAccessToken()) await restoreSession();
      return fetchUserProfile();
    })().then(profile => { if (active) { setUser(profile); setState('authenticated'); } }).catch(error => {
      if (!active) return;
      if (isUnauthorized(error) || [401, 403].includes(error.status)) { clearSessionTokens(); setState('anonymous'); }
      else setState('unavailable');
    });
    return () => { active = false; };
  }, [attempt]);
  useEffect(() => { const expire = () => setState('anonymous'); window.addEventListener('beatnow:session-expired', expire); return () => window.removeEventListener('beatnow:session-expired', expire); }, []);
  if (state === 'checking') return <Loading message="Restoring your session…" />;
  if (state === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (state === 'unavailable') return <main className="page"><h1>We could not connect to BeatNow</h1><p role="alert">Check your connection and try again.</p><button className="button" onClick={() => setAttempt(n => n + 1)}>Try again</button></main>;
  return <Outlet />;
}
export function ProducerRoute() {
  const { user } = useAuth();
  return user?.role === 'producer' ? <Outlet /> : <main className="page"><h1>Producer access required</h1><p>Publishing is available to approved producers. Ask your BeatNow administrator to enable your producer account.</p></main>;
}

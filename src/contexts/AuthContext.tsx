import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserData } from '../Model/api/auth';
const AuthContext = createContext<{ user: UserData | null; setUser: (user: UserData | null) => void } | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  useEffect(() => { const clear = () => setUser(null); window.addEventListener('beatnow:session-expired', clear); return () => window.removeEventListener('beatnow:session-expired', clear); }, []);
  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider is required'); return value; }

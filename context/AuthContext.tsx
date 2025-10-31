import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StaffRole } from '../types';

type AuthUser = {
  id?: string;
  email: string;
  role: StaffRole;
  name?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('auth:user');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  const login = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem('auth:user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth:user');
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const RequireRole: React.FC<React.PropsWithChildren<{ role: StaffRole }>> = ({ role, children }) => {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'superadmin') return <>{children}</>; // superadmin bypass
  if (user.role !== role) return null;
  return <>{children}</>;
};

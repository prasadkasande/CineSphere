import { createContext, useContext, useMemo, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

function loadStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);

  function persist(auth) {
    const nextUser = {
      userId: auth.userId,
      name: auth.name,
      email: auth.email,
      role: auth.role,
    };
    localStorage.setItem('token', auth.token);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  }

  async function login(email, password) {
    const auth = await authApi.login(email, password);
    persist(auth);
    return auth;
  }

  async function register(details) {
    const auth = await authApi.register(details);
    persist(auth);
    return auth;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  const value = useMemo(() => ({ user, login, register, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

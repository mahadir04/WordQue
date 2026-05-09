import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProfile, loginUser, registerUser, googleLogin } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('wordque_token');
    if (token) {
      getProfile()
        .then((profile) => setUser(profile))
        .catch(() => {
          localStorage.removeItem('wordque_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await loginUser(email, password);
    localStorage.setItem('wordque_token', result.token);
    setUser(result.user);
    return result;
  }, []);

  const loginWithGoogle = useCallback(async (idToken) => {
    const result = await googleLogin(idToken);
    localStorage.setItem('wordque_token', result.token);
    setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const result = await registerUser(email, password, name);
    localStorage.setItem('wordque_token', result.token);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('wordque_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

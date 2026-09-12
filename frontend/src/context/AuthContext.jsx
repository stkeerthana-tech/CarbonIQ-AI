import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('carboniq_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('carboniq_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync / verify user session with backend
  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.auth.me();
        if (response.success && response.data) {
          setUser(response.data);
          localStorage.setItem('carboniq_user', JSON.stringify(response.data));
        } else {
          logout();
        }
      } catch (err) {
        // If 401 or token invalid, clear session
        if (err.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    }

    verifySession();

    // Listen for 401 event dispatched by api.js
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('carboniq-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('carboniq-auth-expired', handleAuthExpired);
  }, [token]);

  const login = async (email, password) => {
    const response = await api.auth.login({ email, password });
    if (response.success && response.data) {
      const { access_token, user: userData } = response.data;
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('carboniq_token', access_token);
      localStorage.setItem('carboniq_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: response.error || 'Authentication failed' };
  };

  const register = async (name, email, password, role) => {
    const response = await api.auth.register({ name, email, password, role });
    if (response.success && response.data) {
      // Automatically log in after registration
      return login(email, password);
    }
    return { success: false, error: response.error || 'Registration failed' };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('carboniq_token');
    localStorage.removeItem('carboniq_user');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

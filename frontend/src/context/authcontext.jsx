/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logoutSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const loginSession = (userData, userToken) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
  };

  const verifySession = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await API.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.warn('Session verification failed, logging out:', err.response?.data?.message || err.message);
      logoutSession();
    } finally {
      setLoading(false);
    }
  }, [token, logoutSession]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logoutSession();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logoutSession]);

  return (
    <AuthContext.Provider value={{ user, token, loading, loginSession, logoutSession, verifySession }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

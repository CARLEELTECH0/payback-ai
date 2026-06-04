'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const data = await api.getBalance();
      if (data.success) {
        setUser({ wallet: data.data });
      }
    } catch {
      api.clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    if (data.success) {
      api.setToken(data.data.accessToken);
      api.setRefreshToken(data.data.refreshToken);
      setUser(data.data.user);
      return data;
    }
    throw data;
  };

  const signup = async (body) => {
    const data = await api.signup(body);
    if (data.success) {
      api.setToken(data.data.accessToken);
      api.setRefreshToken(data.data.refreshToken);
      setUser(data.data.user);
      return data;
    }
    throw data;
  };

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {}
    api.clearTokens();
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshWallet = async () => {
    try {
      const data = await api.getBalance();
      if (data.success) {
        setUser(prev => ({ ...prev, wallet: data.data }));
      }
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshWallet, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.refresh();
        // Fix: API returns { user: {...} } directly, not nested under data
        if (res.user) {
          console.log('Refresh successful, user:', res.user);
          setUser(res.user);
        } else {
          console.log('No user found on refresh');
          setUser(null);
        }
      } catch (err) {
        console.error('Refresh error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await api.login({ identifier, password });
      // Fix: API returns { user: {...} } directly, not nested under data
      if (res.user) {
        console.log('Login successful, user:', res.user);
        setUser(res.user);
        router.push('/');
      } else {
        throw new Error('No user data received');
      }
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      if (err instanceof Error) {
        console.error('Login error:', err);
        throw new Error(err.message || 'Login failed');
      } else {
        // Handle cases where err is not an Error object (e.g., a string or something else)
        console.error('An unknown error occurred:', err);
        throw new Error('An unexpected error occurred during login');
      }
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear user state even if logout request fails
      setUser(null);
      router.push('/login');
    }
  };

  const refresh = async () => {
    try {
      const res = await api.refresh();
      if (res.user) {
        setUser(res.user);
      } else {
        setUser(null);
        throw new Error('Refresh failed - no user data');
      }
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
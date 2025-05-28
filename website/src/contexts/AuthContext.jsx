import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { login as apiLogin, signup as apiSignup, refresh as apiRefresh } from '../services/authService';

const AuthContext = createContext();

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

function getStoredAuth() {
  const access = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  return { access, refresh, user: user ? JSON.parse(user) : null };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredAuth().user);
  const [accessToken, setAccessToken] = useState(() => getStoredAuth().access);
  const [refreshToken, setRefreshToken] = useState(() => getStoredAuth().refresh);
  const [loading, setLoading] = useState(false);

  // Store tokens and user in localStorage
  const setAuth = useCallback((access, refresh, user) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    setUser(user);
    if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, []);

  // Login
  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const data = await apiLogin(identifier, password);
      setAuth(data.access_token, data.refresh_token, data.user);
      return { success: true, message: data.message };
    } catch (err) {
      setAuth(null, null, null);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Signup (returns only message, you can auto-login if you want)
  const signup = async (form) => {
    setLoading(true);
    try {
      const data = await apiSignup(form);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = useCallback(() => {
    setAuth(null, null, null);
  }, [setAuth]);

  // Token refresh automation
  const refresh = useCallback(async () => {
    if (!refreshToken) {
      logout();
      return false;
    }
    try {
      const data = await apiRefresh(refreshToken);
      setAccessToken(data.access_token);
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
      return true;
    } catch {
      logout();
      return false;
    }
  }, [refreshToken, logout]);

  // Optionally: auto-refresh access token on mount if refresh token exists
  useEffect(() => {
    if (!accessToken && refreshToken) refresh();
    // eslint-disable-next-line
  }, []);

  // Interceptor for authenticated requests
  const authFetch = useCallback(
    async (url, options = {}) => {
      let token = accessToken;
      // Optionally: check token expiry and refresh here
      // For demo, always use current. For production, decode and check expiry!
      const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401 && refreshToken) {
        // Try refresh once
        const ok = await refresh();
        if (ok) {
          token = localStorage.getItem(ACCESS_TOKEN_KEY);
          headers.Authorization = `Bearer ${token}`;
          return fetch(url, { ...options, headers });
        } else {
          logout();
        }
      }
      return res;
    },
    [accessToken, refreshToken, refresh, logout]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        loading,
        login,
        signup,
        logout,
        authFetch,
        isAuthenticated: !!accessToken && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
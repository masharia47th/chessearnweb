import Cookies from 'js-cookie';

const API_URL = 'https://v2.chessearn.com';

interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  phone_number: string;
  password: string;
}

interface LoginData {
  identifier: string;
  password: string;
}

interface User {
  id: string;
  role: string;
  username: string;
}

// Updated to match actual API response structure
interface LoginResponse {
  user: User;
}

interface RefreshResponse {
  user: User;
}

interface LogoutResponse {
  message: string;
}

// interface ErrorResponse {
//   error: string;
// }

const api = {
  async register(data: RegisterData): Promise<User> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await response.json();
    
    if (!response.ok) {
      throw new Error(json.error || 'Registration failed');
    }
    
    return json;
  },

  async login(data: LoginData): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    const json = await response.json();
    
    if (!response.ok) {
      throw new Error(json.error || 'Login failed');
    }
    
    return json; // Returns { user: {...} }
  },

  async refresh(): Promise<RefreshResponse> {
    const csrfToken = Cookies.get('csrf_refresh_token');
    
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': csrfToken || '',
      },
      credentials: 'include',
    });

    const json = await response.json();
    
    if (!response.ok) {
      throw new Error(json.error || 'Refresh failed');
    }
    
    return json; // Returns { user: {...} }
  },

  async logout(): Promise<LogoutResponse> {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    const json = await response.json();
    
    if (response.ok) {
      // Clean up cookies on successful logout
      Cookies.remove('csrf_access_token');
      Cookies.remove('access_token_cookie');
      Cookies.remove('csrf_refresh_token');
      Cookies.remove('refresh_token_cookie');
    }
    
    return json;
  },
};

export default api;
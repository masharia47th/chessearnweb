const BASE_URL = 'https://api.chessearn.com';

// ==== AUTH ====

export async function signup(userData) {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Signup failed');
  }
  return response.json();
}

export async function login(identifier, password) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
}

export async function refresh(refreshToken) {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${refreshToken}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Token refresh failed');
  }
  return data;
}

// ==== PROFILE ====

export async function getProfile(accessToken) {
  const response = await fetch(`${BASE_URL.replace('/auth', '')}/profile/`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  return response.json();
}

export async function uploadProfilePhoto(accessToken, file) {
  const formData = new FormData();
  formData.append('photo', file);

  const response = await fetch(`${BASE_URL.replace('/auth', '')}/profile/photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // No Content-Type here, browser sets it with multipart
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload photo');
  }
  return response.json();
}

export function getProfilePhotoUrl(photo_filename) {
  const filename = photo_filename || 'default.jpg';
  return `${BASE_URL.replace('/auth', '')}/profile/photo/${filename}`;
}
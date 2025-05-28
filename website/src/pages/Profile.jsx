import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getProfile,
  uploadProfilePhoto,
  getProfilePhotoUrl,
} from '../services/authService';

function Profile() {
  const { accessToken, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getProfile(accessToken);
        setProfile(res.user);
      } catch (err) {
        setMessage('Failed to load profile');
      }
    }
    fetchProfile();
  }, [accessToken]);

  const handlePhotoChange = async (e) => {
    if (!e.target.files[0]) return;
    setUploading(true);
    setMessage('');
    try {
      const res = await uploadProfilePhoto(accessToken, e.target.files[0]);
      setProfile((prev) => ({ ...prev, photo_filename: res.photo_filename }));
      setMessage(res.message || 'Photo updated!');
    } catch (err) {
      setMessage('Photo upload failed');
    } finally {
      setUploading(false);
      fileInputRef.current.value = '';
    }
  };

  if (!profile) return <div style={{ textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="profile-page" style={{ maxWidth: 420, margin: '2rem auto', background: '#232b36', borderRadius: 20, padding: 32, color: '#ffd700', boxShadow: '0 2px 20px #2228' }}>
      <h2 style={{ textAlign: 'center' }}>Profile</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <img
          src={getProfilePhotoUrl(profile.photo_filename)}
          alt="Profile"
          style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #ffd700', marginBottom: 18 }}
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
          disabled={uploading}
        />
        <button
          style={{
            background: 'linear-gradient(90deg, #ffd700 0%, #f7971e 100%)',
            color: '#232b36',
            border: 0,
            borderRadius: 12,
            fontWeight: 'bold',
            padding: '0.5rem 1.2rem',
            cursor: 'pointer',
            marginBottom: 10,
          }}
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Change Photo'}
        </button>
        <div style={{ width: '100%', margin: '0.7rem 0', background: '#1e2330', padding: 18, borderRadius: 10 }}>
          <div><b>Name:</b> {profile.first_name} {profile.last_name}</div>
          <div><b>Email:</b> {profile.email}</div>
          <div><b>Username:</b> {profile.username}</div>
          <div><b>Phone:</b> {profile.phone_number}</div>
          <div><b>Role:</b> {profile.role}</div>
          <div><b>Ranking:</b> {profile.ranking}</div>
          <div><b>Wallet:</b> ${profile.wallet_balance.toFixed(2)}</div>
          <div><b>Status:</b> {profile.is_active ? 'Active' : 'Disabled'}</div>
          <div><b>Verified:</b> {profile.is_verified ? 'Yes' : 'No'}</div>
        </div>
        {message && <div style={{ color: '#ffd700', marginTop: 4 }}>{message}</div>}
      </div>
    </div>
  );
}

export default Profile;
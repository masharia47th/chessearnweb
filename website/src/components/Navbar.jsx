import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProfilePhotoUrl } from '../services/authService';
import './Navbar.css';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const handleMenuToggle = () => setMenuOpen((open) => !open);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" onClick={closeMenu}>
          ChessEarn
        </Link>
      </div>
      <button
        className={`navbar-hamburger${menuOpen ? ' open' : ''}`}
        onClick={handleMenuToggle}
        aria-label="Toggle navigation"
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
        <Link to="/" onClick={closeMenu}>
          Home
        </Link>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" onClick={closeMenu}>
              Dashboard
            </Link>
            <Link to="/create-game" onClick={closeMenu}>
              New Game
            </Link>
            <Link to="/game-list" onClick={closeMenu}>
              Join Games
            </Link>
            {/* <Link to="/history" onClick={closeMenu}>
              Game History
            </Link> */}
            <Link to="/profile" onClick={closeMenu} className="navbar-profile-link">
              <img
                src={getProfilePhotoUrl(user?.photo_filename)}
                alt="Profile"
                className="navbar-profile-avatar"
              />
              <span>Profile</span>
            </Link>
            <span className="navbar-username">{user?.first_name || user?.username}</span>
            <button className="navbar-logout navbar-action" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-action" onClick={closeMenu}>
              Login
            </Link>
            <Link to="/signup" className="navbar-action navbar-signup" onClick={closeMenu}>
              Sign Up
            </Link>
          </>
        )}
      </div>
      {menuOpen && <div className="navbar-overlay" onClick={closeMenu}></div>}
    </nav>
  );
}

export default Navbar;
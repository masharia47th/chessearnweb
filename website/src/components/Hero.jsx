import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Hero.css';
import chessMoney from '../assets/chessmoney.jpeg';

function Hero() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Play Chess, Earn Rewards</h1>
        <p>Join ChessEarn to compete, win, and become a chess legend.</p>
        <Link
          to={isAuthenticated ? '/game-list' : '/signup'}
          className="cta-button"
        >
          {isAuthenticated ? 'Join a Game' : 'Get Started'}
        </Link>
      </div>
      <div className="hero-image">
        <img src={chessMoney} alt="Chess Board with Rewards" />
      </div>
    </section>
  );
}

export default Hero;
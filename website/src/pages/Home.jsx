import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <Hero />
      <section className="features-section">
        <h2>Why ChessEarn?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Create Games</h3>
            <p>Set up custom chess matches with your preferred time controls and stakes.</p>
            <Link to="/create-game" className="feature-cta">Start a Game</Link>
          </div>
          <div className="feature-card">
            <h3>Join Matches</h3>
            <p>Jump into open games and challenge players from around the world.</p>
            <Link to="/game-list" className="feature-cta">Find a Game</Link>
          </div>
          <div className="feature-card">
            <h3>Play & Earn</h3>
            <p>Compete in real-time chess and earn rewards for your victories.</p>
            <Link to="/signup" className="feature-cta">Play Now</Link>
          </div>
          <div className="feature-card">
            <h3>Track History</h3>
            <p>Review past games to improve your skills and relive epic battles.</p>
            <Link to="/history" className="feature-cta">View History</Link>
          </div>
        </div>
      </section>
      <section className="how-it-works-section">
        <h2>How It Works</h2>
        <div className="steps-grid">
          <div className="step">
            <span className="step-number">1</span>
            <h3>Sign Up</h3>
            <p>Create a free account to start your chess journey.</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h3>Create or Join</h3>
            <p>Start a new game or join an open match.</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h3>Play & Win</h3>
            <p>Compete, earn rewards, and climb the leaderboard.</p>
          </div>
        </div>
      </section>
      <section className="cta-section">
        <h2>Ready to Checkmate?</h2>
        <p>Join ChessEarn today and start earning with every move!</p>
        <Link to="/signup" className="cta-button">Get Started</Link>
      </section>
    </div>
  );
}

export default Home;
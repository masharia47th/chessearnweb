import './Hero.css';
import chessMoney from '../assets/chessmoney.jpeg';

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Earn by Playing Chess</h1>
        <p>Play chess, earn rewards, and become a grandmaster.</p>
        <a href="#get-started" className="cta-button">Get Started</a>
      </div>
      <div className="hero-image">
        <img src={chessMoney} alt="Chess Board" />
      </div>
    </section>
  );
}

export default Hero;
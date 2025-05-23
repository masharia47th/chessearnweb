'use client';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats] = useState({
    players: 12847,
    tournaments: 234,
    prizeMoney: 487350
  });

  const [floatingPieces, setFloatingPieces] = useState<Array<{id: number, piece: string, x: number, y: number, delay: number}>>([]);

  useEffect(() => {
    // FIX: Moved chessPieces definition INSIDE the useEffect
    const chessPieces = ['♔', '♕', '♖', '♗', '♘', '♙']; // <--- MOVED HERE

    const pieces = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      piece: chessPieces[Math.floor(Math.random() * chessPieces.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 10
    }));
    setFloatingPieces(pieces);
  }, []); // <--- Dependency array is now empty, as it should be for a run-once effect
          // because all its dependencies are now internal or stable.

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading ChessEarn...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Chess Pieces Background */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute text-slate-800/10 text-6xl animate-bounce"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: '6s'
            }}
          >
            {piece.piece}
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main Hero Content */}
          <div className="mb-12">
            {/* Logo Animation */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-3xl flex items-center justify-center text-slate-900 text-6xl font-black shadow-2xl shadow-amber-900/50 animate-pulse">
                  ♔
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/20 to-amber-600/20 rounded-full blur-xl animate-ping"></div>
              </div>
            </div>

            {/* Hero Text */}
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 mb-6 tracking-tight">
              ChessEarn
            </h1>
            <p className="text-2xl md:text-3xl text-slate-300 mb-4 font-light">
              Master the Game, <span className="text-amber-400 font-semibold">Earn Rewards</span>
            </p>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Join the ultimate competitive chess platform where strategy meets opportunity. 
              Play against skilled opponents, participate in tournaments, and earn real rewards.
            </p>

            {/* CTA Buttons */}
            {user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => router.push('/play')}
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-slate-900 font-bold px-8 py-4 rounded-2xl text-xl shadow-2xl shadow-amber-900/50 hover:shadow-amber-900/75 transition-all duration-300 transform hover:scale-105"
                >
                  🎮 Start Playing
                </button>
                <button
                  onClick={() => router.push('/tournaments')}
                  className="bg-slate-800/50 hover:bg-slate-700/50 border-2 border-slate-600 hover:border-amber-500 text-slate-100 font-bold px-8 py-4 rounded-2xl text-xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                >
                  🏆 View Tournaments
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-slate-900 font-bold px-10 py-5 rounded-2xl text-xl shadow-2xl shadow-amber-900/50 hover:shadow-amber-900/75 transition-all duration-300 transform hover:scale-105 inline-block"
                >
                  🚀 Get Started Free
                </Link>
                <Link
                  href="/login"
                  className="bg-slate-800/50 hover:bg-slate-700/50 border-2 border-slate-600 hover:border-amber-500 text-slate-100 font-bold px-10 py-5 rounded-2xl text-xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105 inline-block"
                >
                  👑 Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-black text-amber-400 mb-2">
                {stats.players.toLocaleString()}+
              </div>
              <div className="text-slate-300 font-medium">Active Players</div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-black text-amber-400 mb-2">
                {stats.tournaments}+
              </div>
              <div className="text-slate-300 font-medium">Tournaments</div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-black text-amber-400 mb-2">
                ${stats.prizeMoney.toLocaleString()}
              </div>
              <div className="text-slate-300 font-medium">Total Prizes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-center text-slate-100 mb-16">
            Why Choose <span className="text-amber-400">ChessEarn</span>?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl mb-6">🎯</div>
              <h3 className="text-2xl font-bold text-slate-100 mb-4">Skill-Based Matching</h3>
              <p className="text-slate-400 leading-relaxed">
                Our advanced ELO system ensures you&#39;re matched with players of similar skill levels for fair and competitive games.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl mb-6">💰</div>
              <h3 className="text-2xl font-bold text-slate-100 mb-4">Real Rewards</h3>
              <p className="text-slate-400 leading-relaxed">
                Win tournaments and climb rankings to earn real cash prizes and exclusive rewards.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl mb-6">⚡</div>
              <h3 className="text-2xl font-bold text-slate-100 mb-4">Lightning Fast</h3>
              <p className="text-slate-400 leading-relaxed">
                Experience seamless gameplay with our optimized platform built for speed and reliability.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl mb-6">📊</div>
              <h3 className="text-2xl font-bold text-slate-100 mb-4">Advanced Analytics</h3>
              <p className="text-slate-400 leading-relaxed">
                Track your progress with detailed statistics and game analysis to improve your chess skills.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl mb-6">🌍</div>
              <h3 className="text-2xl font-bold text-slate-100 mb-4">Global Community</h3>
              <p className="text-slate-400 leading-relaxed">
                Connect with chess enthusiasts from around the world in our vibrant gaming community.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl mb-6">🛡️</div>
              <h3 className="text-2xl font-bold text-slate-100 mb-4">Secure & Fair</h3>
              <p className="text-slate-400 leading-relaxed">
                Advanced anti-cheating systems and secure payment processing ensure a fair gaming environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-amber-600/10 to-amber-400/10 backdrop-blur-sm rounded-3xl p-12 border border-amber-500/20">
              <h2 className="text-4xl md:text-5xl font-black text-slate-100 mb-6">
                Ready to Start Your Chess Journey?
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Join thousands of players already earning rewards on ChessEarn. 
                Your next victory could be your most profitable one yet.
              </p>
              <Link
                href="/register"
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-slate-900 font-bold px-12 py-6 rounded-2xl text-xl shadow-2xl shadow-amber-900/50 hover:shadow-amber-900/75 transition-all duration-300 transform hover:scale-105 inline-block"
              >
                🎯 Join ChessEarn Now
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
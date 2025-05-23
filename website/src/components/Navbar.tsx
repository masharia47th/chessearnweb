'use client';
import { useAuth } from '../lib/AuthContext';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, router]);

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700 shadow-xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-xl font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center text-slate-900 font-black text-sm">
              ♔
            </div>
            <span>ChessEarn</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/play" 
              className="text-slate-300 hover:text-amber-400 transition-colors font-medium"
            >
              Play
            </Link>
            <Link 
              href="/tournaments" 
              className="text-slate-300 hover:text-amber-400 transition-colors font-medium"
            >
              Tournaments
            </Link>
            <Link 
              href="/leaderboard" 
              className="text-slate-300 hover:text-amber-400 transition-colors font-medium"
            >
              Leaderboard
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            ) : user ? (
              <>
                {/* User Welcome */}
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm">
                      <div className="text-slate-200 font-medium">{user.username}</div>
                      <div className="text-slate-400 text-xs capitalize">{user.role}</div>
                    </div>
                  </div>
                </div>

                {/* Mobile User Info */}
                <div className="sm:hidden flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 active:bg-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg hover:shadow-red-900/25"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Login/Register Buttons */}
                <Link
                  href={`/login?redirect=${encodeURIComponent(pathname)}`}
                  className="text-slate-300 hover:text-amber-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-slate-800/50"
                >
                  Login
                </Link>
                <Link
                  href={`/register?redirect=${encodeURIComponent(pathname)}`}
                  className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-slate-900 px-4 py-2 rounded-lg font-medium transition-colors shadow-lg hover:shadow-amber-900/25"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
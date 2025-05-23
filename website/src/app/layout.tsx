import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../lib/AuthContext';
import Navbar from '../components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ChessEarn - Master the Game, Earn Rewards',
  description: 'A competitive chess platform where strategy meets rewards. Play, learn, and earn in the ultimate chess experience.',
  keywords: 'chess, online chess, chess tournaments, earn money, chess platform',
  authors: [{ name: 'ChessEarn Team' }],
  // REMOVE viewport from here:
  // viewport: 'width=device-width, initial-scale=1',
};

// ADD the viewport export here:
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Good practice for consistent mobile behavior, prevents zooming
  userScalable: false, // Often desired for app-like experiences to prevent pinch-zoom
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}
          antialiased min-h-screen
          bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
          text-slate-100
        `}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-6">
              {children}
            </main>
            <footer className="border-t border-slate-700 bg-slate-900/50 backdrop-blur-sm">
              <div className="container mx-auto px-4 py-6 text-center text-slate-400">
                <p>&copy; 2025 ChessEarn. Master the Game, Earn Rewards.</p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
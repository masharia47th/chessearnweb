// src/app/login/page.tsx
import React, { Suspense } from 'react';
import LoginPageContent from './login-page-content';

export const metadata = {
  title: 'Login - ChessEarn',
  description: 'Sign in to your ChessEarn account',
};

// This is the correct way:
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};


export default function LoginPage() {
  return (
    // Wrap LoginPageContent in Suspense to handle useSearchParams on client-side
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading login page...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
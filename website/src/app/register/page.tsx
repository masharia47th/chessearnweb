// src/app/register/page.tsx
import React, { Suspense } from 'react';
import RegisterPageContent from './register-page-content';

export const metadata = {
  title: 'Register - ChessEarn',
  description: 'Create your ChessEarn account and start earning through chess',
};

// This is the correct way:
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};


export default function RegisterPage() {
  return (
    // Wrap RegisterPageContent in Suspense to handle useSearchParams on client-side
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading registration page...</p>
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
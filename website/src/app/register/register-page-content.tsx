// src/app/register/register-page-content.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import React from 'react';

export default function RegisterPageContent() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone_number: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect') || '/';

  useEffect(() => {
    // Redirect authenticated users
    if (user && !authLoading) {
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions

    setError(''); // Clear previous errors
    setIsLoading(true); // Show loading state

    try {
      await api.register(formData);
      setSuccess(true);

      // Redirect to login after 2 seconds with success message
      setTimeout(() => {
        router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}&registered=true`);
      }, 2000);
    } catch (err: unknown) { // Using 'unknown' for type-safe error handling
      console.error('Registration error:', err);

      // Safely narrow down error type to access its message
      if (err instanceof Error) {
        setError(err.message || 'Registration failed. Please try again.');
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        // Handle custom error objects that have a 'message' property
        setError((err as { message: string }).message || 'Registration failed. Please try again.');
      } else {
        // Fallback for any other unexpected error type
        setError('Registration failed. An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Show a full-screen loading spinner while checking authentication status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Success state UI
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-slate-800 rounded-2xl border border-slate-600 p-8 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Registration Successful!</h1>
            <p className="text-slate-300 mb-4">Your ChessEarn account has been created successfully.</p>
            <div className="flex items-center justify-center space-x-2 text-slate-200">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Redirecting to login...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-slate-900 text-3xl font-black">
              ♔
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Join ChessEarn</h1>
          <p className="text-slate-400">Create your account and start earning through chess</p>
        </div>

        {/* Registration Form Container */}
        <div className="bg-slate-800 rounded-2xl border border-slate-600 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-slate-200 mb-2">
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg text-slate-50 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="John"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-slate-200 mb-2">
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg text-slate-50 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Doe"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg text-slate-50 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="john@example.com"
                required
                disabled={isLoading}
              />
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-200 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg text-slate-50 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="chess_master"
                required
                disabled={isLoading}
              />
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-slate-200 mb-2">
                Phone Number
              </label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg text-slate-50 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="+1 (555) 123-4567"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg text-slate-50 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="Create a strong password"
                required
                disabled={isLoading}
              />
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                <p className="text-red-300 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-slate-600 disabled:to-slate-700 text-slate-900 font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-amber-900/25 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider and Login Link */}
          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">Already have an account?</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
              className="text-amber-400 hover:text-amber-300 font-medium" // Simplified className here
            >
              Sign in instead →
            </Link>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
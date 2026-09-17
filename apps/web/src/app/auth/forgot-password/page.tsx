'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { authApi } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
      
      // Redirect to reset password page after 2 seconds
      setTimeout(() => {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-[24px] font-bold text-neutral-900 mb-2">Check your email</h2>
          <p className="text-[14px] text-neutral-600 mb-4">
            If an account exists for <span className="font-semibold">{email}</span>, we've sent a password reset code.
          </p>
          <p className="text-[13px] text-neutral-500">
            Redirecting to reset page...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-[20px]">B</span>
            </div>
          </div>
          <h1 className="text-[28px] font-bold text-neutral-900 mb-2">Forgot password?</h1>
          <p className="text-[14px] text-neutral-600">
            No worries, we'll send you a reset code
          </p>
        </div>

        {/* Form */}
        <Card className="p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-[14px] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                placeholder="you@example.com"
                autoFocus
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={loading}
              className="mt-6"
            >
              {loading ? 'Sending code...' : 'Send Reset Code'}
            </Button>
          </form>
        </Card>

        {/* Back to Login */}
        <p className="text-center text-[14px] text-neutral-600 mt-6">
          <Link href="/auth/signin" className="text-primary-600 hover:text-primary-700 font-semibold">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

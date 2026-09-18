'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/auth';
import { Card } from '@/components/ui/Card';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = () => {
      try {
        // Parse tokens from URL fragment
        const hash = window.location.hash.substring(1); // Remove #
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const errorParam = params.get('error');

        if (errorParam) {
          setError('Authentication failed. Please try again.');
          setTimeout(() => {
            router.push('/auth/signin');
          }, 3000);
          return;
        }

        if (!accessToken || !refreshToken) {
          setError('Invalid authentication response');
          setTimeout(() => {
            router.push('/auth/signin');
          }, 3000);
          return;
        }

        // Store tokens using existing auth flow
        // We need to construct the user object from the token or fetch it
        // For now, we'll just store tokens and let the AuthContext fetch the user
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Redirect to home
        window.location.href = '/';
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Something went wrong. Please try again.');
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-[24px] font-bold text-neutral-900 mb-2">Authentication Failed</h2>
          <p className="text-[14px] text-neutral-600 mb-4">{error}</p>
          <p className="text-[13px] text-neutral-500">Redirecting to login...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-[24px] font-bold text-neutral-900 mb-2">Signing you in...</h2>
        <p className="text-[14px] text-neutral-600">Please wait while we complete your authentication</p>
      </div>
    </div>
  );
}

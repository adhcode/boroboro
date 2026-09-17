'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { authApi } from '@/lib/auth';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState(email);

  // Refs for input boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value && newCode.every(digit => digit)) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted data is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setCode(digits);
      setError('');
      
      // Focus last input
      inputRefs.current[5]?.focus();
      
      // Auto-submit
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (codeString?: string) => {
    const finalCode = codeString || code.join('');
    
    if (!/^\d{6}$/.test(finalCode)) {
      setError('Please enter all 6 digits');
      return;
    }
    
    setLoading(true);

    try {
      const response = await authApi.verifyEmail(finalCode);
      
      // If tokens are returned, auto-login the user
      if (response.accessToken && response.refreshToken && response.user) {
        authApi.setAuthData(response);
        setSuccess(true);
        
        // Redirect to home after 1 second
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        // Fallback: just show success and redirect to login
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/signin?verified=true');
        }, 2000);
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || 'Invalid or expired verification code');
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const targetEmail = isEditingEmail ? editedEmail : email;
    
    if (!targetEmail) {
      setError('Email address is required to resend code');
      return;
    }
    
    setError('');
    setResending(true);

    try {
      await authApi.resendVerificationEmail(targetEmail);
      setResendCooldown(60); // 60 second cooldown
      setError('');
      
      // If email was edited, update URL
      if (isEditingEmail && editedEmail !== email) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(editedEmail)}`);
        setIsEditingEmail(false);
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      // If rate limited, show the cooldown anyway
      if (error.response?.data?.message?.includes('Too Many Requests')) {
        setResendCooldown(60);
      } else {
        setError(error.response?.data?.message || 'Failed to resend code');
      }
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-[24px] font-bold text-neutral-900 mb-2">Email Verified!</h2>
          <p className="text-[14px] text-neutral-600 mb-4">
            Your email has been successfully verified. Taking you to your dashboard...
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
          <h1 className="text-[28px] font-bold text-neutral-900 mb-2">Verify your email</h1>
          
          {/* Email display with edit option */}
          {!isEditingEmail ? (
            <div className="inline-flex items-center gap-2">
              <p className="text-[14px] text-neutral-600">
                Code sent to <span className="font-semibold text-neutral-900">{email}</span>
              </p>
              <button
                onClick={() => {
                  setIsEditingEmail(true);
                  setEditedEmail(email);
                }}
                className="text-[13px] text-primary-600 hover:text-primary-700 font-medium"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="mt-2">
              <input
                type="email"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                className="px-3 py-2 text-[14px] border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                placeholder="Enter correct email"
              />
              <div className="mt-2 flex gap-2 justify-center">
                <button
                  onClick={() => setIsEditingEmail(false)}
                  className="text-[13px] text-neutral-600 hover:text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedEmail)) {
                      handleResend();
                    } else {
                      setError('Please enter a valid email address');
                    }
                  }}
                  className="text-[13px] text-primary-600 hover:text-primary-700 font-medium"
                >
                  Send Code
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Verification Form */}
        <Card className="p-6 lg:p-8">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            {/* 6-Digit Code Input */}
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-3 text-center">
                Enter 6-digit code
              </label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-[24px] font-bold border-2 border-neutral-300 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                    disabled={loading}
                  />
                ))}
              </div>
              <p className="text-[12px] text-neutral-500 mt-3 text-center">
                Enter the code from your email
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={loading || code.some(d => !d)}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-[13px] text-neutral-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="text-[14px] text-primary-600 hover:text-primary-700 font-semibold disabled:text-neutral-400 disabled:cursor-not-allowed"
            >
              {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>
        </Card>

        {/* Back to Register */}
        <p className="text-center text-[14px] text-neutral-600 mt-6">
          Need to use a different email?{' '}
          <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-semibold">
            Create new account
          </Link>
        </p>
      </div>
    </div>
  );
}

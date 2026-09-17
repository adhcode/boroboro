'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { authApi } from '@/lib/auth';
import { validatePasswordStrength } from '@/lib/security';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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

  const handleCodeChange = (index: number, value: string) => {
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
    }
  };

  const handlePasswordChange = (password: string) => {
    setNewPassword(password);
    
    // Validate password strength
    if (password.length > 0) {
      const validation = validatePasswordStrength(password);
      setPasswordErrors(validation.isValid ? [] : validation.feedback);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const codeString = code.join('');
    
    if (!/^\d{6}$/.test(codeString)) {
      setError('Please enter all 6 digits of the reset code');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      setError('Please fix password issues before continuing');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);

    try {
      await authApi.resetPassword(codeString, newPassword);
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/signin?reset=success');
      }, 2000);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || 'Invalid or expired reset code');
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email address is required to resend code');
      return;
    }
    
    setError('');
    setResending(true);

    try {
      await authApi.forgotPassword(email);
      setResendCooldown(60);
      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
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
          <h2 className="text-[24px] font-bold text-neutral-900 mb-2">Password Reset!</h2>
          <p className="text-[14px] text-neutral-600 mb-4">
            Your password has been successfully reset. Redirecting you to login...
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
          <h1 className="text-[28px] font-bold text-neutral-900 mb-2">Reset your password</h1>
          <p className="text-[14px] text-neutral-600">
            Enter the code sent to <span className="font-semibold text-neutral-900">{email}</span>
          </p>
        </div>

        {/* Form */}
        <Card className="p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            {/* 6-Digit Code Input */}
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-3 text-center">
                Enter 6-digit reset code
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
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-[24px] font-bold border-2 border-neutral-300 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                    disabled={loading}
                  />
                ))}
              </div>
              <p className="text-[12px] text-neutral-500 mt-2 text-center">
                Code expires in 1 hour
              </p>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-[14px] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                placeholder="At least 8 characters"
              />
              {passwordErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordErrors.map((err, index) => (
                    <p key={index} className="text-[12px] text-red-600">• {err}</p>
                  ))}
                </div>
              )}
              {newPassword.length > 0 && passwordErrors.length === 0 && (
                <p className="text-[12px] text-green-600 mt-1">✓ Password strength is good</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-[14px] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                placeholder="Re-enter your password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[12px] text-red-600 mt-1">Passwords do not match</p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-[12px] text-green-600 mt-1">✓ Passwords match</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={loading || code.some(d => !d) || !newPassword || !confirmPassword}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
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

        {/* Back to Login */}
        <p className="text-center text-[14px] text-neutral-600 mt-6">
          Remember your password?{' '}
          <Link href="/auth/signin" className="text-primary-600 hover:text-primary-700 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

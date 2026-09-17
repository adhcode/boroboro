'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { validatePasswordStrength } from '@/lib/security';

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    
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
    
    // Validate password before submitting
    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      setError('Please fix password issues before continuing');
      return;
    }
    
    setLoading(true);

    try {
      await register(formData);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-[28px] font-bold text-neutral-900 mb-2">Create your account</h1>
          <p className="text-[14px] text-neutral-600">Join Boroboro and start renting today</p>
        </div>

        {/* Register Form */}
        <Card className="p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-neutral-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-[14px] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-neutral-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-[14px] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-[14px] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
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
              {formData.password.length > 0 && passwordErrors.length === 0 && (
                <p className="text-[12px] text-green-600 mt-1">✓ Password strength is good</p>
              )}
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
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </Card>

        {/* Sign In Link */}
        <p className="text-center text-[14px] text-neutral-600 mt-6">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-primary-600 hover:text-primary-700 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

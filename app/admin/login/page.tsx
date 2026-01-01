'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type View = 'login' | 'forgot-password' | 'verify-otp' | 'reset-password';

export default function AdminLoginPage() {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        return;
      }

      router.push('/admin');
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP');
        return;
      }

      // OTP sent via email - don't show on screen
      setSuccess(data.message || 'OTP has been sent to your email address. Please check your inbox.');
      setView('verify-otp');
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate OTP format
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.verified) {
        setError(data.error || 'Invalid OTP. Please check and try again.');
        return;
      }

      setSuccess('OTP verified successfully');
      setView('reset-password');
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Validate OTP is still present
    if (!otp || otp.length !== 6) {
      setError('OTP is required. Please go back and verify your OTP again.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          otp: otp.trim(), 
          newPassword: newPassword.trim() 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password. Please try again.');
        return;
      }

      setSuccess('Password has been reset successfully. You can now login.');
      setTimeout(() => {
        setView('login');
        setEmail('');
        setPassword('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('');
      }, 2000);
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', position: 'relative', zIndex: 1 }}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-400/20 via-blue-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Login Card - Glassmorphic */}
      <div className="relative w-full max-w-md glass-card rounded-3xl shadow-large p-8 animate-slide-up" style={{ background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl relative overflow-hidden animate-float" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <span className="material-symbols-outlined !text-5xl text-white relative z-10">school</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold gradient-text" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Providence College of Engineering
          </h1>
          <p className="text-gray-700 mt-1 text-sm font-medium">Campus Assistant - Admin Portal</p>
        </div>

        {view === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200/50 p-4 text-sm text-red-600 animate-slide-up" style={{ boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-2">
                Admin ID / Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="modern-input w-full rounded-2xl py-4 px-5 text-charcoal placeholder-charcoal/60"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-charcoal mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="modern-input w-full rounded-2xl py-4 px-5 pr-12 text-charcoal placeholder-charcoal/60"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/60 hover:text-charcoal transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full rounded-2xl py-4 text-base font-semibold text-white relative overflow-hidden group disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <span className="relative z-10">{isLoading ? 'Signing in...' : 'Sign in securely'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setView('forgot-password');
                  setError('');
                  setSuccess('');
                }}
                className="text-sm text-accent hover:underline font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <p className="text-xs text-gray-600 text-center mt-4">
              Two-factor authentication may be required for additional security.
            </p>
          </form>
        )}

        {view === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError('');
                  setSuccess('');
                }}
                className="text-sm text-charcoal hover:text-accent font-medium flex items-center gap-2 mb-4"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back to Login
              </button>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200/50 p-4 text-sm text-red-600 animate-slide-up" style={{ boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl bg-green-50/80 backdrop-blur-sm border border-green-200/50 p-4 text-sm text-green-600 animate-slide-up" style={{ boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}>
                {success}
              </div>
            )}

            <div>
              <label htmlFor="forgot-email" className="block text-sm font-semibold text-charcoal mb-2">
                Enter your email address
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="modern-input w-full rounded-2xl py-4 px-5 text-charcoal placeholder-charcoal/60"
                placeholder="admin@example.com"
              />
              <p className="text-xs text-gray-600 mt-2">
                We'll send a verification code to your email address.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full rounded-2xl py-4 text-base font-semibold text-white relative overflow-hidden group disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <span className="relative z-10">{isLoading ? 'Sending OTP...' : 'Send OTP'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </form>
        )}

        {view === 'verify-otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setView('forgot-password');
                  setOtp('');
                  setError('');
                  setSuccess('');
                }}
                className="text-sm text-charcoal hover:text-accent font-medium flex items-center gap-2 mb-4"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back
              </button>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200/50 p-4 text-sm text-red-600 animate-slide-up" style={{ boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl bg-green-50/80 backdrop-blur-sm border border-green-200/50 p-4 text-sm text-green-600 animate-slide-up" style={{ boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}>
                <p>{success}</p>
              </div>
            )}

            <div>
              <label htmlFor="otp" className="block text-sm font-semibold text-charcoal mb-2">
                Enter verification code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="modern-input w-full rounded-2xl py-4 px-5 text-charcoal placeholder-charcoal/60 text-center text-2xl tracking-widest"
                placeholder="000000"
              />
              <p className="text-xs text-gray-600 mt-2">
                Enter the 6-digit code sent to {email}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="btn-primary w-full rounded-2xl py-4 text-base font-semibold text-white relative overflow-hidden group disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <span className="relative z-10">{isLoading ? 'Verifying...' : 'Verify OTP'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </form>
        )}

        {view === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setView('verify-otp');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                  setSuccess('');
                }}
                className="text-sm text-charcoal hover:text-accent font-medium flex items-center gap-2 mb-4"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back
              </button>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200/50 p-4 text-sm text-red-600 animate-slide-up" style={{ boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl bg-green-50/80 backdrop-blur-sm border border-green-200/50 p-4 text-sm text-green-600 animate-slide-up" style={{ boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}>
                {success}
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="block text-sm font-semibold text-charcoal mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="modern-input w-full rounded-2xl py-4 px-5 pr-12 text-charcoal placeholder-charcoal/60"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/60 hover:text-charcoal transition-colors focus:outline-none"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showNewPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-charcoal mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="modern-input w-full rounded-2xl py-4 px-5 pr-12 text-charcoal placeholder-charcoal/60"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/60 hover:text-charcoal transition-colors focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full rounded-2xl py-4 text-base font-semibold text-white relative overflow-hidden group disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <span className="relative z-10">{isLoading ? 'Resetting...' : 'Reset Password'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

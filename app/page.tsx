'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type PageView = 'login' | 'otp' | 'onboarding';

export default function OnboardingPage() {
  const [pageView, setPageView] = useState<PageView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '', userType: 'student' });
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();

  // Check if user is already logged in and verified
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('clientUserLoggedIn');
    const clientUserId = localStorage.getItem('clientUserId');
    const emailVerified = localStorage.getItem('emailVerified');

    if (isLoggedIn === 'true' && clientUserId && emailVerified === 'true') {
      router.push('/chat');
    }
  }, [router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  /**
   * Handle Registration and Send OTP
   * Flow: Register user → Send OTP → Show OTP input screen
   */
  const handleRegisterAndSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Validate form
      if (!formData.email || !formData.mobile || !formData.userType) {
        setErrorMessage('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setErrorMessage('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      // Step 1: Register user
      const registerResponse = await fetch('/api/client/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || null,
          mobile: formData.mobile,
          email: formData.email,
          userType: formData.userType,
        }),
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        // Show detailed error message including details if available
        const errorMsg = error.error || 'Registration failed';
        const details = error.details ? `\n\nDetails: ${error.details}` : '';
        const code = error.code ? `\n\nError Code: ${error.code}` : '';
        throw new Error(errorMsg + details + code);
      }

      const registerData = await registerResponse.json();

      // Step 2: Send OTP
      const otpResponse = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      if (!otpResponse.ok) {
        let error: any = {};
        try {
          error = await otpResponse.json();
        } catch {
          error = { error: 'Failed to send OTP. Please check server logs.' };
        }
        
        // Handle cooldown error
        if (otpResponse.status === 429 && error.cooldownSeconds) {
          setResendCooldown(error.cooldownSeconds);
          throw new Error(error.error || 'Please wait before requesting a new OTP');
        }
        
        // Show detailed error message (especially for SMTP auth errors)
        const errorMessage = error.error || error.details || 'Failed to send OTP';
        throw new Error(errorMessage);
      }

      // Save user data to localStorage
      localStorage.setItem('clientUserId', registerData.user.id);
      localStorage.setItem('clientUserEmail', formData.email);
      localStorage.setItem('clientUserType', formData.userType);
      localStorage.setItem('emailVerified', 'false');

      // Show OTP input screen
      setPageView('otp');
      setResendCooldown(60); // Start 60-second cooldown
      setErrorMessage('');
    } catch (error: any) {
      console.error('Error in registration/OTP flow:', error);
      setErrorMessage(error.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle OTP Verification
   */
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Validate OTP format
      if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        setErrorMessage('Please enter a valid 6-digit OTP');
        setIsLoading(false);
        return;
      }

      const email = localStorage.getItem('clientUserEmail');
      if (!email) {
        setErrorMessage('Email not found. Please register again.');
        setPageView('login');
        setIsLoading(false);
        return;
      }

      // Verify OTP
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          otp: otp,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'OTP verification failed');
      }

      const data = await response.json();

      // Update localStorage
      localStorage.setItem('clientUserLoggedIn', 'true');
      localStorage.setItem('emailVerified', 'true');
      localStorage.setItem('clientUserId', data.user.id);

      // Redirect to chat
      router.push('/chat');
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setErrorMessage(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Resend OTP
   */
  const handleResendOTP = async () => {
    if (resendCooldown > 0) {
      return; // Still in cooldown
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const email = localStorage.getItem('clientUserEmail');
      if (!email) {
        setErrorMessage('Email not found. Please register again.');
        setPageView('login');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        if (response.status === 429 && error.cooldownSeconds) {
          setResendCooldown(error.cooldownSeconds);
          throw new Error(error.error || 'Please wait before requesting a new OTP');
        }
        
        throw new Error(error.error || 'Failed to resend OTP');
      }

      setResendCooldown(60); // Reset cooldown
      setErrorMessage('');
      alert('OTP has been resent to your email!');
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      setErrorMessage(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    router.push('/chat');
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    router.push('/chat');
  };

  // OTP Verification View
  if (pageView === 'otp') {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-400/20 via-blue-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* OTP Verification Card */}
        <div className="relative flex w-full max-w-md flex-col overflow-hidden glass-card rounded-3xl shadow-large animate-slide-up" style={{ backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.25)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
          <div className="p-8 pb-6 text-center">
            <div className="mb-5 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl relative overflow-hidden animate-float" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <span className="material-symbols-outlined !text-4xl text-white relative z-10">mail</span>
            </div>
            
            <h1 className="text-2xl font-bold leading-snug tracking-tight gradient-text" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Verify Your Email
            </h1>
            <p className="text-gray-700 pt-1.5 text-[15px] font-normal leading-relaxed">
              We have sent an OTP to your email. Please enter the 6-digit code below.
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4 px-8 pb-8">
            {errorMessage && (
              <div className="rounded-lg bg-red-100/50 p-3 text-sm text-red-700 border border-red-200 whitespace-pre-line">
                {errorMessage}
              </div>
            )}

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only digits
                  if (value.length <= 6) {
                    setOtp(value);
                  }
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 backdrop-blur text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-center text-2xl font-mono tracking-widest"
                style={{ letterSpacing: '0.5em' }}
              />
              <p className="text-xs text-gray-600 mt-2 text-center">
                OTP is valid for 5 minutes
              </p>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="btn-primary w-full rounded-2xl py-4 text-base font-semibold text-white relative overflow-hidden group mt-4 disabled:opacity-50"
              style={{ background: isLoading || otp.length !== 6 ? 'rgba(102, 126, 234, 0.5)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <span className="relative z-10">{isLoading ? 'Verifying...' : 'Verify OTP'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            {/* Resend OTP Button */}
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading || resendCooldown > 0}
              className="mt-2 w-full rounded-2xl py-3 text-sm font-medium text-gray-600 transition-all hover:bg-white/30 hover:text-gray-800 backdrop-blur-sm disabled:opacity-50"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
            </button>

            {/* Back to Registration */}
            <button
              type="button"
              onClick={() => {
                setPageView('login');
                setOtp('');
                localStorage.removeItem('clientUserId');
                localStorage.removeItem('clientUserEmail');
                localStorage.removeItem('clientUserType');
                localStorage.removeItem('emailVerified');
              }}
              className="mt-2 w-full rounded-2xl py-3 text-sm font-medium text-gray-600 transition-all hover:bg-white/30 hover:text-gray-800 backdrop-blur-sm"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              Back to Registration
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Registration Form View
  if (pageView === 'login') {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-400/20 via-blue-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Login Card */}
        <div className="relative flex w-full max-w-md flex-col overflow-hidden glass-card rounded-3xl shadow-large animate-slide-up" style={{ backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.25)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
          {/* Header Section */}
          <div className="p-8 pb-6 text-center">
            <div className="mb-5 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl relative overflow-hidden animate-float" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <span className="material-symbols-outlined !text-4xl text-white relative z-10">person</span>
            </div>
            
            <h1 className="text-2xl font-bold leading-snug tracking-tight gradient-text" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Welcome to Campus Assistant
            </h1>
            <p className="text-gray-700 pt-1.5 text-[15px] font-normal leading-relaxed">
              Please register to continue
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleRegisterAndSendOTP} className="flex flex-col gap-4 px-8 pb-8">
            {errorMessage && (
              <div className="rounded-lg bg-red-100/50 p-3 text-sm text-red-700 border border-red-200 whitespace-pre-line">
                {errorMessage}
              </div>
            )}

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 backdrop-blur text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {/* Mobile Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
              <input
                type="tel"
                required
                placeholder="+91 XXXXX XXXXX"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 backdrop-blur text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 backdrop-blur text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {/* User Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
              <select
                value={formData.userType}
                onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 backdrop-blur text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              >
                <option value="student">Student</option>
                <option value="guest">Guest</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            {/* Send OTP Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full rounded-2xl py-4 text-base font-semibold text-white relative overflow-hidden group mt-4"
              style={{ background: isLoading ? 'rgba(102, 126, 234, 0.5)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <span className="relative z-10">{isLoading ? 'Sending OTP...' : 'Send OTP'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Onboarding View (not used in OTP flow, but kept for compatibility)
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4" style={{ position: 'relative', zIndex: 1 }}>
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-400/20 via-blue-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main Card - Glassmorphic Design */}
      <div className="relative flex w-full max-w-sm flex-col overflow-hidden glass-card rounded-3xl shadow-large animate-slide-up" style={{ backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.25)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
        {/* Header Section */}
        <div className="p-8 pb-6 text-left relative">
          {/* Icon with Gradient Background and Glow */}
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl relative overflow-hidden animate-float" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            <span className="material-symbols-outlined !text-4xl text-white relative z-10">
              support_agent
            </span>
          </div>
          
          <h1 className="text-2xl font-bold leading-snug tracking-tight gradient-text" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Welcome to your Campus Assistant
          </h1>
          <p className="text-gray-700 pt-1.5 text-[15px] font-normal leading-relaxed">
            Your personal guide to everything Providence College of Engineering.
          </p>
        </div>

        {/* Feature Cards - Neumorphic Style */}
        <div className="flex flex-col gap-3 px-8">
          <div className="flex items-center gap-4 rounded-2xl neu-card p-4 hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl icon-glass" style={{ background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)', backdropFilter: 'blur(10px)' }}>
              <span className="material-symbols-outlined text-accent text-xl">map</span>
            </div>
            <div>
              <p className="text-charcoal text-base font-semibold leading-tight">
                Campus Navigation
              </p>
              <p className="text-gray-600 pt-0.5 text-sm font-normal leading-tight">
                Find your way to any building or hall.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl neu-card p-4 hover-lift animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl icon-glass" style={{ background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)', backdropFilter: 'blur(10px)' }}>
              <span className="material-symbols-outlined text-accent text-xl">school</span>
            </div>
            <div>
              <p className="text-charcoal text-base font-semibold leading-tight">
                Academic Info
              </p>
              <p className="text-gray-600 pt-0.5 text-sm font-normal leading-tight">
                Access schedules and important deadlines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl neu-card p-4 hover-lift animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl icon-glass" style={{ background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)', backdropFilter: 'blur(10px)' }}>
              <span className="material-symbols-outlined text-accent text-xl">event</span>
            </div>
            <div>
              <p className="text-charcoal text-base font-semibold leading-tight">
                Campus Events
              </p>
              <p className="text-gray-600 pt-0.5 text-sm font-normal leading-tight">
                Stay updated on the latest campus news.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-8 p-8 pt-4">
          <div className="flex justify-center gap-2 py-4">
            <div className="h-2 w-4 rounded-full" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', boxShadow: '0 0 10px rgba(79, 172, 254, 0.5)' }}></div>
            <div className="h-2 w-2 rounded-full bg-gray-300"></div>
            <div className="h-2 w-2 rounded-full bg-gray-300"></div>
          </div>
          
          <button
            onClick={handleContinue}
            className="btn-primary w-full rounded-2xl py-4 text-base font-semibold text-white relative overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <span className="relative z-10">Continue</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
          
          <button
            onClick={handleSkip}
            className="mt-3 w-full rounded-2xl py-3 text-sm font-medium text-gray-600 transition-all hover:bg-white/30 hover:text-gray-800 backdrop-blur-sm"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

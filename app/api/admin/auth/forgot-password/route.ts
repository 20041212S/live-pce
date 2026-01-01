import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/otpEmail';
import { randomInt } from 'crypto';

// Enhanced OTP storage with security features
interface OTPData {
  otp: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  createdAt: number;
  lastAttemptAt?: number;
}

// In-memory OTP storage (in production, use Redis or database)
// Export for use in reset-password route
export const otpStore = new Map<string, OTPData>();

// Rate limiting: max 3 OTP requests per email per 15 minutes
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_OTP_REQUESTS = 3;
const MAX_VERIFICATION_ATTEMPTS = 5;
const OTP_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes

// Track OTP request timestamps for rate limiting
const otpRequestTimestamps = new Map<string, number[]>();

// Generate secure 6-digit OTP using crypto
function generateOTP(): string {
  // Use crypto.randomInt for cryptographically secure random number
  // Generate a truly random 6-digit number between 100000 and 999999
  // This ensures each OTP is unique and unpredictable
  let otp: string;
  
  // Generate random OTP - ensure it's never a predictable value
  do {
    otp = randomInt(100000, 999999).toString();
  } while (otp === '123456' || otp === '000000' || otp === '111111' || otp === '999999'); // Avoid common test values
  
  // Ensure it's exactly 6 digits (should always be, but safety check)
  if (otp.length !== 6) {
    // Fallback: pad with zeros if somehow not 6 digits
    otp = otp.padStart(6, '0').slice(0, 6);
  }
  
  // Log for debugging (shows in server console)
  console.log('🔐 Generated secure random OTP:', otp);
  
  return otp;
}

// Check rate limiting
function checkRateLimit(email: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const timestamps = otpRequestTimestamps.get(email) || [];
  
  // Remove timestamps outside the rate limit window
  const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  
  if (recentTimestamps.length >= MAX_OTP_REQUESTS) {
    const oldestRequest = Math.min(...recentTimestamps);
    const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestRequest)) / 1000 / 60);
    return {
      allowed: false,
      message: `Too many OTP requests. Please wait ${waitTime} minute(s) before requesting again.`
    };
  }
  
  // Add current timestamp
  recentTimestamps.push(now);
  otpRequestTimestamps.set(email, recentTimestamps);
  
  return { allowed: true };
}

// Cleanup expired OTPs and old rate limit data
function cleanupExpiredData() {
  const now = Date.now();
  
  // Clean expired OTPs
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
    }
  }
  
  // Clean old rate limit timestamps
  for (const [email, timestamps] of otpRequestTimestamps.entries()) {
    const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (recentTimestamps.length === 0) {
      otpRequestTimestamps.delete(email);
    } else {
      otpRequestTimestamps.set(email, recentTimestamps);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredData, 5 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limiting
    const rateLimitCheck = checkRateLimit(normalizedEmail);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.message || 'Too many OTP requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      // Still return success to not reveal if user exists
      return NextResponse.json({
        success: true,
        message: 'If the email exists, an OTP has been sent to your email address.',
      });
    }


    // Generate secure OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + OTP_EXPIRY_TIME;
    const createdAt = Date.now();

    // Store OTP with metadata for security
    otpStore.set(normalizedEmail, {
      otp,
      expiresAt,
      attempts: 0,
      verified: false,
      createdAt,
    });

    // Send OTP via email immediately (optimized for speed)
    try {
      await sendOTPEmail(normalizedEmail, otp, 'Password Reset Verification Code - PCE Campus Assistant');
    } catch (emailError: any) {
      // Remove OTP from store if email fails
      otpStore.delete(normalizedEmail);
      console.error('❌ Failed to send OTP email to:', normalizedEmail);
      console.error('   Error:', emailError.message);
      console.error('   Error stack:', emailError.stack);
      
      return NextResponse.json(
        { 
          error: 'Failed to send OTP email. Please check your email configuration or try again later.',
          details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        },
        { status: 500 }
      );
    }

    // Success - OTP sent via email
    return NextResponse.json({
      success: true,
      message: 'OTP has been sent to your email address. Please check your inbox.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Verify OTP (mark as verified but don't delete - needed for password reset)
export async function PUT(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Normalize OTP (remove spaces, ensure it's 6 digits)
    const normalizedOTP = otp.toString().trim().replace(/\s/g, '');
    
    if (normalizedOTP.length !== 6 || !/^\d{6}$/.test(normalizedOTP)) {
      return NextResponse.json(
        { error: 'OTP must be a 6-digit number' },
        { status: 400 }
      );
    }

    const stored = otpStore.get(normalizedEmail);

    if (!stored) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if expired
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalizedEmail);
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check verification attempts
    if (stored.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      otpStore.delete(normalizedEmail);
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Increment attempts
    stored.attempts += 1;
    stored.lastAttemptAt = Date.now();

    // Verify OTP (case-insensitive comparison, though OTP is numeric)
    if (stored.otp !== normalizedOTP) {
      otpStore.set(normalizedEmail, stored);
      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - stored.attempts;
      
      return NextResponse.json(
        { 
          error: `Invalid OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Please request a new OTP.'}` 
        },
        { status: 400 }
      );
    }

    // OTP verified - mark as verified but DON'T delete (needed for password reset)
    stored.verified = true;
    otpStore.set(normalizedEmail, stored);
    
    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      verified: true,
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}


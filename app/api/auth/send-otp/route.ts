import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateOTP, hashOTP, getOTPExpirationTime, canResendOTP } from '@/lib/otpUtils';
import { sendOTPEmail } from '@/lib/otpEmail';

/**
 * POST /api/auth/send-otp
 * 
 * Sends a 6-digit numeric OTP to the user's email for verification
 * 
 * Security Rules:
 * - OTP generated on backend only
 * - OTP hashed before storing
 * - 5-minute expiry
 * - 60-second resend cooldown
 * - Rate limiting per email
 */
export async function POST(request: NextRequest) {
  try {
    // Debug: Verify DATABASE_URL is set
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    const { email } = await request.json();

    // 1. Validate email format
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 2. Check for existing OTP record
    const existingOTP = await prisma.emailOTP.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Check resend cooldown (60 seconds)
    if (existingOTP && existingOTP.lastSentAt) {
      if (!canResendOTP(existingOTP.lastSentAt)) {
        const remainingSeconds = Math.ceil(
          (60 * 1000 - (Date.now() - existingOTP.lastSentAt.getTime())) / 1000
        );
        return NextResponse.json(
          { 
            error: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
            cooldownSeconds: remainingSeconds
          },
          { status: 429 } // Too Many Requests
        );
      }
    }

    // 4. Generate secure 6-digit OTP
    const otp = generateOTP();

    // 5. Hash OTP before storing
    const otpHash = await hashOTP(otp);

    // 6. Calculate expiration time (5 minutes from now)
    const expiresAt = getOTPExpirationTime();

    // 7. Store or update OTP record in database
    const now = new Date();
    
    if (existingOTP) {
      // Update existing record
      await prisma.emailOTP.update({
        where: { id: existingOTP.id },
        data: {
          otpHash: otpHash,
          expiresAt: expiresAt,
          attempts: 0, // Reset attempts on new OTP
          verified: false,
          lastSentAt: now,
        },
      });
    } else {
      // Create new record
      await prisma.emailOTP.create({
        data: {
          email: normalizedEmail,
          otpHash: otpHash,
          expiresAt: expiresAt,
          attempts: 0,
          verified: false,
          lastSentAt: now,
        },
      });
    }

    // 8. Send OTP via email using Nodemailer
    try {
      await sendOTPEmail(normalizedEmail, otp);
    } catch (emailError: any) {
      console.error('❌ Failed to send OTP email:', emailError);
      
      // Delete the OTP record if email sending fails
      await prisma.emailOTP.deleteMany({
        where: { email: normalizedEmail },
      });
      
      return NextResponse.json(
        { error: `Failed to send OTP email: ${emailError.message}` },
        { status: 500 }
      );
    }

    // 9. Return success (DO NOT return OTP in response)
    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent successfully to your email',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error in send-otp endpoint:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    
    // Handle database connection errors
    if (error.message?.includes('DATABASE_URL') || error.message?.includes('database') || error.message?.includes('Failed to initialize database connection')) {
      console.error('⚠️ Database connection error - check DATABASE_URL environment variable');
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please contact support.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
    }
    
    // Handle Prisma connection errors
    if (error.code === 'P1001' || error.code === 'P1017') {
      return NextResponse.json(
        { 
          error: 'Database connection error. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
    }
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Database constraint violation. Please try again.' },
        { status: 400 }
      );
    }
    
    // Return detailed error for debugging
    const errorMessage = error.message || 'Unknown error occurred';
    
    // Log full error for debugging in Vercel logs
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    // Provide more helpful error messages
    let userFriendlyError = 'Failed to send OTP. Please try again.';
    
    if (error.message?.includes('table') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
      userFriendlyError = 'Database tables not found. Please run database migrations.';
    } else if (error.message?.includes('connection') || error.message?.includes('timeout')) {
      userFriendlyError = 'Database connection failed. Please check your database configuration.';
    } else if (error.code) {
      userFriendlyError = `Database error (${error.code}). Please contact support.`;
    }
    
    return NextResponse.json(
      { 
        error: userFriendlyError,
        details: errorMessage,
        code: error.code || 'UNKNOWN',
        type: error.name || 'Error',
        // Include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}


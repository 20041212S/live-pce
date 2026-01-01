import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyOTP, isOTPExpired } from '@/lib/otpUtils';

/**
 * POST /api/auth/verify-otp
 * 
 * Verifies the OTP entered by the user
 * 
 * Security Rules:
 * - Max 3 verification attempts
 * - OTP expires after 5 minutes
 * - Delete OTP after successful verification or expiry
 * - Mark user email as verified on success
 */
export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    // 1. Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format. OTP must be a 6-digit number' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Fetch OTP record by email
    const otpRecord = await prisma.emailOTP.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'OTP not found. Please request a new OTP' },
        { status: 404 }
      );
    }

    // 3. Check if OTP has expired
    if (isOTPExpired(otpRecord.expiresAt)) {
      // Delete expired OTP record
      await prisma.emailOTP.delete({
        where: { id: otpRecord.id },
      });
      
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new OTP' },
        { status: 400 }
      );
    }

    // 4. Check if max attempts exceeded (3 attempts)
    if (otpRecord.attempts >= 3) {
      // Delete OTP record after max attempts
      await prisma.emailOTP.delete({
        where: { id: otpRecord.id },
      });
      
      return NextResponse.json(
        { error: 'Maximum verification attempts exceeded. Please request a new OTP' },
        { status: 400 }
      );
    }

    // 5. Verify OTP by comparing hashed values
    const isValid = await verifyOTP(otp, otpRecord.otpHash);

    if (!isValid) {
      // Increment attempts
      await prisma.emailOTP.update({
        where: { id: otpRecord.id },
        data: {
          attempts: otpRecord.attempts + 1,
        },
      });

      const remainingAttempts = 3 - (otpRecord.attempts + 1);
      
      return NextResponse.json(
        { 
          error: `Invalid OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Maximum attempts exceeded.'}`,
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0
        },
        { status: 400 }
      );
    }

    // 6. OTP is correct - mark as verified and update user
    // Mark OTP record as verified
    await prisma.emailOTP.update({
      where: { id: otpRecord.id },
      data: {
        verified: true,
      },
    });

    // Update or create user with email_verified = true
    let clientUser = await prisma.clientUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (clientUser) {
      // Update existing user
      clientUser = await prisma.clientUser.update({
        where: { id: clientUser.id },
        data: {
          emailVerified: true,
        },
      });
    } else {
      // User doesn't exist yet (shouldn't happen in normal flow, but handle gracefully)
      // This means user needs to complete registration first
      return NextResponse.json(
        { error: 'User not found. Please complete registration first' },
        { status: 404 }
      );
    }

    // 7. Delete OTP record after successful verification
    await prisma.emailOTP.delete({
      where: { id: otpRecord.id },
    });


    // 8. Return success with user info
    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        user: {
          id: clientUser.id,
          email: clientUser.email,
          emailVerified: clientUser.emailVerified,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error in verify-otp endpoint:', error);
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
    
    if (error.code === 'P2025') {
      // Record not found - handled in the logic above, but catch here as fallback
      return NextResponse.json(
        { error: 'OTP record not found. Please request a new OTP.' },
        { status: 404 }
      );
    }
    
    // Return detailed error for debugging
    const errorMessage = error.message || 'Unknown error occurred';
    
    // Log full error for debugging in Vercel logs
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    // Provide more helpful error messages
    let userFriendlyError = 'Failed to verify OTP. Please try again.';
    
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


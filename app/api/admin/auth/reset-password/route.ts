import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { otpStore } from '../forgot-password/route';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Normalize email and OTP
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedOTP = otp.toString().trim().replace(/\s/g, '');

    // Verify OTP is valid format
    if (normalizedOTP.length !== 6 || !/^\d{6}$/.test(normalizedOTP)) {
      return NextResponse.json(
        { error: 'OTP must be a 6-digit number' },
        { status: 400 }
      );
    }

    // Get stored OTP data
    const stored = otpStore.get(normalizedEmail);

    if (!stored) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if OTP was verified
    if (!stored.verified) {
      return NextResponse.json(
        { error: 'OTP must be verified first. Please verify the OTP before resetting password.' },
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

    // Verify OTP matches (double-check for security)
    if (stored.otp !== normalizedOTP) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please verify the OTP again.' },
        { status: 400 }
      );
    }

    // OTP verified and valid - remove it after successful password reset
    otpStore.delete(normalizedEmail);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'PASSWORD_RESET',
        severity: 'IMPORTANT',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/client/register
 * 
 * Registers a new client user (student/guest/parent)
 * User must verify email via OTP after registration
 * 
 * Flow:
 * 1. User registers → email_verified = false
 * 2. User receives OTP via email
 * 3. User verifies OTP → email_verified = true
 * 4. User can access the app
 */
export async function POST(request: NextRequest) {
  try {
    // Debug: Verify DATABASE_URL is set
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    const body = await request.json();
    const { name, mobile, email, userType } = body;

    // Validate required fields
    if (!mobile || !email || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields: mobile, email, userType' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate userType
    const validUserTypes = ['student', 'guest', 'parent'];
    if (!validUserTypes.includes(userType.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid userType. Must be: student, guest, or parent' },
        { status: 400 }
      );
    }

    // Check if user already exists by email
    const existingUser = await prisma.clientUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Return existing user (idempotent operation)
      return NextResponse.json(
        {
          success: true,
          message: 'User already registered',
          user: existingUser,
        },
        { status: 200 }
      );
    }

    // Create client user with email_verified = false
    // User must verify email via OTP after registration
    const clientUser = await prisma.clientUser.create({
      data: {
        name: name?.trim() || null,
        mobile: mobile.trim(),
        email: normalizedEmail,
        userType: userType.toLowerCase(),
        emailVerified: false, // Must verify via OTP
      },
    });


    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully. Please verify your email with the OTP sent to your inbox.',
        user: {
          id: clientUser.id,
          email: clientUser.email,
          emailVerified: clientUser.emailVerified,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Error registering client user:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    
    // Handle database connection errors
    if (error.message?.includes('DATABASE_URL') || error.message?.includes('database')) {
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
      const field = error.meta?.target?.[0] || 'field';
      const fieldName = field === 'email' ? 'email address' : field === 'mobile' ? 'mobile number' : field;
      return NextResponse.json(
        { error: `This ${fieldName} is already registered. Please use a different ${fieldName}.` },
        { status: 400 }
      );
    }
    
    // Return detailed error for debugging
    const errorMessage = error.message || 'Unknown error occurred';
    
    // Log full error for debugging in Vercel logs
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    // Provide more helpful error messages
    let userFriendlyError = 'Failed to register user. Please try again.';
    
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
        details: errorMessage, // Always include details for debugging
        code: error.code || 'UNKNOWN',
        type: error.name || 'Error',
        // Include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}

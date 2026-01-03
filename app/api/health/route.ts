import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = "nodejs";

/**
 * GET /api/health
 * Health check endpoint to verify database connection
 */
export async function GET(request: NextRequest) {
  try {
    // Test database connection with timeout
    const connectionTest = Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]);

    await connectionTest;

    // Check if ClientUser table exists
    const tableExists = await prisma.$queryRaw<
      { exists: boolean }[]
    >`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'client_users'
      );
    `;

    const exists = tableExists[0]?.exists ?? false;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      tables: {
        client_users: exists ? 'exists' : 'missing'
      },
      environment: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
    });

    // Provide more detailed error information
    const errorInfo: any = {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN',
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      timestamp: new Date().toISOString()
    };

    // Add Prisma-specific error codes
    if (error.code) {
      errorInfo.prismaCode = error.code;
      
      // Common Prisma error codes:
      // P1001: Can't reach database server
      // P1017: Server has closed the connection
      // P1000: Authentication failed
      if (error.code === 'P1001' || error.code === 'P1017') {
        errorInfo.suggestion = 'Check database connection string and network connectivity';
      } else if (error.code === 'P1000') {
        errorInfo.suggestion = 'Check database credentials';
      }
    }

    return NextResponse.json(errorInfo, { status: 503 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = "nodejs";

/**
 * GET /api/health
 * Health check endpoint to verify database connection
 */
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

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
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
  } catch (error: any) {
    console.error('Health check failed:', error);

    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      code: error.code,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    }, { status: 503 });
  }
}

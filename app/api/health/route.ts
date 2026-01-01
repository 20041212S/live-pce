import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/health
 * 
 * Health check endpoint to verify database connection
 * Useful for debugging registration issues
 */
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if ClientUser table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'client_users'
      );
    `;
    
    const exists = (tableExists as any[])[0]?.exists || false;
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      tables: {
        client_users: exists ? 'exists' : 'missing'
      },
      environment: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...' || 'not set'
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      code: error.code,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...' || 'not set'
    }, { status: 503 });
  }
}


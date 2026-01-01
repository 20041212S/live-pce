import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get all conversations for admin dashboard stats
export async function GET(request: NextRequest) {
  try {
    // Get all conversations for admin dashboard
    const conversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 1000, // Limit to prevent performance issues
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Admin conversations GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



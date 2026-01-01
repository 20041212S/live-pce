import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');

    // Build filter
    const where: any = {};
    if (userType) {
      const validUserTypes = ['student', 'guest', 'parent'];
      if (!validUserTypes.includes(userType.toLowerCase())) {
        return NextResponse.json(
          { error: 'Invalid userType filter. Must be: student, guest, or parent' },
          { status: 400 }
        );
      }
      where.userType = userType.toLowerCase();
    }

    // Fetch client users
    const clientUsers = await prisma.clientUser.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      {
        success: true,
        count: clientUsers.length,
        users: clientUsers,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching client users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client users', details: error.message },
      { status: 500 }
    );
  }
}

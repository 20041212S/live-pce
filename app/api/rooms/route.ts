import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get rooms (student access, no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const building = searchParams.get('building');
    const floor = searchParams.get('floor');
    const roomCode = searchParams.get('roomCode');

    const where: any = {};
    if (building) {
      // SQLite doesn't support case-insensitive mode, so we'll use contains
      where.buildingName = { contains: building };
    }
    if (floor) {
      where.floor = { contains: floor };
    }
    if (roomCode) {
      where.roomCode = { contains: roomCode };
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy: [{ buildingName: 'asc' }, { floor: 'asc' }, { roomCode: 'asc' }],
    });

    return NextResponse.json(rooms);
  } catch (error: any) {
    console.error('Rooms GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


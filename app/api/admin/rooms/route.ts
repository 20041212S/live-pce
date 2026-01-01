import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - List all rooms
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await prisma.room.findMany({
      orderBy: [{ buildingName: 'asc' }, { floor: 'asc' }, { roomCode: 'asc' }],
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Rooms GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new room
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomCode, buildingName, floor, textDirections, latitude, longitude, imageUrl } = body;

    // Validate required fields
    if (!roomCode || !roomCode.trim()) {
      return NextResponse.json(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }
    if (!buildingName || !buildingName.trim()) {
      return NextResponse.json(
        { error: 'Building name is required' },
        { status: 400 }
      );
    }
    if (!floor || !floor.trim()) {
      return NextResponse.json(
        { error: 'Floor is required' },
        { status: 400 }
      );
    }

    // Validate latitude and longitude if provided
    let lat: number | null = null;
    let lng: number | null = null;
    
    if (latitude !== null && latitude !== undefined && latitude !== '') {
      const parsedLat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        return NextResponse.json(
          { error: 'Latitude must be a number between -90 and 90' },
          { status: 400 }
        );
      }
      lat = parsedLat;
    }
    
    if (longitude !== null && longitude !== undefined && longitude !== '') {
      const parsedLng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
      if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        return NextResponse.json(
          { error: 'Longitude must be a number between -180 and 180' },
          { status: 400 }
        );
      }
      lng = parsedLng;
    }

    // Check if room code already exists
    const existingRoom = await prisma.room.findUnique({
      where: { roomCode: roomCode.trim() },
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Room code already exists. Please use a different room code.' },
        { status: 400 }
      );
    }

    const room = await prisma.room.create({
      data: {
        roomCode: roomCode.trim(),
        buildingName: buildingName.trim(),
        floor: floor.trim(),
        textDirections: textDirections?.trim() || null,
        latitude: lat,
        longitude: lng,
        imageUrl: imageUrl?.trim() || null,
      },
    });

    // Audit log (non-blocking - don't fail if this fails)
    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.userId,
          action: 'ROOM_CREATE',
          entityType: 'Room',
          entityId: room.id,
          severity: 'INFO',
        },
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Continue even if audit log fails
    }

    return NextResponse.json(room);
  } catch (error: any) {
    console.error('Rooms POST error:', error);
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Room code already exists. Please use a different room code.' },
        { status: 400 }
      );
    }
    
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


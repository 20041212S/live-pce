import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - List all staff
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    const where: any = {};
    if (department) {
      where.department = department;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    const staff = await prisma.staff.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Staff GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new staff
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, department, designation, email, phone, status, avatarUrl, qualifications } = body;

    if (!name || !department || !designation) {
      return NextResponse.json(
        { error: 'Name, department, and designation are required' },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.create({
      data: {
        name,
        department,
        designation,
        email,
        phone,
        status: status || 'ACTIVE',
        avatarUrl,
        qualifications,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.userId,
        action: 'STAFF_CREATE',
        entityType: 'Staff',
        entityId: staff.id,
        severity: 'INFO',
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Staff POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


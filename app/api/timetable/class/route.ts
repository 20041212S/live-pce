import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get class timetables (student access, no auth required)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const programName = url.searchParams.get('programName') || undefined;
    const semester = url.searchParams.get('semester') || undefined;
    const dayOfWeek = url.searchParams.get('dayOfWeek') || undefined;

    const where: any = {};
    if (programName) where.programName = { contains: programName };
    if (semester) where.semester = { contains: semester };
    if (dayOfWeek) where.dayOfWeek = { contains: dayOfWeek };

    const items = await prisma.classTimetable.findMany({
      where,
      orderBy: [{ programName: 'asc' }, { semester: 'asc' }, { dayOfWeek: 'asc' }, { period: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error('Class timetable GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


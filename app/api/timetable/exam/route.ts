import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get exam timetables (student access, no auth required)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const programName = url.searchParams.get('programName') || undefined;
    const semester = url.searchParams.get('semester') || undefined;
    const examName = url.searchParams.get('examName') || undefined;

    const where: any = {};
    if (programName) where.programName = { contains: programName };
    if (semester) where.semester = { contains: semester };
    if (examName) where.examName = { contains: examName };

    const items = await prisma.examTimetable.findMany({
      where,
      orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error('Exam timetable GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


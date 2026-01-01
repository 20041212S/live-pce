import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const programName = url.searchParams.get('programName') || undefined;
    const semester = url.searchParams.get('semester') || undefined;
    const examName = url.searchParams.get('examName') || undefined;

    const where: any = {};
    if (programName) where.programName = programName;
    if (semester) where.semester = semester;
    if (examName) where.examName = examName;

    const items = await prisma.examTimetable.findMany({ where, orderBy: [{ examDate: 'asc' }] });
    return NextResponse.json(items);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    if (!body.examDate) {
      return NextResponse.json({ error: 'examDate is required' }, { status: 400 });
    }
    // Ensure valid ISO date
    const d = new Date(body.examDate);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Invalid examDate. Use YYYY-MM-DD' }, { status: 400 });
    }
    body.examDate = d;
    const created = await prisma.examTimetable.create({ data: body });
    return NextResponse.json(created);
  } catch (err: any) {
    console.error('Create exam timetable error', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - list with optional filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const programName = url.searchParams.get('programName') || undefined;
    const semester = url.searchParams.get('semester') || undefined;
    const dayOfWeek = url.searchParams.get('dayOfWeek') || undefined;

    const where: any = {};
    if (programName) where.programName = programName;
    if (semester) where.semester = semester;
    if (dayOfWeek) where.dayOfWeek = dayOfWeek;

    const items = await prisma.classTimetable.findMany({ where, orderBy: [{ programName: 'asc' }, { semester: 'asc' }, { dayOfWeek: 'asc' }, { period: 'asc' }] });
    return NextResponse.json(items);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - create
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const created = await prisma.classTimetable.create({ data: body });
    return NextResponse.json(created);
  } catch (err: any) {
    console.error('Create class timetable error', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

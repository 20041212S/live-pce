import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const items = await prisma.examTimeTable.findMany({ orderBy: { examDate: 'desc' } });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // ensure examDate is a Date
    if (body.examDate && typeof body.examDate === 'string') {
      body.examDate = new Date(body.examDate);
    }
    const item = await prisma.examTimeTable.create({ data: body });
    return NextResponse.json(item);
  } catch (err: any) {
    console.error('Failed to create exam timetable:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

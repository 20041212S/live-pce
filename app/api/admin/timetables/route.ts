import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const items = await prisma.timeTable.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const item = await prisma.timeTable.create({ data: body });
    return NextResponse.json(item);
  } catch (err: any) {
    console.error('Failed to create timetable:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

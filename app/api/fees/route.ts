import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get fees (student access, no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const program = searchParams.get('program');
    const year = searchParams.get('year');
    const semester = searchParams.get('semester');

    const where: any = {};
    if (program) {
      where.programName = { contains: program };
    }
    if (year) {
      where.academicYear = year;
    }
    if (semester) {
      where.yearOrSemester = { contains: semester };
    }

    const fees = await prisma.fee.findMany({
      where,
      orderBy: [{ programName: 'asc' }, { academicYear: 'asc' }, { yearOrSemester: 'asc' }],
    });

    return NextResponse.json(fees);
  } catch (error) {
    console.error('Fees GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


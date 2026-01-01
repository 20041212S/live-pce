import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - List all fees
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const program = searchParams.get('program');
    const year = searchParams.get('year');

    const where: any = {};
    if (program) {
      where.programName = { contains: program, mode: 'insensitive' };
    }
    if (year) {
      where.academicYear = year;
    }

    const fees = await prisma.fee.findMany({
      where,
      orderBy: [{ programName: 'asc' }, { academicYear: 'asc' }],
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

// POST - Create new fee
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { programName, academicYear, yearOrSemester, category, amount, currency } = body;

    if (!programName || !academicYear || !yearOrSemester || !category || !amount) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const fee = await prisma.fee.create({
      data: {
        programName,
        academicYear,
        yearOrSemester,
        category,
        amount: parseFloat(amount),
        currency: currency || 'INR',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.userId,
        action: 'FEE_CREATE',
        entityType: 'Fee',
        entityId: fee.id,
        severity: 'INFO',
      },
    });

    return NextResponse.json(fee);
  } catch (error) {
    console.error('Fees POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


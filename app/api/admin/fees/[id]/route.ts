import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PUT - Update fee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { programName, academicYear, yearOrSemester, category, amount, currency } = body;

    const fee = await prisma.fee.update({
      where: { id },
      data: {
        programName,
        academicYear,
        yearOrSemester,
        category,
        amount: amount ? parseFloat(amount) : undefined,
        currency,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.userId,
        action: 'FEE_UPDATE',
        entityType: 'Fee',
        entityId: fee.id,
        severity: 'INFO',
      },
    });

    return NextResponse.json(fee);
  } catch (error) {
    console.error('Fee PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete fee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.fee.delete({
      where: { id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.userId,
        action: 'FEE_DELETE',
        entityType: 'Fee',
        entityId: id,
        severity: 'WARNING',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fee DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


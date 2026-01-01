import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// DELETE - Delete a client user
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

    // Check if user exists
    const clientUser = await prisma.clientUser.findUnique({
      where: { id },
    });

    if (!clientUser) {
      return NextResponse.json(
        { error: 'Client user not found' },
        { status: 404 }
      );
    }

    // Delete the client user
    await prisma.clientUser.delete({
      where: { id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.userId,
        action: 'CLIENT_USER_DELETE',
        entityType: 'ClientUser',
        entityId: id,
        severity: 'INFO',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Client user DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}




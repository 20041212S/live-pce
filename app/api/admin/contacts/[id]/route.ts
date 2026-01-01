import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PUT - Update contact
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
    const { name, department, designation, email, phone, category, priority } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: name.trim(),
        department: department?.trim() || null,
        designation: designation?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        category: category?.trim() || null,
        priority: priority ? parseInt(priority) : 0,
      },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.userId,
          action: 'CONTACT_UPDATE',
          entityType: 'Contact',
          entityId: contact.id,
          severity: 'INFO',
        },
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error('Contact PUT error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete contact
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
    await prisma.contact.delete({
      where: { id },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.userId,
          action: 'CONTACT_DELETE',
          entityType: 'Contact',
          entityId: id,
          severity: 'WARNING',
        },
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contact DELETE error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


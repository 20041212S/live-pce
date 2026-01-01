import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - List all contacts
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contacts = await prisma.contact.findMany({
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Contacts GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new contact
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, department, designation, email, phone, category, priority } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
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
          action: 'CONTACT_CREATE',
          entityType: 'Contact',
          entityId: contact.id,
          severity: 'INFO',
        },
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    console.error('Contacts POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


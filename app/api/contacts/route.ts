import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get contacts (student access, no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json(contacts);
  } catch (error: any) {
    console.error('Contacts GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List conversations for the logged-in client user
export async function GET(request: NextRequest) {
  try {
    // Get clientUserId from query parameter or header
    const { searchParams } = new URL(request.url);
    const clientUserId = searchParams.get('clientUserId');

    if (!clientUserId) {
      return NextResponse.json(
        { error: 'Client user ID is required' },
        { status: 400 }
      );
    }

    // Only return conversations for this specific client user
    const conversations = await prisma.conversation.findMany({
      where: {
        clientUserId: clientUserId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Conversations GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new conversation for the logged-in client user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, clientUserId } = body;

    if (!clientUserId) {
      return NextResponse.json(
        { error: 'Client user ID is required' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        title: title || 'New Conversation',
        clientUserId: clientUserId,
      },
    });

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error('Conversations POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

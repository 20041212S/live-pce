import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get conversation with messages (verify it belongs to the client user)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const clientUserId = searchParams.get('clientUserId');

    if (!id) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    if (!clientUserId) {
      return NextResponse.json(
        { error: 'Client user ID is required' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify the conversation belongs to this client user
    if (conversation.clientUserId !== clientUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: Conversation does not belong to this user' },
        { status: 403 }
      );
    }

    // Parse images from JSON string for each message
    const conversationWithParsedImages = {
      ...conversation,
      messages: conversation.messages.map((msg: any) => ({
        ...msg,
        images: msg.images ? (() => {
          try {
            const parsed = JSON.parse(msg.images);
            return Array.isArray(parsed) ? parsed : null;
          } catch {
            return null;
          }
        })() : null,
      })),
    };

    return NextResponse.json(conversationWithParsedImages);
  } catch (error: any) {
    console.error('Conversation GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a conversation and its messages (verify ownership)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const clientUserId = searchParams.get('clientUserId');

    if (!id) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    if (!clientUserId) {
      return NextResponse.json(
        { error: 'Client user ID is required' },
        { status: 400 }
      );
    }

    // First verify the conversation belongs to this user
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.clientUserId !== clientUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: Conversation does not belong to this user' },
        { status: 403 }
      );
    }

    // Attempt delete; cascade takes care of related messages
    await prisma.conversation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Conversation DELETE error:', error);
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      meta: error?.meta,
    });

    // Handle not found explicitly
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


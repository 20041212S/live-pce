import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { learnFromKnowledgeBase, ensureInitialized } from '@/lib/learningEngine';

// PUT - Update knowledge entry
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
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { source, type, name, text, imageUrl, imageDescription } = body;

    if (!source || !type || !name || !text) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const knowledge = await prisma.knowledge.update({
      where: { id },
      data: {
        source: source.trim(),
        type: type.trim(),
        name: name.trim(),
        text: text.trim(),
        imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : null,
        imageDescription: imageDescription && imageDescription.trim() ? imageDescription.trim() : null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.userId,
        action: 'KNOWLEDGE_UPDATE',
        entityType: 'Knowledge',
        entityId: knowledge.id,
        severity: 'INFO',
      },
    });

    // Ensure learning engine is ready, then learn from updated knowledge (async, don't wait)
    ensureInitialized().then(() => {
      learnFromKnowledgeBase().catch(err => {
        console.error('Error learning from updated knowledge:', err);
      });
    }).catch(() => {
      // If initialization fails, still try to learn
      learnFromKnowledgeBase().catch(err => {
        console.error('Error learning from updated knowledge:', err);
      });
    });

    return NextResponse.json(knowledge);
  } catch (error: any) {
    console.error('Knowledge PUT error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    
    // Ensure we always return valid JSON
    const errorMessage = error?.message || 'Internal server error';
    return NextResponse.json(
      { 
        error: errorMessage,
        code: error?.code || 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete knowledge entry
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

    await prisma.knowledge.delete({
      where: { id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.userId,
        action: 'KNOWLEDGE_DELETE',
        entityType: 'Knowledge',
        entityId: id,
        severity: 'INFO',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Knowledge DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


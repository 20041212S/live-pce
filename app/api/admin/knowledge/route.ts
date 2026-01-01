import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { learnFromKnowledgeBase, ensureInitialized } from '@/lib/learningEngine';

// GET - List all knowledge entries
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';

    let where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { text: { contains: search } },
        { source: { contains: search } },
      ];
    }
    
    if (type) {
      where.type = type;
    }

    const knowledge = await prisma.knowledge.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(knowledge);
  } catch (error) {
    console.error('Knowledge GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new knowledge entry
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const knowledge = await prisma.knowledge.create({
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
        action: 'KNOWLEDGE_CREATE',
        entityType: 'Knowledge',
        entityId: knowledge.id,
        severity: 'INFO',
      },
    });

    // Ensure learning engine is ready, then learn from new knowledge (async, don't wait)
    ensureInitialized().then(() => {
      learnFromKnowledgeBase().catch(err => {
        console.error('Error learning from new knowledge:', err);
      });
    }).catch(() => {
      // If initialization fails, still try to learn
      learnFromKnowledgeBase().catch(err => {
        console.error('Error learning from new knowledge:', err);
      });
    });

    return NextResponse.json(knowledge, { status: 201 });
  } catch (error: any) {
    console.error('Knowledge POST error:', error);
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


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - List all academic PDFs (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if academicPdf model exists
    if (!prisma.academicPdf) {
      console.error('Prisma client does not have academicPdf model. Please run: npx prisma generate');
      return NextResponse.json(
        { error: 'Database model not available. Please restart the server.' },
        { status: 500 }
      );
    }

    const academicPdfs = await prisma.academicPdf.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(academicPdfs);
  } catch (error: any) {
    console.error('Academic PDFs GET error:', error);
    console.error('Error details:', error?.message, error?.stack);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new academic PDF entry
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, semester, subject, category, fileUrl } = body;

    if (!title || !fileUrl) {
      return NextResponse.json(
        { error: 'Title and file URL are required' },
        { status: 400 }
      );
    }

    // Check if academicPdf model exists
    if (!prisma.academicPdf) {
      console.error('Prisma client does not have academicPdf model. Please run: npx prisma generate');
      return NextResponse.json(
        { error: 'Database model not available. Please restart the server.' },
        { status: 500 }
      );
    }

    const academicPdf = await prisma.academicPdf.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        semester: semester?.trim() || null,
        subject: subject?.trim() || null,
        category: category?.trim() || null,
        fileUrl: fileUrl.trim(),
        uploadedBy: user.userId || null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.userId,
        action: 'ACADEMIC_PDF_CREATE',
        entityType: 'AcademicPdf',
        entityId: academicPdf.id,
        severity: 'INFO',
      },
    });

    return NextResponse.json(academicPdf, { status: 201 });
  } catch (error: any) {
    console.error('Academic PDF POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


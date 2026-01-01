import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

// PUT - Update academic PDF
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
    const { title, description, semester, subject, category, fileUrl } = body;

    if (!title || !fileUrl) {
      return NextResponse.json(
        { error: 'Title and file URL are required' },
        { status: 400 }
      );
    }

    const academicPdf = await prisma.academicPdf.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        semester: semester?.trim() || null,
        subject: subject?.trim() || null,
        category: category?.trim() || null,
        fileUrl: fileUrl.trim(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.userId,
        action: 'ACADEMIC_PDF_UPDATE',
        entityType: 'AcademicPdf',
        entityId: academicPdf.id,
        severity: 'INFO',
      },
    });

    return NextResponse.json(academicPdf);
  } catch (error: any) {
    console.error('Academic PDF PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete academic PDF
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

    // Get PDF info before deletion
    const academicPdf = await prisma.academicPdf.findUnique({
      where: { id },
    });

    if (!academicPdf) {
      return NextResponse.json(
        { error: 'Academic PDF not found' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), 'public', academicPdf.fileUrl);
      await unlink(filePath);
    } catch (fileError) {
      // File might not exist, continue with database deletion
      console.warn('File deletion warning:', fileError);
    }

    // Delete from database
    await prisma.academicPdf.delete({
      where: { id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.userId,
        action: 'ACADEMIC_PDF_DELETE',
        entityType: 'AcademicPdf',
        entityId: id,
        severity: 'INFO',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Academic PDF DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


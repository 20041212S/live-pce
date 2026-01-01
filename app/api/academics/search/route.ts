import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Type helper to extract the type from Prisma query result
type AcademicPdfType = Awaited<ReturnType<typeof prisma.academicPdf.findMany>>[number];

// GET - Search academic PDFs (student access)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const semester = searchParams.get('semester');
    const subject = searchParams.get('subject');
    const category = searchParams.get('category');
    const keyword = searchParams.get('keyword');

    // Build query dynamically
    const where: any = {};

    // If no filters provided, return empty list (do not return all PDFs)
    if (!semester && !subject && !category && !keyword) {
      return NextResponse.json([]);
    }

    // Apply filters with AND logic
    // Note: SQLite doesn't support case-insensitive mode, but contains works case-sensitively
    // For better UX, we'll do case-insensitive filtering in memory after fetching
    if (semester) {
      where.semester = { contains: semester };
    }

    if (subject) {
      where.subject = { contains: subject };
    }

    if (category) {
      where.category = { contains: category };
    }

    // Keyword search across title, description, and subject
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
        { subject: { contains: keyword } },
      ];

      // If other filters exist, combine with AND
      if (semester || subject || category) {
        const andConditions: any[] = [];
        
        if (semester) {
          andConditions.push({ semester: { contains: semester } });
        }
        if (subject) {
          andConditions.push({ subject: { contains: subject } });
        }
        if (category) {
          andConditions.push({ category: { contains: category } });
        }

        where.AND = [
          { OR: where.OR },
          ...andConditions,
        ];
        delete where.OR;
      }
    }

    let academicPdfs: AcademicPdfType[] = await prisma.academicPdf.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Case-insensitive filtering for SQLite (since it doesn't support mode: 'insensitive')
    const lowerKeyword = keyword?.toLowerCase() || '';
    const lowerSemester = semester?.toLowerCase() || '';
    const lowerSubject = subject?.toLowerCase() || '';
    const lowerCategory = category?.toLowerCase() || '';

    if (lowerKeyword || lowerSemester || lowerSubject || lowerCategory) {
      academicPdfs = academicPdfs.filter((pdf: AcademicPdfType) => {
        if (lowerSemester && !pdf.semester?.toLowerCase().includes(lowerSemester)) {
          return false;
        }
        if (lowerSubject && !pdf.subject?.toLowerCase().includes(lowerSubject)) {
          return false;
        }
        if (lowerCategory && !pdf.category?.toLowerCase().includes(lowerCategory)) {
          return false;
        }
        if (lowerKeyword) {
          const matchesKeyword =
            pdf.title.toLowerCase().includes(lowerKeyword) ||
            pdf.description?.toLowerCase().includes(lowerKeyword) ||
            pdf.subject?.toLowerCase().includes(lowerKeyword);
          if (!matchesKeyword) {
            return false;
          }
        }
        return true;
      });
    }

    return NextResponse.json(academicPdfs);
  } catch (error: any) {
    console.error('Academic PDFs search error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


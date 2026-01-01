import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Type helper to extract the type from Prisma query result
type ClientUserType = Awaited<ReturnType<typeof prisma.clientUser.findMany>>[number];

export async function GET(request: NextRequest) {
  try {
    // Fetch all client users
    const clientUsers: ClientUserType[] = await prisma.clientUser.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Build CSV content
    const csvHeaders = ['id', 'mobile', 'email', 'userType', 'createdAt'];
    const csvRows = clientUsers.map((user: ClientUserType) => [
      user.id,
      user.mobile,
      user.email,
      user.userType,
      user.createdAt.toISOString(),
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="client-users-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error downloading client users CSV:', error);
    return NextResponse.json(
      { error: 'Failed to download CSV', details: error.message },
      { status: 500 }
    );
  }
}

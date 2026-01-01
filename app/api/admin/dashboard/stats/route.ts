import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get counts in parallel
    const [
      totalUsers,
      verifiedUsers,
      totalConversations,
      todayConversations,
      totalMessages,
      totalStaff,
      totalFees,
      totalRooms,
      totalContacts,
      totalAcademicPdfs,
      recentLogins,
    ] = await Promise.all([
      // Total registered users
      prisma.clientUser.count(),
      // Verified users (active users)
      prisma.clientUser.count({ where: { emailVerified: true } }),
      // Total conversations
      prisma.conversation.count(),
      // Today's conversations
      prisma.conversation.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      // Total messages
      prisma.message.count(),
      // Total staff
      prisma.staff.count({ where: { status: 'ACTIVE' } }),
      // Total fees
      prisma.fee.count(),
      // Total rooms
      prisma.room.count(),
      // Total contacts
      prisma.contact.count(),
      // Total academic PDFs
      prisma.academicPdf.count(),
      // Recent login activity (last 10)
      prisma.auditLog.findMany({
        where: {
          action: 'LOGIN',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          actor: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
    ]);

    // Calculate messages today
    const todayMessages = await prisma.message.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get recent conversations (last 5)
    const recentConversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        verified: verifiedUsers,
      },
      conversations: {
        total: totalConversations,
        today: todayConversations,
      },
      messages: {
        total: totalMessages,
        today: todayMessages,
      },
      staff: {
        total: totalStaff,
      },
      fees: {
        total: totalFees,
      },
      rooms: {
        total: totalRooms,
      },
      contacts: {
        total: totalContacts,
      },
      academicPdfs: {
        total: totalAcademicPdfs,
      },
      recentLogins,
      recentConversations,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check permissions
    await requireAuditPermission(organizationId);

    // Build where clause
    const whereClause: any = {
      organizationId,
      OR: [
        { recipientId: session.user.id },
        { createdBy: session.user.id }
      ]
    };

    if (type) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        recipient: {
          select: { id: true, name: true, email: true }
        },
        createdByUser: {
          select: { id: true, name: true, email: true }
        },
        auditRun: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Get total count
    const totalCount = await prisma.notification.count({
      where: whereClause
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        ...whereClause,
        status: 'UNREAD'
      }
    });

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      recipientId, 
      type, 
      title, 
      message, 
      auditRunId, 
      metadata,
      priority = 'MEDIUM',
      channels = ['IN_APP']
    } = await request.json();

    if (!recipientId || !type || !title || !message) {
      return NextResponse.json({ 
        error: 'Recipient ID, type, title, and message are required' 
      }, { status: 400 });
    }

    // Get recipient to check organization
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      include: { organizationUsers: true }
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Check permissions
    const recipientOrgId = recipient.organizationUsers[0]?.organizationId;
    if (!recipientOrgId) {
      return NextResponse.json({ error: 'Recipient not associated with any organization' }, { status: 400 });
    }
    
    await requireAuditPermission(recipientOrgId);

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        recipientId,
        type,
        title,
        message,
        auditRunId,
        metadata: metadata || {},
        priority,
        channels,
        createdBy: session.user.id,
        organizationId: recipientOrgId
      },
      include: {
        recipient: {
          select: { id: true, name: true, email: true }
        },
        auditRun: {
          select: { id: true, name: true }
        }
      }
    });

    // TODO: Send notification through specified channels
    // This would integrate with email services, Slack, Teams, etc.

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

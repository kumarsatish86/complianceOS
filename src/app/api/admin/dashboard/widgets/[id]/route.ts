import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { Session } from 'next-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get widget
    const widget = await prisma.dashboardWidget.findUnique({
      where: { id },
      include: {
        organization: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // Check permissions
    await requireAuditPermission(widget.organizationId);

    return NextResponse.json({ widget });

  } catch (error) {
    console.error('Error fetching widget:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { position, size, config, visibilityRules, isActive } = await request.json();

    // Get existing widget to check permissions
    const existingWidget = await prisma.dashboardWidget.findUnique({
      where: { id },
      include: { organization: true }
    });

    if (!existingWidget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // Check permissions
    await requireAuditPermission(existingWidget.organizationId);

    // Update widget
    const widget = await prisma.dashboardWidget.update({
      where: { id },
      data: {
        position,
        size,
        config,
        visibilityRules,
        isActive,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Log dashboard event
    await prisma.dashboardEvent.create({
      data: {
        organizationId: widget.organizationId,
        eventType: 'USER_ACTION',
        eventData: {
          action: 'WIDGET_UPDATED',
          widgetId: id,
          userId: session.user.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      widget
    });

  } catch (error) {
    console.error('Error updating widget:', error);
    return NextResponse.json(
      { error: 'Failed to update widget' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get existing widget to check permissions
    const existingWidget = await prisma.dashboardWidget.findUnique({
      where: { id },
      include: { organization: true }
    });

    if (!existingWidget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // Check permissions
    await requireAuditPermission(existingWidget.organizationId);

    // Delete widget
    await prisma.dashboardWidget.delete({
      where: { id }
    });

    // Log dashboard event
    await prisma.dashboardEvent.create({
      data: {
        organizationId: existingWidget.organizationId,
        eventType: 'USER_ACTION',
        eventData: {
          action: 'WIDGET_DELETED',
          widgetId: id,
          userId: session.user.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Widget deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting widget:', error);
    return NextResponse.json(
      { error: 'Failed to delete widget' },
      { status: 500 }
    );
  }
}

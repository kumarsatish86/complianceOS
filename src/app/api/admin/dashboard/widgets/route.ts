import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { WidgetType, WidgetSize } from '@prisma/client';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');
    const widgetType = searchParams.get('widgetType') as WidgetType | null;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check permissions
    await requireAuditPermission(organizationId);

    // Build where clause
    const whereClause: Record<string, unknown> = {
      organizationId,
      isActive: true
    };

    if (userId) {
      whereClause.OR = [
        { userId: userId },
        { userId: null } // Organization-wide widgets
      ];
    }

    if (widgetType) {
      whereClause.widgetType = widgetType;
    }

    // Get widgets
    const widgets = await prisma.dashboardWidget.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { userId: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({ widgets });

  } catch (error) {
    console.error('Error fetching dashboard widgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard widgets' },
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
      organizationId,
      userId,
      widgetType,
      position,
      size = 'MEDIUM',
      config = {},
      visibilityRules = null
    } = await request.json();

    if (!organizationId || !widgetType) {
      return NextResponse.json({
        error: 'Organization ID and widget type are required'
      }, { status: 400 });
    }

    // Check permissions
    await requireAuditPermission(organizationId);

    // Validate widget type
    if (!Object.values(WidgetType).includes(widgetType)) {
      return NextResponse.json({
        error: 'Invalid widget type'
      }, { status: 400 });
    }

    // Create widget
    const widget = await prisma.dashboardWidget.create({
      data: {
        organizationId,
        userId: userId || null,
        widgetType,
        position: position || { x: 0, y: 0, width: 4, height: 3 },
        size: size as WidgetSize,
        config,
        visibilityRules
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
        organizationId,
        eventType: 'USER_ACTION',
        eventData: {
          action: 'WIDGET_CREATED',
          widgetType,
          userId: session.user.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      widget
    });

  } catch (error) {
    console.error('Error creating dashboard widget:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard widget' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { widgets } = await request.json();

    if (!Array.isArray(widgets)) {
      return NextResponse.json({
        error: 'Widgets array is required'
      }, { status: 400 });
    }

    const updatedWidgets = [];

    for (const widgetUpdate of widgets) {
      const { id, position, size, config, visibilityRules } = widgetUpdate;

      if (!id) {
        continue;
      }

      // Get existing widget to check permissions
      const existingWidget = await prisma.dashboardWidget.findUnique({
        where: { id },
        include: { organization: true }
      });

      if (!existingWidget) {
        continue;
      }

      // Check permissions
      await requireAuditPermission(existingWidget.organizationId);

      // Update widget
      const updatedWidget = await prisma.dashboardWidget.update({
        where: { id },
        data: {
          position,
          size,
          config,
          visibilityRules,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      updatedWidgets.push(updatedWidget);
    }

    // Log dashboard event
    if (updatedWidgets.length > 0) {
      await prisma.dashboardEvent.create({
        data: {
          organizationId: updatedWidgets[0].organizationId,
          eventType: 'USER_ACTION',
          eventData: {
            action: 'DASHBOARD_UPDATED',
            widgetsUpdated: updatedWidgets.length,
            userId: session.user.id
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      widgets: updatedWidgets
    });

  } catch (error) {
    console.error('Error updating dashboard widgets:', error);
    return NextResponse.json(
      { error: 'Failed to update dashboard widgets' },
      { status: 500 }
    );
  }
}

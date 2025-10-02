import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { Session } from 'next-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; exportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: auditRunId, exportId } = await params;

    // Get the export record
    const auditPackExport = await prisma.auditPackExport.findUnique({
      where: { id: exportId },
      include: {
        auditRun: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!auditPackExport) {
      return NextResponse.json({ error: 'Export not found' }, { status: 404 });
    }

    // Check permissions
    await requireAuditPermission(auditPackExport.auditRun.organizationId);

    // Log download activity
    await prisma.auditRunActivity.create({
      data: {
        auditRunId: auditRunId,
        activityType: 'PACKAGE_EXPORTED',
        performedBy: session.user.id,
        targetEntity: 'audit_pack_download',
        newValue: JSON.stringify({
          exportId,
          fileName: auditPackExport.fileId,
          format: auditPackExport.format
        })
      }
    });

    // For now, return the export metadata
    // In a real implementation, this would serve the actual file
    return NextResponse.json({
      success: true,
      export: {
        id: auditPackExport.id,
        fileName: auditPackExport.fileId,
        format: auditPackExport.format,
        exportScope: auditPackExport.exportScope,
        checksum: auditPackExport.checksum,
        createdAt: auditPackExport.createdAt,
        immutableFlag: auditPackExport.immutableFlag
      },
      downloadUrl: `/api/admin/audit-runs/${auditRunId}/export/${exportId}/file`
    });

  } catch (error) {
    console.error('Error downloading audit pack:', error);
    return NextResponse.json(
      { error: 'Failed to download audit pack' },
      { status: 500 }
    );
  }
}

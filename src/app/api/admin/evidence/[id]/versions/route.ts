import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireEvidencePermission, canModifyEvidence } from '@/lib/evidence-permissions';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';
import { Session } from 'next-auth';

// GET /api/admin/evidence/[id]/versions - Get evidence versions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: evidenceId } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check read permission
    await requireEvidencePermission(organizationId, 'evidence', 'read');

    // Get evidence versions
    const versions = await prisma.evidenceVersion.findMany({
      where: {
        evidenceId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        version: 'desc',
      },
    });

    return NextResponse.json({ versions });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching evidence versions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/evidence/[id]/versions - Create new evidence version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: evidenceId } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string;
    const changeSummary = formData.get('changeSummary') as string;

    if (!file || !organizationId || !changeSummary) {
      return NextResponse.json({
        error: 'File, organization ID, and change summary are required'
      }, { status: 400 });
    }

    // Check if user can modify this evidence
    const canModify = await canModifyEvidence(organizationId, evidenceId);
    if (!canModify) {
      return NextResponse.json({ error: 'Cannot modify this evidence' }, { status: 403 });
    }

    // Get current evidence
    const evidence = await prisma.evidence.findFirst({
      where: {
        id: evidenceId,
        organizationId,
      },
    });

    if (!evidence) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File size exceeds 50MB limit'
      }, { status: 400 });
    }

    // Generate file hash for integrity verification
    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = createHash('sha256').update(buffer).digest('hex');

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', 'evidence');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${hash.substring(0, 8)}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // Save file to disk
    await writeFile(filePath, buffer);

    // Get next version number
    const latestVersion = await prisma.evidenceVersion.findFirst({
      where: { evidenceId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    // Create new version
    const newVersion = await prisma.evidenceVersion.create({
      data: {
        evidenceId,
        fileId: fileName,
        hash,
        uploadedBy: session.user.id,
        changeSummary,
        version: nextVersion,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update evidence with new file
    await prisma.evidence.update({
      where: { id: evidenceId },
      data: {
        fileId: fileName,
        hash,
        version: nextVersion,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      version: newVersion,
      message: 'New version created successfully',
    }, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating evidence version:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EvidenceType, EvidenceStatus } from '@prisma/client';
import { requireEvidencePermission } from '@/lib/evidence-permissions';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';
import { Session } from 'next-auth';

// POST /api/admin/evidence/upload - Upload evidence file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as EvidenceType;
    const expiryDate = formData.get('expiryDate') as string;
    const tags = formData.get('tags') as string; // JSON string of tag IDs

    if (!file || !organizationId || !title || !type) {
      return NextResponse.json({
        error: 'File, organization ID, title, and type are required'
      }, { status: 400 });
    }

    // Check create permission
    await requireEvidencePermission(organizationId, 'evidence', 'create');

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File size exceeds 50MB limit'
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'File type not allowed'
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

    // Create evidence record
    const evidence = await prisma.evidence.create({
      data: {
        organizationId,
        title,
        description,
        fileId: fileName,
        type,
        status: EvidenceStatus.DRAFT,
        addedBy: session.user.id,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        hash,
        metadata: {
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        },
        tagLinks: {
          create: JSON.parse(tags || '[]').map((tagId: string) => ({ tagId })),
        },
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tagLinks: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      evidence,
      message: 'File uploaded successfully',
    }, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error uploading evidence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { QuestionnaireExportService } from '@/lib/questionnaire-export-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { format, includeAnswers, includeEvidence, includeMetadata, includeReviewHistory, template, customFields } = body;

    const exportOptions = {
      format: format || 'EXCEL',
      includeAnswers: includeAnswers !== false,
      includeEvidence: includeEvidence === true,
      includeMetadata: includeMetadata === true,
      includeReviewHistory: includeReviewHistory === true,
      template,
      customFields: customFields || []
    };

    const exportResult = await QuestionnaireExportService.exportQuestionnaire(
      id,
      session.user.id,
      exportOptions
    );

    return NextResponse.json({
      exportId: exportResult.fileId,
      fileName: exportResult.fileName,
      downloadUrl: exportResult.downloadUrl,
      expiresAt: exportResult.expiresAt,
      message: 'Export created successfully'
    });
  } catch (error) {
    console.error('Error creating export:', error);
    return NextResponse.json(
      { error: 'Failed to create export' },
      { status: 500 }
    );
  }
}

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
    const exportHistory = await QuestionnaireExportService.getExportHistory(id);
    return NextResponse.json({ exports: exportHistory });
  } catch (error) {
    console.error('Error fetching export history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export history' },
      { status: 500 }
    );
  }
}

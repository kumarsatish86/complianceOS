import { NextRequest, NextResponse } from 'next/server';
import { QuestionnaireService } from '@/lib/questionnaire-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'org-123'; // Replace with actual org ID
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const summaries = await QuestionnaireService.getQuestionnaireSummaries(
      organizationId,
      status || undefined,
      assignedTo || undefined,
      limit,
      offset
    );

    return NextResponse.json({ questionnaires: summaries });
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaires' },
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientName = formData.get('clientName') as string;
    const dueDate = formData.get('dueDate') as string;
    const priority = parseInt(formData.get('priority') as string) || 5;
    const organizationId = formData.get('organizationId') as string || 'org-123'; // Replace with actual org ID

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const questionnaireId = await QuestionnaireService.createFromDocument(
      fileBuffer,
      file.name,
      organizationId,
      session.user.id,
      clientName || undefined,
      dueDate ? new Date(dueDate) : undefined,
      priority
    );

    return NextResponse.json({ 
      questionnaireId,
      message: 'Questionnaire created successfully' 
    });
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to create questionnaire' },
      { status: 500 }
    );
  }
}

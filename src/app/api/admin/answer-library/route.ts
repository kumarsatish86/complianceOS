import { NextRequest, NextResponse } from 'next/server';
import { AnswerLibraryService } from '@/lib/answer-library-service';
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
    const organizationId = 'org-123'; // Replace with actual org ID
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const entries = await AnswerLibraryService.getEntries(
      organizationId,
      category || undefined,
      search || undefined,
      limit,
      offset
    );

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching answer library entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch answer library entries' },
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

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create':
        const entryId = await AnswerLibraryService.createEntry(
          'org-123', // Replace with actual org ID
          data.category,
          data.subcategory,
          data.keyPhrases,
          data.standardAnswer,
          data.evidenceReferences || [],
          session.user.id,
          data.metadata
        );
        return NextResponse.json({ entryId, message: 'Entry created successfully' });

      case 'import':
        const { imported, errors } = await AnswerLibraryService.importFromCSV(
          'org-123', // Replace with actual org ID
          data.csvData,
          session.user.id
        );
        return NextResponse.json({ 
          imported, 
          errors, 
          message: `Imported ${imported} entries successfully` 
        });

      case 'export':
        const csvData = await AnswerLibraryService.exportToCSV('org-123'); // Replace with actual org ID
        return NextResponse.json({ csvData });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing answer library request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

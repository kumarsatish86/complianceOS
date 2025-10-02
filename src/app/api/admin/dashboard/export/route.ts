import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ExportService, ExportOptions } from '@/lib/export-service';
import { requireAuditPermission } from '@/lib/audit-permissions';
import { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, format, widgetTypes, dateRange, includeCharts } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    if (!format || !['pdf', 'excel', 'csv', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Valid format is required' }, { status: 400 });
    }

    // Check permissions
    await requireAuditPermission(organizationId);

    const options: ExportOptions = {
      format,
      organizationId,
      widgetTypes,
      dateRange: dateRange ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      } : undefined,
      includeCharts
    };

    // Generate export data
    const exportData = await ExportService.generateDashboardExport(options);

    // Generate file based on format
    let fileBuffer: Buffer;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        const csvData = await ExportService.exportToCSV(exportData);
        fileBuffer = Buffer.from(csvData, 'utf-8');
        contentType = 'text/csv';
        filename = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'json':
        const jsonData = await ExportService.exportToJSON(exportData);
        fileBuffer = Buffer.from(jsonData, 'utf-8');
        contentType = 'application/json';
        filename = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
        break;
      
      case 'excel':
        fileBuffer = await ExportService.exportToExcel(exportData);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `dashboard-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      
      case 'pdf':
        fileBuffer = await ExportService.exportToPDF(exportData);
        contentType = 'application/pdf';
        filename = `dashboard-export-${new Date().toISOString().split('T')[0]}.pdf`;
        break;
      
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    // Return file download
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error exporting dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to export dashboard' },
      { status: 500 }
    );
  }
}

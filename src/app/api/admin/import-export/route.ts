/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ImportType, } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { Session } from 'next-auth';

// GET /api/admin/import-export/template - Download CSV template
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ImportType;
    const organizationId = searchParams.get('organizationId');

    if (!type || !organizationId) {
      return NextResponse.json({ 
        error: 'Type and organization ID are required' 
      }, { status: 400 });
    }

    let headers: string[] = [];
    let sampleData: unknown[] = [];

    switch (type) {
      case 'ASSETS':
        headers = [
          'name', 'type', 'hostname', 'serial', 'assetTag', 'ownerEmail', 
          'department', 'location', 'status', 'purchaseDate', 'warrantyEnd', 
          'vendorName', 'notes'
        ];
        sampleData = [
          {
            name: 'Dell Laptop 001',
            type: 'LAPTOP',
            hostname: 'dell-001.company.com',
            serial: 'ABC123456',
            assetTag: 'LT-001',
            ownerEmail: 'john.doe@company.com',
            department: 'IT',
            location: 'Office Floor 1',
            status: 'IN_USE',
            purchaseDate: '2024-01-15',
            warrantyEnd: '2027-01-15',
            vendorName: 'Dell Technologies',
            notes: 'Standard issue laptop'
          }
        ];
        break;

      case 'VENDORS':
        headers = [
          'name', 'contact', 'email', 'phone', 'address', 'website', 
          'riskRating', 'notes'
        ];
        sampleData = [
          {
            name: 'Dell Technologies',
            contact: 'John Smith',
            email: 'sales@dell.com',
            phone: '+1-800-123-4567',
            address: '123 Dell Way, Round Rock, TX 78682',
            website: 'https://www.dell.com',
            riskRating: 'LOW',
            notes: 'Primary hardware vendor'
          }
        ];
        break;

      case 'LICENSES':
        headers = [
          'softwareName', 'softwareVersion', 'licenseKey', 'seatsTotal', 
          'purchaseDate', 'expiryDate', 'renewalVendorName', 'notes'
        ];
        sampleData = [
          {
            softwareName: 'Microsoft Office 365',
            softwareVersion: '2024',
            licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX',
            seatsTotal: '50',
            purchaseDate: '2024-01-01',
            expiryDate: '2025-01-01',
            renewalVendorName: 'Microsoft',
            notes: 'Annual subscription'
          }
        ];
        break;

      case 'ACCESS_REGISTRY':
        headers = [
          'userEmail', 'systemName', 'systemType', 'accessLevel', 
          'justification', 'reviewDueDate', 'notes'
        ];
        sampleData = [
          {
            userEmail: 'john.doe@company.com',
            systemName: 'Salesforce CRM',
            systemType: 'SAAS',
            accessLevel: 'Admin',
            justification: 'Sales team lead requires admin access',
            reviewDueDate: '2024-12-31',
            notes: 'Quarterly review required'
          }
        ];
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid import type' 
        }, { status: 400 });
    }

    const csvContent = stringify([headers, ...sampleData], {
      header: true,
      columns: headers
    });

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type.toLowerCase()}_template.csv"`
      }
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/import-export/import - Import CSV data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as ImportType;
    const organizationId = formData.get('organizationId') as string;

    if (!file || !type || !organizationId) {
      return NextResponse.json({ 
        error: 'File, type, and organization ID are required' 
      }, { status: 400 });
    }

    const fileContent = await file.text();
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Create import job
    const importJob = await prisma.importJob.create({
      data: {
        organizationId,
        fileName: file.name,
        filePath: '', // In production, save file to storage
        type,
        status: 'PENDING',
        totalRows: records.length,
        createdBy: session.user.id
      }
    });

    // Process import in background (in production, use a queue system)
    processImport(importJob.id, records, type, organizationId, session.user.id);

    return NextResponse.json({
      importJobId: importJob.id,
      message: 'Import job created successfully',
      totalRows: records.length
    });

  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Background processing function (simplified version)
async function processImport(
  importJobId: string, 
  records: unknown[], 
  type: ImportType, 
  organizationId: string, 
  userId: string
) {
  try {
    await prisma.importJob.update({
      where: { id: importJobId },
      data: { status: 'IN_PROGRESS' }
    });

    let processedRows = 0;
    let errorRows = 0;
    const errors: unknown[] = [];

    for (const [index, record] of records.entries()) {
      try {
        switch (type) {
          case 'ASSETS':
            await processAssetRecord(record, organizationId, userId);
            break;
          case 'VENDORS':
            await processVendorRecord(record, organizationId);
            break;
          case 'LICENSES':
            await processLicenseRecord(record, organizationId);
            break;
          case 'ACCESS_REGISTRY':
            await processAccessRecord(record, organizationId);
            break;
        }
        processedRows++;
      } catch (error) {
        errorRows++;
        errors.push({
          row: index + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: record
        });
      }
    }

    await prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: errorRows > 0 ? 'COMPLETED' : 'COMPLETED',
        processedRows,
        errorRows,
        errors: JSON.stringify(errors),
        completedAt: new Date()
      }
    });

  } catch (error) {
    await prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: 'FAILED',
        errors: JSON.stringify([{ error: error instanceof Error ? error.message : 'Unknown error' }]),
        completedAt: new Date()
      }
    });
  }
}

// Helper functions for processing different record types
async function processAssetRecord(record: any, organizationId: string, userId: string) {
  const assetData: any = {
    organizationId,
    name: record.name,
    type: record.type as unknown,
    hostname: record.hostname,
    serial: record.serial,
    assetTag: record.assetTag,
    department: record.department,
    location: record.location,
    status: record.status as unknown || 'IN_USE',
    purchaseDate: record.purchaseDate ? new Date(record.purchaseDate) : null,
    warrantyEnd: record.warrantyEnd ? new Date(record.warrantyEnd) : null,
    notes: record.notes,
    createdBy: userId,
    updatedBy: userId
  };

  // Handle vendor lookup
  if (record.vendorName) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        organizationId,
        name: record.vendorName
      }
    });
    if (vendor) {
      assetData.vendorId = vendor.id;
    }
  }

  // Handle owner lookup
  if (record.ownerEmail) {
    const user = await prisma.user.findFirst({
      where: { email: record.ownerEmail }
    });
    if (user) {
      assetData.ownerUserId = user.id;
    }
  }

  await prisma.asset.create({ data: assetData });
}

async function processVendorRecord(record: any, organizationId: string) {
  await prisma.vendor.create({
    data: {
      organizationId,
      name: record.name,
      contact: record.contact,
      email: record.email,
      phone: record.phone,
      address: record.address,
      website: record.website,
      riskRating: (record.riskRating as any) || 'MEDIUM',
      notes: record.notes
    }
  });
}

async function processLicenseRecord(record: any, organizationId: string) {
  // Find or create software entry
  let software = await prisma.softwareCatalog.findFirst({
    where: {
      organizationId,
      name: record.softwareName,
      version: record.softwareVersion
    }
  });

  if (!software) {
    software = await prisma.softwareCatalog.create({
      data: {
        organizationId,
        name: record.softwareName,
        version: record.softwareVersion,
        approvalStatus: 'APPROVED'
      }
    });
  }

  // Handle renewal vendor lookup
  let renewalVendorId = null;
  if (record.renewalVendorName) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        organizationId,
        name: record.renewalVendorName
      }
    });
    if (vendor) {
      renewalVendorId = vendor.id;
    }
  }

  await prisma.license.create({
    data: {
      organizationId,
      softwareId: software.id,
      licenseKey: record.licenseKey,
      seatsTotal: parseInt(record.seatsTotal),
      seatsUsed: 0,
      purchaseDate: record.purchaseDate ? new Date(record.purchaseDate) : null,
      expiryDate: record.expiryDate ? new Date(record.expiryDate) : null,
      renewalVendorId,
      notes: record.notes
    }
  });
}

async function processAccessRecord(record: any, organizationId: string) {
  // Find user
  const user = await prisma.user.findFirst({
    where: { email: record.userEmail }
  });

  if (!user) {
    throw new Error(`User not found: ${record.userEmail}`);
  }

  await prisma.userAccessRegistry.create({
    data: {
      organizationId,
      userId: user.id,
      systemName: record.systemName,
      systemType: record.systemType as any,
      accessLevel: record.accessLevel,
      justification: record.justification,
      reviewDueDate: record.reviewDueDate ? new Date(record.reviewDueDate) : null,
      notes: record.notes,
      status: 'ACTIVE'
    }
  });
}

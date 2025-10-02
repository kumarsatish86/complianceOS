import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAssetPermission } from '@/lib/asset-permissions';
import { AssetType, AssetStatus, RiskLevel, AccessStatus } from '@prisma/client';
import { Session } from 'next-auth';

// GET /api/admin/reports/assets - Asset inventory report
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const reportType = searchParams.get('type') || 'inventory';
    const format = searchParams.get('format') || 'json';

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check report permission
    const hasReportPermission = await checkAssetPermission(organizationId, 'reports', 'view');
    if (!hasReportPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    let reportData: unknown = {};

    switch (reportType) {
      case 'inventory':
        reportData = await generateAssetInventoryReport(organizationId);
        break;
      case 'warranty':
        reportData = await generateWarrantyReport(organizationId);
        break;
      case 'assignment':
        reportData = await generateAssignmentReport(organizationId);
        break;
      case 'disposal':
        reportData = await generateDisposalReport(organizationId);
        break;
      case 'license-compliance':
        reportData = await generateLicenseComplianceReport(organizationId);
        break;
      case 'vendor-contracts':
        reportData = await generateVendorContractsReport(organizationId);
        break;
      case 'access-review':
        reportData = await generateAccessReviewReport(organizationId);
        break;
      case 'compliance-summary':
        reportData = await generateComplianceSummaryReport(organizationId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (format === 'csv') {
      const csvContent = convertToCSV(reportData);
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}_report.csv"`
        }
      });
    }

    return NextResponse.json({
      reportType,
      generatedAt: new Date().toISOString(),
      organizationId,
      data: reportData
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Asset Inventory Report
async function generateAssetInventoryReport(organizationId: string) {
  const assets = await prisma.asset.findMany({
    where: { organizationId },
    include: {
      owner: {
        select: { id: true, name: true, email: true }
      },
      vendor: {
        select: { id: true, name: true }
      },
      tagLinks: {
        include: {
          tag: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  const summary = {
    totalAssets: assets.length,
    byType: {} as Record<AssetType, number>,
    byStatus: {} as Record<AssetStatus, number>,
    byDepartment: {} as Record<string, number>,
    warrantyExpiring: 0,
    totalValue: 0
  };

  // Calculate summary statistics
  assets.forEach(asset => {
    // Count by type
    summary.byType[asset.type] = (summary.byType[asset.type] || 0) + 1;
    
    // Count by status
    summary.byStatus[asset.status] = (summary.byStatus[asset.status] || 0) + 1;
    
    // Count by department
    if (asset.department) {
      summary.byDepartment[asset.department] = (summary.byDepartment[asset.department] || 0) + 1;
    }
    
    // Check warranty expiry
    if (asset.warrantyEnd) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      if (new Date(asset.warrantyEnd) <= thirtyDaysFromNow) {
        summary.warrantyExpiring++;
      }
    }
  });

  return {
    summary,
    assets: assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      status: asset.status,
      assetTag: asset.assetTag,
      serial: asset.serial,
      hostname: asset.hostname,
      owner: asset.owner ? {
        name: asset.owner.name,
        email: asset.owner.email
      } : null,
      department: asset.department,
      location: asset.location,
      vendor: asset.vendor?.name,
      purchaseDate: asset.purchaseDate,
      warrantyEnd: asset.warrantyEnd,
      tags: asset.tagLinks.map(link => link.tag.name),
      createdAt: asset.createdAt
    }))
  };
}

// Warranty Expiry Report
async function generateWarrantyReport(organizationId: string) {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const assets = await prisma.asset.findMany({
    where: {
      organizationId,
      warrantyEnd: {
        not: null,
        lte: ninetyDaysFromNow,
        gte: new Date()
      }
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true }
      },
      vendor: {
        select: { id: true, name: true, contact: true, email: true, phone: true }
      }
    },
    orderBy: { warrantyEnd: 'asc' }
  });

  const summary = {
    totalExpiring: assets.length,
    expiring30Days: assets.filter(a => a.warrantyEnd && new Date(a.warrantyEnd) <= thirtyDaysFromNow).length,
    expiring60Days: assets.filter(a => {
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
      return a.warrantyEnd && new Date(a.warrantyEnd) <= sixtyDaysFromNow && new Date(a.warrantyEnd) > thirtyDaysFromNow;
    }).length,
    expiring90Days: assets.filter(a => {
      return a.warrantyEnd && new Date(a.warrantyEnd) <= ninetyDaysFromNow && new Date(a.warrantyEnd) > new Date();
    }).length
  };

  return {
    summary,
    assets: assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      assetTag: asset.assetTag,
      serial: asset.serial,
      owner: asset.owner ? {
        name: asset.owner.name,
        email: asset.owner.email
      } : null,
      vendor: asset.vendor ? {
        name: asset.vendor.name,
        contact: asset.vendor.contact,
        email: asset.vendor.email,
        phone: asset.vendor.phone
      } : null,
      warrantyEnd: asset.warrantyEnd,
      daysUntilExpiry: asset.warrantyEnd ? 
        Math.ceil((new Date(asset.warrantyEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
    }))
  };
}

// Asset Assignment Report
async function generateAssignmentReport(organizationId: string) {
  const assets = await prisma.asset.findMany({
    where: { organizationId },
    include: {
      owner: {
        select: { id: true, name: true, email: true }
      },
      assignments: {
        include: {
          assignedToUser: {
            select: { id: true, name: true, email: true }
          },
          assignedByUser: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { assignedAt: 'desc' }
      }
    },
    orderBy: { name: 'asc' }
  });

  const summary = {
    totalAssets: assets.length,
    assignedAssets: assets.filter(a => a.owner).length,
    unassignedAssets: assets.filter(a => !a.owner).length,
    acknowledgedAssignments: 0,
    pendingAcknowledgments: 0
  };

  assets.forEach(asset => {
    if (asset.assignments.length > 0) {
      const latestAssignment = asset.assignments[0];
      if (latestAssignment.acknowledgedAt) {
        summary.acknowledgedAssignments++;
      } else {
        summary.pendingAcknowledgments++;
      }
    }
  });

  return {
    summary,
    assets: assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      assetTag: asset.assetTag,
      serial: asset.serial,
      currentOwner: asset.owner ? {
        name: asset.owner.name,
        email: asset.owner.email
      } : null,
      assignmentHistory: asset.assignments.map(assignment => ({
        assignedTo: assignment.assignedToUser ? {
          name: assignment.assignedToUser.name,
          email: assignment.assignedToUser.email
        } : null,
        assignedBy: assignment.assignedByUser ? {
          name: assignment.assignedByUser.name,
          email: assignment.assignedByUser.email
        } : null,
        assignedAt: assignment.assignedAt,
        acknowledgedAt: assignment.acknowledgedAt,
        notes: assignment.notes
      }))
    }))
  };
}

// Disposal Report
async function generateDisposalReport(organizationId: string) {
  const disposals = await prisma.assetDisposal.findMany({
    where: {
      asset: {
        organizationId
      }
    },
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          type: true,
          assetTag: true,
          serial: true,
          purchaseDate: true
        }
      }
    },
    orderBy: { disposalDate: 'desc' }
  });

  const summary = {
    totalDisposals: disposals.length,
    byMethod: {} as Record<string, number>,
    thisYear: 0,
    lastYear: 0
  };

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  disposals.forEach(disposal => {
    // Count by method
    summary.byMethod[disposal.disposalMethod] = (summary.byMethod[disposal.disposalMethod] || 0) + 1;
    
    // Count by year
    const disposalYear = new Date(disposal.disposalDate).getFullYear();
    if (disposalYear === currentYear) {
      summary.thisYear++;
    } else if (disposalYear === lastYear) {
      summary.lastYear++;
    }
  });

  return {
    summary,
    disposals: disposals.map(disposal => ({
      id: disposal.id,
      asset: {
        name: disposal.asset.name,
        type: disposal.asset.type,
        assetTag: disposal.asset.assetTag,
        serial: disposal.asset.serial,
        purchaseDate: disposal.asset.purchaseDate
      },
      disposalMethod: disposal.disposalMethod,
      disposalDate: disposal.disposalDate,
      certificatePath: disposal.certificatePath,
      disposedBy: disposal.disposedBy,
      notes: disposal.notes
    }))
  };
}

// License Compliance Report
async function generateLicenseComplianceReport(organizationId: string) {
  const licenses = await prisma.license.findMany({
    where: { organizationId },
    include: {
      software: {
        select: {
          id: true,
          name: true,
          version: true,
          publisher: true
        }
      },
      renewalVendor: {
        select: {
          id: true,
          name: true
        }
      },
      allocations: {
        select: {
          id: true,
          userId: true,
          allocatedAt: true,
          allocatedBy: true,
          notes: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const summary = {
    totalLicenses: licenses.length,
    compliantLicenses: 0,
    nonCompliantLicenses: 0,
    expiringSoon: 0,
    overUtilized: 0,
    underUtilized: 0
  };

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  licenses.forEach(license => {
    const utilization = license.seatsTotal > 0 ? (license.seatsUsed / license.seatsTotal) * 100 : 0;
    
    if (utilization <= 100) {
      summary.compliantLicenses++;
    } else {
      summary.nonCompliantLicenses++;
    }
    
    if (license.expiryDate && new Date(license.expiryDate) <= thirtyDaysFromNow) {
      summary.expiringSoon++;
    }
    
    if (utilization > 90) {
      summary.overUtilized++;
    } else if (utilization < 50) {
      summary.underUtilized++;
    }
  });

  return {
    summary,
    licenses: licenses.map(license => ({
      id: license.id,
      software: {
        name: license.software.name,
        version: license.software.version,
        publisher: license.software.publisher
      },
      seatsTotal: license.seatsTotal,
      seatsUsed: license.seatsUsed,
      utilization: license.seatsTotal > 0 ? Math.round((license.seatsUsed / license.seatsTotal) * 100) : 0,
      purchaseDate: license.purchaseDate,
      expiryDate: license.expiryDate,
      renewalVendor: license.renewalVendor?.name,
      allocations: license.allocations.map(allocation => ({
        userId: allocation.userId,
        allocatedAt: allocation.allocatedAt,
        notes: allocation.notes
      })),
      complianceStatus: license.seatsUsed <= license.seatsTotal ? 'Compliant' : 'Non-Compliant'
    }))
  };
}

// Vendor Contracts Report
async function generateVendorContractsReport(organizationId: string) {
  const contracts = await prisma.contract.findMany({
    where: { organizationId },
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          contact: true,
          email: true,
          phone: true,
          riskRating: true
        }
      }
    },
    orderBy: { endDate: 'asc' }
  });

  const summary = {
    totalContracts: contracts.length,
    activeContracts: contracts.filter(c => c.status === 'ACTIVE').length,
    expiringSoon: 0,
    expired: contracts.filter(c => c.status === 'EXPIRED').length,
    byRiskLevel: {} as Record<RiskLevel, number>
  };

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  contracts.forEach(contract => {
    if (contract.endDate && new Date(contract.endDate) <= thirtyDaysFromNow && contract.status === 'ACTIVE') {
      summary.expiringSoon++;
    }
    
    summary.byRiskLevel[contract.vendor.riskRating] = (summary.byRiskLevel[contract.vendor.riskRating] || 0) + 1;
  });

  return {
    summary,
    contracts: contracts.map(contract => ({
      id: contract.id,
      title: contract.title,
      description: contract.description,
      vendor: {
        name: contract.vendor.name,
        contact: contract.vendor.contact,
        email: contract.vendor.email,
        phone: contract.vendor.phone,
        riskRating: contract.vendor.riskRating
      },
      startDate: contract.startDate,
      endDate: contract.endDate,
      renewalTerms: contract.renewalTerms,
      amount: contract.amount,
      currency: contract.currency,
      status: contract.status,
      daysUntilExpiry: contract.endDate ? 
        Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
    }))
  };
}

// Access Review Report
async function generateAccessReviewReport(organizationId: string) {
  const accessRegistry = await prisma.userAccessRegistry.findMany({
    where: { organizationId },
    include: {
      system: {
        select: {
          id: true,
          name: true,
          type: true,
          criticality: true,
          dataClassification: true
        }
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { reviewedAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const summary = {
    totalAccess: accessRegistry.length,
    activeAccess: accessRegistry.filter(a => a.status === 'ACTIVE').length,
    overdueReviews: 0,
    dueSoonReviews: 0,
    neverReviewed: 0
  };

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  accessRegistry.forEach(access => {
    if (access.reviewDueDate) {
      if (new Date(access.reviewDueDate) < new Date()) {
        summary.overdueReviews++;
      } else if (new Date(access.reviewDueDate) <= thirtyDaysFromNow) {
        summary.dueSoonReviews++;
      }
    } else {
      summary.neverReviewed++;
    }
  });

  return {
    summary,
    accessRegistry: accessRegistry.map(access => ({
      id: access.id,
      userId: access.userId,
      system: access.system ? {
        name: access.system.name,
        type: access.system.type,
        criticality: access.system.criticality,
        dataClassification: access.system.dataClassification
      } : null,
      systemName: access.systemName,
      systemType: access.systemType,
      accessLevel: access.accessLevel,
      status: access.status,
      justification: access.justification,
      approvedBy: access.approvedBy,
      approvedAt: access.approvedAt,
      reviewDueDate: access.reviewDueDate,
      lastReview: access.reviews.length > 0 ? {
        decision: access.reviews[0].decision,
        justification: access.reviews[0].justification,
        reviewedAt: access.reviews[0].reviewedAt,
        reviewer: {
          name: access.reviews[0].reviewer.name,
          email: access.reviews[0].reviewer.email
        }
      } : null,
      reviewStatus: access.reviewDueDate ? 
        (new Date(access.reviewDueDate) < new Date() ? 'Overdue' : 
         new Date(access.reviewDueDate) <= thirtyDaysFromNow ? 'Due Soon' : 'Current') : 
        'No Review Scheduled'
    }))
  };
}

// Compliance Summary Report
async function generateComplianceSummaryReport(organizationId: string) {
  const [
    assetStats,
    vendorStats,
    licenseStats,
    accessStats
  ] = await Promise.all([
    prisma.asset.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { status: true }
    }),
    prisma.vendor.groupBy({
      by: ['riskRating'],
      where: { organizationId },
      _count: { riskRating: true }
    }),
    prisma.license.findMany({
      where: { organizationId },
      select: { seatsTotal: true, seatsUsed: true, expiryDate: true }
    }),
    prisma.userAccessRegistry.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { status: true }
    })
  ]);

  const complianceScore = calculateComplianceScore({
    assetStats,
    vendorStats,
    licenseStats,
    accessStats
  });

  return {
    organizationId,
    generatedAt: new Date().toISOString(),
    complianceScore,
    assetCompliance: {
      totalAssets: assetStats.reduce((sum, stat) => sum + stat._count.status, 0),
      byStatus: assetStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as Record<AssetStatus, number>)
    },
    vendorCompliance: {
      totalVendors: vendorStats.reduce((sum, stat) => sum + stat._count.riskRating, 0),
      byRiskLevel: vendorStats.reduce((acc, stat) => {
        acc[stat.riskRating] = stat._count.riskRating;
        return acc;
      }, {} as Record<RiskLevel, number>)
    },
    licenseCompliance: {
      totalLicenses: licenseStats.length,
      compliantLicenses: licenseStats.filter(l => l.seatsUsed <= l.seatsTotal).length,
      expiringSoon: licenseStats.filter(l => {
        if (!l.expiryDate) return false;
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return new Date(l.expiryDate) <= thirtyDaysFromNow;
      }).length
    },
    accessCompliance: {
      totalAccess: accessStats.reduce((sum, stat) => sum + stat._count.status, 0),
      byStatus: accessStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as Record<AccessStatus, number>)
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateComplianceScore(data: any): number {
  let score = 0;
  let totalChecks = 0;

  // Asset compliance (25%)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalAssets = data.assetStats.reduce((sum: number, stat: any) => sum + stat._count.status, 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeAssets = data.assetStats.find((stat: any) => stat.status === 'IN_USE')?._count.status || 0;
  if (totalAssets > 0) {
    score += (activeAssets / totalAssets) * 25;
    totalChecks += 25;
  }

  // Vendor risk management (25%)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalVendors = data.vendorStats.reduce((sum: number, stat: any) => sum + stat._count.riskRating, 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lowRiskVendors = data.vendorStats.find((stat: any) => stat.riskRating === 'LOW')?._count.riskRating || 0;
  if (totalVendors > 0) {
    score += (lowRiskVendors / totalVendors) * 25;
    totalChecks += 25;
  }

  // License compliance (25%)
  const totalLicenses = data.licenseStats.length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compliantLicenses = data.licenseStats.filter((l: any) => l.seatsUsed <= l.seatsTotal).length;
  if (totalLicenses > 0) {
    score += (compliantLicenses / totalLicenses) * 25;
    totalChecks += 25;
  }

  // Access management (25%)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalAccess = data.accessStats.reduce((sum: number, stat: any) => sum + stat._count.status, 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeAccess = data.accessStats.find((stat: any) => stat.status === 'ACTIVE')?._count.status || 0;
  if (totalAccess > 0) {
    score += (activeAccess / totalAccess) * 25;
    totalChecks += 25;
  }

  return totalChecks > 0 ? Math.round((score / totalChecks) * 100) : 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertToCSV(data: any): string {
  if (!data.assets && !data.licenses && !data.contracts && !data.accessRegistry) {
    return 'No data available for CSV export';
  }

  const rows: string[] = [];
  
  if (data.assets) {
    rows.push('Asset Report');
    rows.push('Name,Type,Status,Asset Tag,Serial,Owner,Department,Vendor,Warranty End');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.assets.forEach((asset: any) => {
      rows.push([
        asset.name,
        asset.type,
        asset.status,
        asset.assetTag || '',
        asset.serial || '',
        asset.owner?.name || '',
        asset.department || '',
        asset.vendor || '',
        asset.warrantyEnd || ''
      ].join(','));
    });
  }

  if (data.licenses) {
    rows.push('\nLicense Report');
    rows.push('Software,Version,Publisher,Seats Total,Seats Used,Utilization %,Expiry Date,Compliance Status');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.licenses.forEach((license: any) => {
      rows.push([
        license.software.name,
        license.software.version || '',
        license.software.publisher || '',
        license.seatsTotal,
        license.seatsUsed,
        license.utilization,
        license.expiryDate || '',
        license.complianceStatus
      ].join(','));
    });
  }

  return rows.join('\n');
}

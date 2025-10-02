import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DataRegion {
  id: string;
  regionCode: string;
  regionName: string;
  jurisdiction: string;
  dataCenterLocations: string[];
  regulatoryRequirements: Record<string, unknown>;
  activeFlag: boolean;
}

export interface DataResidencyConfig {
  organizationId: string;
  primaryRegion: string;
  backupRegions: string[];
  residencyRequirements: {
    dataTypes: string[];
    retentionPeriods: Record<string, number>;
    crossBorderTransfers: boolean;
    localProcessing: boolean;
  };
  complianceCertifications: string[];
}

export interface DataTransferRequest {
  organizationId: string;
  sourceRegion: string;
  destinationRegion: string;
  dataType: string;
  transferReason: string;
  legalBasis: string;
  authorizedBy: string;
}

export class DataResidencyService {
  /**
   * Initialize data regions
   */
  async initializeDataRegions(): Promise<void> {
    try {
      const regions = [
        {
          regionCode: 'US_EAST',
          regionName: 'US East (N. Virginia)',
          jurisdiction: 'United States',
          dataCenterLocations: ['us-east-1', 'us-east-2'],
          regulatoryRequirements: {
            sox: true,
            hipaa: true,
            pci_dss: true,
            fedramp: false,
          },
        },
        {
          regionCode: 'US_WEST',
          regionName: 'US West (Oregon)',
          jurisdiction: 'United States',
          dataCenterLocations: ['us-west-1', 'us-west-2'],
          regulatoryRequirements: {
            sox: true,
            hipaa: true,
            pci_dss: true,
            fedramp: false,
          },
        },
        {
          regionCode: 'EU_IRELAND',
          regionName: 'Europe (Ireland)',
          jurisdiction: 'European Union',
          dataCenterLocations: ['eu-west-1'],
          regulatoryRequirements: {
            gdpr: true,
            iso27001: true,
            soc2: true,
          },
        },
        {
          regionCode: 'EU_FRANKFURT',
          regionName: 'Europe (Frankfurt)',
          jurisdiction: 'European Union',
          dataCenterLocations: ['eu-central-1'],
          regulatoryRequirements: {
            gdpr: true,
            iso27001: true,
            soc2: true,
          },
        },
        {
          regionCode: 'APAC_SINGAPORE',
          regionName: 'Asia Pacific (Singapore)',
          jurisdiction: 'Singapore',
          dataCenterLocations: ['ap-southeast-1'],
          regulatoryRequirements: {
            pdp: true,
            iso27001: true,
            soc2: true,
          },
        },
        {
          regionCode: 'APAC_TOKYO',
          regionName: 'Asia Pacific (Tokyo)',
          jurisdiction: 'Japan',
          dataCenterLocations: ['ap-northeast-1'],
          regulatoryRequirements: {
            appi: true,
            iso27001: true,
            soc2: true,
          },
        },
      ];

      for (const region of regions) {
        await prisma.dataRegion.upsert({
          where: { regionCode: region.regionCode },
          update: region,
          create: region,
        });
      }

    } catch (error) {
      console.error('Data regions initialization error:', error);
      throw error;
    }
  }

  /**
   * Configure data residency for organization
   */
  async configureDataResidency(config: DataResidencyConfig): Promise<void> {
    try {
      // Validate regions exist
      const primaryRegion = await prisma.dataRegion.findUnique({
        where: { regionCode: config.primaryRegion },
      });

      if (!primaryRegion) {
        throw new Error(`Primary region ${config.primaryRegion} not found`);
      }

      for (const backupRegion of config.backupRegions) {
        const region = await prisma.dataRegion.findUnique({
          where: { regionCode: backupRegion },
        });

        if (!region) {
          throw new Error(`Backup region ${backupRegion} not found`);
        }
      }

      // Create or update data residency configuration
      await prisma.orgDataResidency.upsert({
        where: { organizationId: config.organizationId },
        update: {
          primaryRegion: config.primaryRegion,
          backupRegions: config.backupRegions,
          residencyRequirements: config.residencyRequirements,
          complianceCertifications: config.complianceCertifications,
          lastValidatedAt: new Date(),
        },
        create: {
          organizationId: config.organizationId,
          primaryRegion: config.primaryRegion,
          backupRegions: config.backupRegions,
          residencyRequirements: config.residencyRequirements,
          complianceCertifications: config.complianceCertifications,
          lastValidatedAt: new Date(),
        },
      });

    } catch (error) {
      console.error('Data residency configuration error:', error);
      throw error;
    }
  }

  /**
   * Request data transfer between regions
   */
  async requestDataTransfer(request: DataTransferRequest): Promise<string> {
    try {
      // Validate regions
      const sourceRegion = await prisma.dataRegion.findUnique({
        where: { regionCode: request.sourceRegion },
      });

      const destinationRegion = await prisma.dataRegion.findUnique({
        where: { regionCode: request.destinationRegion },
      });

      if (!sourceRegion || !destinationRegion) {
        throw new Error('Invalid source or destination region');
      }

      // Check if transfer is allowed
      const residencyConfig = await prisma.orgDataResidency.findUnique({
        where: { organizationId: request.organizationId },
      });

      if (!residencyConfig) {
        throw new Error('Data residency not configured for organization');
      }

      // Validate cross-border transfer permissions
      if (request.sourceRegion !== request.destinationRegion) {
        if (!(residencyConfig.residencyRequirements as Record<string, unknown>)?.crossBorderTransfers) {
          throw new Error('Cross-border data transfers not permitted');
        }
      }

      // Create data transfer audit record
      const transferAudit = await prisma.dataTransferAudit.create({
        data: {
          organizationId: request.organizationId,
          sourceRegion: request.sourceRegion,
          destinationRegion: request.destinationRegion,
          dataType: request.dataType,
          transferReason: request.transferReason,
          legalBasis: request.legalBasis,
          authorizedBy: request.authorizedBy,
          status: 'PENDING',
        },
      });

      return transferAudit.id;

    } catch (error) {
      console.error('Data transfer request error:', error);
      throw error;
    }
  }

  /**
   * Approve data transfer
   */
  async approveDataTransfer(transferId: string, approvedBy: string): Promise<void> {
    try {
      const transfer = await prisma.dataTransferAudit.findUnique({
        where: { id: transferId },
      });

      if (!transfer) {
        throw new Error('Data transfer request not found');
      }

      if (transfer.status !== 'PENDING') {
        throw new Error('Data transfer request is not pending');
      }

      // Update transfer status
      await prisma.dataTransferAudit.update({
        where: { id: transferId },
        data: {
          status: 'IN_PROGRESS',
          authorizedBy: approvedBy,
        },
      });

      // Log the approval
      await this.logDataTransferEvent(transferId, 'APPROVED', {
        approvedBy,
        approvedAt: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Data transfer approval error:', error);
      throw error;
    }
  }

  /**
   * Complete data transfer
   */
  async completeDataTransfer(transferId: string, completedBy: string): Promise<void> {
    try {
      const transfer = await prisma.dataTransferAudit.findUnique({
        where: { id: transferId },
      });

      if (!transfer) {
        throw new Error('Data transfer request not found');
      }

      if (transfer.status !== 'IN_PROGRESS') {
        throw new Error('Data transfer is not in progress');
      }

      // Update transfer status
      await prisma.dataTransferAudit.update({
        where: { id: transferId },
        data: {
          status: 'COMPLETED',
          transferredAt: new Date(),
        },
      });

      // Log the completion
      await this.logDataTransferEvent(transferId, 'COMPLETED', {
        completedBy,
        completedAt: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Data transfer completion error:', error);
      throw error;
    }
  }

  /**
   * Get data residency status for organization
   */
  async getDataResidencyStatus(organizationId: string): Promise<{
    residencyConfig: unknown;
    complianceStatus: string;
    dataLocations: unknown[];
    transferHistory: unknown[];
    regulatoryCompliance: Record<string, unknown>;
  }> {
    try {
      const residencyConfig = await prisma.orgDataResidency.findUnique({
        where: { organizationId },
        include: {
          primaryRegionData: true,
        },
      });

      if (!residencyConfig) {
        return { 
          residencyConfig: null,
          complianceStatus: 'not_configured',
          dataLocations: [],
          transferHistory: [],
          regulatoryCompliance: {}
        };
      }

      // Get recent data transfers
      const recentTransfers = await prisma.dataTransferAudit.findMany({
        where: { organizationId },
        orderBy: { transferredAt: 'desc' },
        take: 10,
      });

      // Get backup regions
      const backupRegions = await prisma.dataRegion.findMany({
        where: {
          regionCode: {
            in: residencyConfig.backupRegions,
          },
        },
      });

      return {
        residencyConfig: residencyConfig,
        complianceStatus: 'compliant',
        dataLocations: [
          {
            region: residencyConfig.primaryRegion,
            name: residencyConfig.primaryRegionData.regionName,
            jurisdiction: residencyConfig.primaryRegionData.jurisdiction,
            dataCenters: residencyConfig.primaryRegionData.dataCenterLocations,
          },
          ...backupRegions.map(region => ({
            region: region.regionCode,
            name: region.regionName,
            jurisdiction: region.jurisdiction,
            dataCenters: region.dataCenterLocations,
          }))
        ],
        transferHistory: recentTransfers.map(transfer => ({
          id: transfer.id,
          sourceRegion: transfer.sourceRegion,
          destinationRegion: transfer.destinationRegion,
          dataType: transfer.dataType,
          status: transfer.status,
          transferredAt: transfer.transferredAt,
        })),
        regulatoryCompliance: {
          configured: true,
          primaryRegion: {
            code: residencyConfig.primaryRegion,
            name: residencyConfig.primaryRegionData.regionName,
            jurisdiction: residencyConfig.primaryRegionData.jurisdiction,
            dataCenters: residencyConfig.primaryRegionData.dataCenterLocations,
          },
          backupRegions: backupRegions.map(region => ({
            code: region.regionCode,
            name: region.regionName,
            jurisdiction: region.jurisdiction,
            dataCenters: region.dataCenterLocations,
          })),
          residencyRequirements: residencyConfig.residencyRequirements,
          complianceCertifications: residencyConfig.complianceCertifications,
          lastValidatedAt: residencyConfig.lastValidatedAt,
        }
      };

    } catch (error) {
      console.error('Get data residency status error:', error);
      throw error;
    }
  }

  /**
   * Validate data residency compliance
   */
  async validateCompliance(organizationId: string): Promise<{
    isValid: boolean;
    violations: string[];
    recommendations: string[];
    complianceScore: number;
  }> {
    try {
      const residencyConfig = await prisma.orgDataResidency.findUnique({
        where: { organizationId },
      });

      if (!residencyConfig) {
        return {
          isValid: false,
          violations: ['Data residency not configured'],
          recommendations: ['Configure data residency settings'],
          complianceScore: 0,
        };
      }

      const issues: string[] = [];
      const warnings: string[] = [];

      // Check if primary region is active
      const primaryRegion = await prisma.dataRegion.findUnique({
        where: { regionCode: residencyConfig.primaryRegion },
      });

      if (!primaryRegion || !primaryRegion.activeFlag) {
        issues.push('Primary region is not active');
      }

      // Check backup regions
      for (const backupRegionCode of residencyConfig.backupRegions) {
        const backupRegion = await prisma.dataRegion.findUnique({
          where: { regionCode: backupRegionCode },
        });

        if (!backupRegion || !backupRegion.activeFlag) {
          warnings.push(`Backup region ${backupRegionCode} is not active`);
        }
      }

      // Check compliance certifications
      if (!residencyConfig.complianceCertifications || (residencyConfig.complianceCertifications as unknown[]).length === 0) {
        warnings.push('No compliance certifications specified');
      }

      // Check last validation date
      if (!residencyConfig.lastValidatedAt) {
        warnings.push('Data residency has never been validated');
      } else {
        const daysSinceValidation = Math.floor(
          (Date.now() - residencyConfig.lastValidatedAt.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysSinceValidation > 365) {
          warnings.push('Data residency validation is overdue (more than 1 year)');
        }
      }

      return {
        isValid: issues.length === 0,
        violations: issues,
        recommendations: warnings,
        complianceScore: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 20)),
      };

    } catch (error) {
      console.error('Compliance validation error:', error);
      throw error;
    }
  }

  /**
   * Get available data regions
   */
  async getAvailableRegions(): Promise<DataRegion[]> {
    try {
      const regions = await prisma.dataRegion.findMany({
        where: { activeFlag: true },
        orderBy: { regionName: 'asc' },
      });

      return regions.map(region => ({
        id: region.id,
        regionCode: region.regionCode,
        regionName: region.regionName,
        jurisdiction: region.jurisdiction,
        dataCenterLocations: region.dataCenterLocations,
        regulatoryRequirements: region.regulatoryRequirements as Record<string, unknown> || {},
        activeFlag: region.activeFlag,
      }));

    } catch (error) {
      console.error('Get available regions error:', error);
      throw error;
    }
  }

  /**
   * Log data transfer event
   */
  private async logDataTransferEvent(transferId: string, event: string, metadata: Record<string, unknown>): Promise<void> {
    try {
      await prisma.securityAuditLog.create({
        data: {
          organizationId: 'system', // Will be updated with actual org ID
          eventType: 'DATA_MODIFICATION',
          action: `DATA_TRANSFER_${event}`,
          resourceId: transferId,
          metadata: {
            event,
            ...metadata,
          },
          riskScore: event === 'COMPLETED' ? 0.1 : 0.3,
        },
      });
    } catch (error) {
      console.error('Data transfer event logging error:', error);
    }
  }

  /**
   * Generate data residency certificate
   */
  async generateResidencyCertificate(organizationId: string): Promise<{
    certificateId: string;
    organizationId: string;
    issuedAt: Date;
    expiresAt: Date;
    dataLocations: unknown[];
    complianceStatus: string;
    certificateData: Record<string, unknown>;
  }> {
    try {
      const residencyConfig = await prisma.orgDataResidency.findUnique({
        where: { organizationId },
        include: {
          organization: true,
          primaryRegionData: true,
        },
      });

      if (!residencyConfig) {
        throw new Error('Data residency not configured for organization');
      }

      const certificate = {
        organization: {
          name: residencyConfig.organization.name,
          id: residencyConfig.organization.id,
        },
        dataResidency: {
          primaryRegion: {
            code: residencyConfig.primaryRegion,
            name: residencyConfig.primaryRegionData.regionName,
            jurisdiction: residencyConfig.primaryRegionData.jurisdiction,
          },
          backupRegions: residencyConfig.backupRegions,
          residencyRequirements: residencyConfig.residencyRequirements,
          complianceCertifications: residencyConfig.complianceCertifications,
        },
        certificate: {
          issuedAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          certificateId: `DRC-${organizationId}-${Date.now()}`,
        },
        compliance: {
          gdpr: residencyConfig.primaryRegionData.jurisdiction === 'European Union',
          sox: (residencyConfig.primaryRegionData.regulatoryRequirements as Record<string, unknown>)?.sox || false,
          hipaa: (residencyConfig.primaryRegionData.regulatoryRequirements as Record<string, unknown>)?.hipaa || false,
        },
      };

      return {
        certificateId: certificate.certificate.certificateId,
        organizationId: organizationId,
        issuedAt: new Date(),
        expiresAt: new Date(certificate.certificate.validUntil),
        dataLocations: [
          {
            region: certificate.dataResidency.primaryRegion.code,
            name: certificate.dataResidency.primaryRegion.name,
            jurisdiction: certificate.dataResidency.primaryRegion.jurisdiction,
          }
        ],
        complianceStatus: 'compliant',
        certificateData: certificate,
      };

    } catch (error) {
      console.error('Residency certificate generation error:', error);
      throw error;
    }
  }
}

export const dataResidencyService = new DataResidencyService();

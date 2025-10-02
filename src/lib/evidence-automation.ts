import { prisma } from './prisma';
import { 
  AutomatedEvidence, 
  Evidence, 
  EvidenceAutomationStatus,
  EvidenceType,
  EvidenceStatus
} from '@prisma/client';

export interface EvidenceGenerationRule {
  id: string;
  name: string;
  description: string;
  providerCategory: string;
  dataSource: string;
  controlMappings: string[];
  validationRules: ValidationRule[];
  transformationRules: TransformationRule[];
  isActive: boolean;
}

export interface ValidationRule {
  field: string;
  operator: 'equals' | 'contains' | 'exists' | 'greater_than' | 'less_than';
  value: unknown;
  required: boolean;
}

export interface TransformationRule {
  sourceField: string;
  targetField: string;
  transformation: 'direct' | 'format_date' | 'format_number' | 'extract_text' | 'custom';
  _customFunction?: string;
}

export interface EvidenceGenerationContext {
  connectionId: string;
  organizationId: string;
  sourceData: Record<string, unknown>;
  controlIds: string[];
  generatedBy: string;
}

export class EvidenceAutomationEngine {
  private static readonly EVIDENCE_GENERATION_RULES: EvidenceGenerationRule[] = [
    {
      id: 'google-workspace-users',
      name: 'Google Workspace User Directory',
      description: 'Generate evidence for user access controls from Google Workspace',
      providerCategory: 'GOOGLE_WORKSPACE',
      dataSource: 'users',
      controlMappings: ['access-control-users', 'user-provisioning', 'access-review'],
      validationRules: [
        { field: 'primaryEmail', operator: 'exists', value: null, required: true },
        { field: 'suspended', operator: 'equals', value: false, required: true }
      ],
      transformationRules: [
        { sourceField: 'primaryEmail', targetField: 'userEmail', transformation: 'direct' },
        { sourceField: 'name.fullName', targetField: 'userName', transformation: 'direct' },
        { sourceField: 'lastLoginTime', targetField: 'lastLogin', transformation: 'format_date' },
        { sourceField: 'suspended', targetField: 'isActive', transformation: 'direct' }
      ],
      isActive: true
    },
    {
      id: 'google-workspace-groups',
      name: 'Google Workspace Group Membership',
      description: 'Generate evidence for group-based access controls',
      providerCategory: 'GOOGLE_WORKSPACE',
      dataSource: 'groups',
      controlMappings: ['access-control-groups', 'privileged-access', 'segregation-duties'],
      validationRules: [
        { field: 'email', operator: 'exists', value: null, required: true },
        { field: 'directMembersCount', operator: 'greater_than', value: 0, required: true }
      ],
      transformationRules: [
        { sourceField: 'email', targetField: 'groupEmail', transformation: 'direct' },
        { sourceField: 'name', targetField: 'groupName', transformation: 'direct' },
        { sourceField: 'directMembersCount', targetField: 'memberCount', transformation: 'direct' },
        { sourceField: 'description', targetField: 'description', transformation: 'direct' }
      ],
      isActive: true
    },
    {
      id: 'microsoft-entra-users',
      name: 'Microsoft Entra ID User Directory',
      description: 'Generate evidence for user access controls from Microsoft Entra ID',
      providerCategory: 'MICROSOFT_ENTRA_ID',
      dataSource: 'users',
      controlMappings: ['access-control-users', 'user-provisioning', 'access-review'],
      validationRules: [
        { field: 'userPrincipalName', operator: 'exists', value: null, required: true },
        { field: 'accountEnabled', operator: 'equals', value: true, required: true }
      ],
      transformationRules: [
        { sourceField: 'userPrincipalName', targetField: 'userEmail', transformation: 'direct' },
        { sourceField: 'displayName', targetField: 'userName', transformation: 'direct' },
        { sourceField: 'lastSignInDateTime', targetField: 'lastLogin', transformation: 'format_date' },
        { sourceField: 'accountEnabled', targetField: 'isActive', transformation: 'direct' }
      ],
      isActive: true
    },
    {
      id: 'aws-config-resources',
      name: 'AWS Configuration Compliance',
      description: 'Generate evidence for AWS resource compliance',
      providerCategory: 'AWS_CONFIG',
      dataSource: 'configuration_items',
      controlMappings: ['cloud-security', 'infrastructure-compliance', 'resource-inventory'],
      validationRules: [
        { field: 'resourceId', operator: 'exists', value: null, required: true },
        { field: 'resourceType', operator: 'exists', value: null, required: true }
      ],
      transformationRules: [
        { sourceField: 'resourceId', targetField: 'resourceId', transformation: 'direct' },
        { sourceField: 'resourceType', targetField: 'resourceType', transformation: 'direct' },
        { sourceField: 'configurationItemStatus', targetField: 'status', transformation: 'direct' },
        { sourceField: 'configurationItemCaptureTime', targetField: 'captureTime', transformation: 'format_date' }
      ],
      isActive: true
    }
  ];

  /**
   * Generate evidence from integration data
   */
  static async generateEvidence(context: EvidenceGenerationContext): Promise<AutomatedEvidence[]> {
    try {
      const connection = await prisma.integrationConnection.findUnique({
        where: { id: context.connectionId },
        include: { provider: true }
      });

      if (!connection) {
        throw new Error('Integration connection not found');
      }

      // Find applicable generation rules
      const applicableRules = this.EVIDENCE_GENERATION_RULES.filter(
        rule => rule.providerCategory === connection.provider.category && rule.isActive
      );

      const generatedEvidence: AutomatedEvidence[] = [];

      for (const rule of applicableRules) {
        // Validate source data against rules
        const validationResult = this.validateSourceData(context.sourceData, rule.validationRules);
        if (!validationResult.isValid) {
          console.warn(`Validation failed for rule ${rule.name}:`, validationResult.errors);
          continue;
        }

        // Transform data according to rules
        const transformedData = this.transformData(context.sourceData, rule.transformationRules);

        // Create evidence record
        const evidence = await this.createEvidenceRecord({
          organizationId: context.organizationId,
          title: `${rule.name} - ${new Date().toISOString().split('T')[0]}`,
          description: rule.description,
          sourceData: context.sourceData,
          transformedData,
          generatedBy: context.generatedBy,
          connectionId: context.connectionId
        });

        // Create automated evidence record
        const automatedEvidence = await prisma.automatedEvidence.create({
          data: {
            organizationId: context.organizationId,
            connectionId: context.connectionId,
            evidenceId: evidence.id,
            automationStatus: EvidenceAutomationStatus.GENERATED,
            sourceData: JSON.parse(JSON.stringify(context.sourceData)),
            processedData: JSON.parse(JSON.stringify(transformedData)),
            controlMappings: rule.controlMappings,
            qualityScore: this.calculateQualityScore(context.sourceData, rule.validationRules),
            generatedAt: new Date(),
            createdBy: context.generatedBy
          }
        });

        generatedEvidence.push(automatedEvidence);
      }

      return generatedEvidence;
    } catch (error) {
      console.error('Error generating evidence:', error);
      throw error;
    }
  }

  /**
   * Validate source data against validation rules
   */
  private static validateSourceData(data: Record<string, unknown>, rules: ValidationRule[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = this.getNestedValue(data, rule.field);
      
      if (rule.required && (value === null || value === undefined || value === '')) {
        errors.push(`Required field ${rule.field} is missing`);
        continue;
      }

      if (value !== null && value !== undefined) {
        switch (rule.operator) {
          case 'equals':
            if (value !== rule.value) {
              errors.push(`Field ${rule.field} does not equal expected value`);
            }
            break;
          case 'contains':
            if (!String(value).includes(String(rule.value))) {
              errors.push(`Field ${rule.field} does not contain expected value`);
            }
            break;
          case 'exists':
            // Already checked above
            break;
          case 'greater_than':
            if (Number(value) <= Number(rule.value)) {
              errors.push(`Field ${rule.field} is not greater than ${rule.value}`);
            }
            break;
          case 'less_than':
            if (Number(value) >= Number(rule.value)) {
              errors.push(`Field ${rule.field} is not less than ${rule.value}`);
            }
            break;
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Transform data according to transformation rules
   */
  private static transformData(data: Record<string, unknown>, rules: TransformationRule[]): Record<string, unknown> {
    const transformed: Record<string, unknown> = {};

    for (const rule of rules) {
      const sourceValue = this.getNestedValue(data, rule.sourceField);
      
      switch (rule.transformation) {
        case 'direct':
          transformed[rule.targetField] = sourceValue;
          break;
        case 'format_date':
          transformed[rule.targetField] = sourceValue ? new Date(sourceValue as string | number | Date).toISOString() : null;
          break;
        case 'format_number':
          transformed[rule.targetField] = sourceValue ? Number(sourceValue) : null;
          break;
        case 'extract_text':
          transformed[rule.targetField] = sourceValue ? String(sourceValue).substring(0, 1000) : null;
          break;
        case 'custom':
          if (rule._customFunction) {
            try {
              transformed[rule.targetField] = this.executeCustomTransformation(sourceValue);
            } catch (error) {
              console.error(`Custom transformation failed for ${rule.sourceField}:`, error);
              transformed[rule.targetField] = sourceValue;
            }
          }
          break;
      }
    }

    return transformed;
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && current !== null) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Execute custom transformation function
   */
  private static executeCustomTransformation(value: unknown): unknown {
    // This would execute custom transformation logic
    // For now, return the original value
    return value;
  }

  /**
   * Calculate quality score for generated evidence
   */
  private static calculateQualityScore(data: Record<string, unknown>, rules: ValidationRule[]): number {
    let score = 100;
    
    for (const rule of rules) {
      const value = this.getNestedValue(data, rule.field);
      
      if (rule.required && (value === null || value === undefined || value === '')) {
        score -= 20; // Penalty for missing required fields
      }
    }

    return Math.max(0, score);
  }

  /**
   * Create evidence record
   */
  private static async createEvidenceRecord(params: {
    organizationId: string;
    title: string;
    description: string;
    sourceData: Record<string, unknown>;
    transformedData: Record<string, unknown>;
    generatedBy: string;
    connectionId: string;
  }): Promise<Evidence> {
    return await prisma.evidence.create({
      data: {
        organizationId: params.organizationId,
        title: params.title,
        description: params.description,
        type: EvidenceType.DOCUMENT,
        status: EvidenceStatus.DRAFT,
        source: 'automated_integration',
        addedBy: params.generatedBy,
        metadata: JSON.parse(JSON.stringify({
          sourceData: params.sourceData,
          transformedData: params.transformedData,
          connectionId: params.connectionId,
          generatedAt: new Date().toISOString()
        }))
      }
    });
  }

  /**
   * Validate and approve automated evidence
   */
  static async validateEvidence(automatedEvidenceId: string, approverId: string, approved: boolean, comments?: string): Promise<void> {
    await prisma.automatedEvidence.update({
      where: { id: automatedEvidenceId },
      data: {
        automationStatus: approved ? EvidenceAutomationStatus.APPROVED : EvidenceAutomationStatus.REJECTED,
        validatedAt: new Date(),
        approvedAt: approved ? new Date() : null,
        validationRules: {
          approved,
          approverId,
          comments,
          validatedAt: new Date().toISOString()
        }
      }
    });

    if (approved) {
      // Update the associated evidence status
      const automatedEvidence = await prisma.automatedEvidence.findUnique({
        where: { id: automatedEvidenceId },
        include: { evidence: true }
      });

      if (automatedEvidence) {
        await prisma.evidence.update({
          where: { id: automatedEvidence.evidenceId },
          data: {
            status: EvidenceStatus.APPROVED
          }
        });
      }
    }
  }

  /**
   * Get evidence generation rules for a provider
   */
  static getGenerationRules(providerCategory: string): EvidenceGenerationRule[] {
    return this.EVIDENCE_GENERATION_RULES.filter(
      rule => rule.providerCategory === providerCategory && rule.isActive
    );
  }

  /**
   * Get automated evidence for organization
   */
  static async getAutomatedEvidence(organizationId: string, limit: number = 50): Promise<AutomatedEvidence[]> {
    return await prisma.automatedEvidence.findMany({
      where: { organizationId },
      include: {
        evidence: true,
        connection: {
          include: {
            provider: true
          }
        },
        creator: true
      },
      orderBy: { generatedAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get evidence automation statistics
   */
  static async getAutomationStats(organizationId: string): Promise<{
    totalGenerated: number;
    pendingValidation: number;
    approved: number;
    rejected: number;
    averageQualityScore: number;
  }> {
    const stats = await prisma.automatedEvidence.groupBy({
      by: ['automationStatus'],
      where: { organizationId },
      _count: { id: true },
      _avg: { qualityScore: true }
    });

    const result = {
      totalGenerated: 0,
      pendingValidation: 0,
      approved: 0,
      rejected: 0,
      averageQualityScore: 0
    };

    let totalQualityScore = 0;
    let totalCount = 0;

    for (const stat of stats) {
      const count = stat._count.id;
      result.totalGenerated += count;
      
      switch (stat.automationStatus) {
        case EvidenceAutomationStatus.PENDING:
          result.pendingValidation += count;
          break;
        case EvidenceAutomationStatus.APPROVED:
          result.approved += count;
          break;
        case EvidenceAutomationStatus.REJECTED:
          result.rejected += count;
          break;
      }

      if (stat._avg.qualityScore) {
        totalQualityScore += (stat._avg.qualityScore * count);
        totalCount += count;
      }
    }

    result.averageQualityScore = totalCount > 0 ? totalQualityScore / totalCount : 0;

    return result;
  }
}

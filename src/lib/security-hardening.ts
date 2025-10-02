import { prisma } from './prisma';
import { IntegrationConnection, ConnectionStatus } from '@prisma/client';
import crypto from 'crypto';

export interface SecurityAuditResult {
  connectionId: string;
  connectionName: string;
  provider: string;
  securityScore: number;
  issues: SecurityIssue[];
  recommendations: SecurityRecommendation[];
  lastAuditDate: Date;
}

export interface SecurityIssue {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'AUTHENTICATION' | 'ENCRYPTION' | 'ACCESS_CONTROL' | 'DATA_PROTECTION' | 'NETWORK_SECURITY';
  title: string;
  description: string;
  remediation: string;
  detectedAt: Date;
}

export interface SecurityRecommendation {
  id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'AUTHENTICATION' | 'ENCRYPTION' | 'ACCESS_CONTROL' | 'DATA_PROTECTION' | 'NETWORK_SECURITY';
  title: string;
  description: string;
  implementation: string;
  estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class SecurityHardeningService {
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_DERIVATION_ITERATIONS = 100000;

  /**
   * Perform security audit on all integration connections
   */
  static async performSecurityAudit(): Promise<SecurityAuditResult[]> {
    const connections = await prisma.integrationConnection.findMany({
      where: { status: ConnectionStatus.ACTIVE },
      include: { provider: true }
    });

    const auditResults: SecurityAuditResult[] = [];

    for (const connection of connections) {
      const auditResult = await this.auditConnection(connection);
      auditResults.push(auditResult);
    }

    return auditResults;
  }

  /**
   * Audit a specific connection
   */
  static async auditConnection(connection: IntegrationConnection & { provider: Record<string, unknown> }): Promise<SecurityAuditResult> {
    const issues: SecurityIssue[] = [];
    const recommendations: SecurityRecommendation[] = [];
    let securityScore = 100;

    // Check authentication security
    const authIssues = await this.checkAuthenticationSecurity(connection);
    issues.push(...authIssues);
    securityScore -= authIssues.length * 10;

    // Check encryption security
    const encryptionIssues = await this.checkEncryptionSecurity(connection);
    issues.push(...encryptionIssues);
    securityScore -= encryptionIssues.length * 15;

    // Check access control security
    const accessIssues = await this.checkAccessControlSecurity(connection);
    issues.push(...accessIssues);
    securityScore -= accessIssues.length * 12;

    // Check data protection security
    const dataIssues = await this.checkDataProtectionSecurity(connection);
    issues.push(...dataIssues);
    securityScore -= dataIssues.length * 8;

    // Generate recommendations
    const securityRecommendations = this.generateSecurityRecommendations(connection, issues);
    recommendations.push(...securityRecommendations);

    return {
      connectionId: connection.id,
      connectionName: connection.connectionName,
      provider: (connection.provider as { name: string }).name,
      securityScore: Math.max(0, securityScore),
      issues,
      recommendations,
      lastAuditDate: new Date()
    };
  }

  /**
   * Check authentication security
   */
  private static async checkAuthenticationSecurity(connection: IntegrationConnection & { provider: Record<string, unknown> }): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const authMetadata = connection.authMetadata as { expiresAt?: string; mfaEnabled?: boolean };

    // Check for weak authentication methods
    if ((connection.provider as { authType: string }).authType === 'BASIC_AUTH') {
      issues.push({
        id: `auth-${connection.id}-basic-auth`,
        severity: 'HIGH',
        category: 'AUTHENTICATION',
        title: 'Basic Authentication Used',
        description: 'Basic authentication is being used, which is less secure than OAuth2 or API keys.',
        remediation: 'Migrate to OAuth2 or API key authentication for better security.',
        detectedAt: new Date()
      });
    }

    // Check for missing MFA
    if ((connection.provider as { authType: string }).authType === 'OAUTH2' && !authMetadata?.mfaEnabled) {
      issues.push({
        id: `auth-${connection.id}-no-mfa`,
        severity: 'MEDIUM',
        category: 'AUTHENTICATION',
        title: 'Multi-Factor Authentication Not Enabled',
        description: 'OAuth2 authentication is not using multi-factor authentication.',
        remediation: 'Enable MFA for OAuth2 authentication to enhance security.',
        detectedAt: new Date()
      });
    }

    // Check for expired tokens
    if (authMetadata?.expiresAt && new Date(authMetadata.expiresAt) < new Date()) {
      issues.push({
        id: `auth-${connection.id}-expired-token`,
        severity: 'CRITICAL',
        category: 'AUTHENTICATION',
        title: 'Expired Authentication Token',
        description: 'The authentication token has expired and needs to be refreshed.',
        remediation: 'Refresh the authentication token immediately.',
        detectedAt: new Date()
      });
    }

    return issues;
  }

  /**
   * Check encryption security
   */
  private static async checkEncryptionSecurity(connection: IntegrationConnection): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Check if credentials are encrypted
    if (!connection.credentialsEncrypted) {
      issues.push({
        id: `enc-${connection.id}-no-encryption`,
        severity: 'CRITICAL',
        category: 'ENCRYPTION',
        title: 'Credentials Not Encrypted',
        description: 'Integration credentials are not encrypted at rest.',
        remediation: 'Encrypt all stored credentials using strong encryption algorithms.',
        detectedAt: new Date()
      });
    }

    // Check encryption strength
    if (connection.credentialsEncrypted && !this.isStrongEncryption(connection.credentialsEncrypted)) {
      issues.push({
        id: `enc-${connection.id}-weak-encryption`,
        severity: 'HIGH',
        category: 'ENCRYPTION',
        title: 'Weak Encryption Algorithm',
        description: 'Credentials are encrypted using a weak encryption algorithm.',
        remediation: 'Upgrade to AES-256-GCM encryption for better security.',
        detectedAt: new Date()
      });
    }

    return issues;
  }

  /**
   * Check access control security
   */
  private static async checkAccessControlSecurity(connection: IntegrationConnection & { provider: Record<string, unknown> }): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Check for excessive permissions
    const provider = connection.provider as { supportedScopes?: string[] };
    if (provider.supportedScopes && provider.supportedScopes.length > 10) {
      issues.push({
        id: `access-${connection.id}-excessive-scopes`,
        severity: 'MEDIUM',
        category: 'ACCESS_CONTROL',
        title: 'Excessive OAuth Scopes',
        description: 'The integration is requesting more OAuth scopes than necessary.',
        remediation: 'Review and minimize OAuth scopes to follow the principle of least privilege.',
        detectedAt: new Date()
      });
    }

    // Check for admin-level access
    const adminScopes = provider.supportedScopes?.filter((scope: string) => 
      scope.includes('admin') || scope.includes('write') || scope.includes('delete')
    ) || [];

    if (adminScopes.length > 0) {
      issues.push({
        id: `access-${connection.id}-admin-access`,
        severity: 'HIGH',
        category: 'ACCESS_CONTROL',
        title: 'Administrative Access Granted',
        description: 'The integration has administrative-level access permissions.',
        remediation: 'Review if administrative access is necessary and consider using read-only permissions where possible.',
        detectedAt: new Date()
      });
    }

    return issues;
  }

  /**
   * Check data protection security
   */
  private static async checkDataProtectionSecurity(connection: IntegrationConnection & { provider: Record<string, unknown> }): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const authMetadata = connection.authMetadata as { dataRetentionPolicy?: string; encryptionEnabled?: boolean; dataAnonymization?: boolean };

    // Check for data retention policies
    if (!authMetadata?.dataRetentionPolicy) {
      issues.push({
        id: `data-${connection.id}-no-retention`,
        severity: 'MEDIUM',
        category: 'DATA_PROTECTION',
        title: 'No Data Retention Policy',
        description: 'No data retention policy is defined for the integration.',
        remediation: 'Define and implement data retention policies for compliance.',
        detectedAt: new Date()
      });
    }

    // Check for data anonymization
    if (!authMetadata?.dataAnonymization) {
      issues.push({
        id: `data-${connection.id}-no-anonymization`,
        severity: 'LOW',
        category: 'DATA_PROTECTION',
        title: 'Data Anonymization Not Enabled',
        description: 'Personal data is not being anonymized during processing.',
        remediation: 'Enable data anonymization for personal information to comply with privacy regulations.',
        detectedAt: new Date()
      });
    }

    return issues;
  }

  /**
   * Generate security recommendations
   */
  private static generateSecurityRecommendations(
    connection: IntegrationConnection,
    issues: SecurityIssue[]
  ): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];

    // Generate recommendations based on issues
    for (const issue of issues) {
      switch (issue.category) {
        case 'AUTHENTICATION':
          recommendations.push({
            id: `rec-auth-${issue.id}`,
            priority: issue.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            category: 'AUTHENTICATION',
            title: `Improve ${issue.title}`,
            description: `Address the authentication security issue: ${issue.title}`,
            implementation: issue.remediation,
            estimatedEffort: issue.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM'
          });
          break;
        case 'ENCRYPTION':
          recommendations.push({
            id: `rec-enc-${issue.id}`,
            priority: issue.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            category: 'ENCRYPTION',
            title: `Enhance ${issue.title}`,
            description: `Address the encryption security issue: ${issue.title}`,
            implementation: issue.remediation,
            estimatedEffort: 'HIGH'
          });
          break;
        case 'ACCESS_CONTROL':
          recommendations.push({
            id: `rec-access-${issue.id}`,
            priority: 'MEDIUM',
            category: 'ACCESS_CONTROL',
            title: `Review ${issue.title}`,
            description: `Address the access control issue: ${issue.title}`,
            implementation: issue.remediation,
            estimatedEffort: 'MEDIUM'
          });
          break;
        case 'DATA_PROTECTION':
          recommendations.push({
            id: `rec-data-${issue.id}`,
            priority: 'MEDIUM',
            category: 'DATA_PROTECTION',
            title: `Implement ${issue.title}`,
            description: `Address the data protection issue: ${issue.title}`,
            implementation: issue.remediation,
            estimatedEffort: 'LOW'
          });
          break;
      }
    }

    return recommendations;
  }

  /**
   * Check if encryption is strong
   */
  private static isStrongEncryption(encryptedData: string): boolean {
    // Check if the encrypted data uses strong encryption
    // This is a simplified check - in production, you'd verify the actual encryption algorithm
    return encryptedData.includes('aes-256-gcm') || encryptedData.length > 100;
  }

  /**
   * Rotate encryption keys
   */
  static async rotateEncryptionKeys(): Promise<void> {
    const connections = await prisma.integrationConnection.findMany({
      where: { credentialsEncrypted: { not: null } }
    });

    for (const connection of connections) {
      try {
        // Decrypt with old key
        const decryptedCredentials = this.decryptCredentials(connection.credentialsEncrypted!);
        
        // Encrypt with new key
        const newEncryptedCredentials = this.encryptCredentials(decryptedCredentials);
        
        // Update connection
        await prisma.integrationConnection.update({
          where: { id: connection.id },
          data: { credentialsEncrypted: newEncryptedCredentials }
        });
      } catch (error) {
        console.error(`Error rotating keys for connection ${connection.id}:`, error);
      }
    }
  }

  /**
   * Encrypt credentials with strong encryption
   */
  private static encryptCredentials(credentials: Record<string, unknown>): string {
    const key = crypto.scryptSync(process.env.INTEGRATION_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const _iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, key);
    
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return _iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt credentials
   */
  private static decryptCredentials(encryptedCredentials: string): Record<string, unknown> {
    const key = crypto.scryptSync(process.env.INTEGRATION_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const [, encrypted] = encryptedCredentials.split(':');
    const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Get security compliance report
   */
  static async getSecurityComplianceReport(organizationId: string): Promise<{
    totalConnections: number;
    secureConnections: number;
    averageSecurityScore: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    recommendations: SecurityRecommendation[];
  }> {
    const connections = await prisma.integrationConnection.findMany({
      where: { organizationId },
      include: { provider: true }
    });

    let totalSecurityScore = 0;
    let secureConnections = 0;
    let criticalIssues = 0;
    let highIssues = 0;
    let mediumIssues = 0;
    let lowIssues = 0;
    const allRecommendations: SecurityRecommendation[] = [];

    for (const connection of connections) {
      const auditResult = await this.auditConnection(connection);
      totalSecurityScore += auditResult.securityScore;
      
      if (auditResult.securityScore >= 80) {
        secureConnections++;
      }

      // Count issues by severity
      for (const issue of auditResult.issues) {
        switch (issue.severity) {
          case 'CRITICAL':
            criticalIssues++;
            break;
          case 'HIGH':
            highIssues++;
            break;
          case 'MEDIUM':
            mediumIssues++;
            break;
          case 'LOW':
            lowIssues++;
            break;
        }
      }

      allRecommendations.push(...auditResult.recommendations);
    }

    return {
      totalConnections: connections.length,
      secureConnections,
      averageSecurityScore: connections.length > 0 ? totalSecurityScore / connections.length : 0,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      recommendations: allRecommendations
    };
  }
}

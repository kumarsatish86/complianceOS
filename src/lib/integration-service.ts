import { prisma } from './prisma';
import { 
  IntegrationProvider, 
  IntegrationConnection, 
  IntegrationLog, 
  IntegrationJob,
  ConnectionStatus,
  JobStatus,
  JobType,
  SyncType
} from '@prisma/client';
import crypto from 'crypto';

export interface IntegrationCredentials {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  serviceAccountKey?: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  domain?: string;
  expiresAt?: Date;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errorsCount: number;
  duration: number;
  errorDetails?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface IntegrationConfig {
  providerId: string;
  connectionName: string;
  credentials: IntegrationCredentials;
  syncSchedule?: string;
  syncFrequency?: number;
  organizationId: string;
  createdBy: string;
}

export class IntegrationService {
  private static readonly ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY || 'default-key-change-in-production';
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';

  /**
   * Encrypt sensitive credentials
   */
  private static encryptCredentials(credentials: IntegrationCredentials): string {
    const _iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, this.ENCRYPTION_KEY);
    
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return _iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive credentials
   */
  private static decryptCredentials(encryptedCredentials: string): IntegrationCredentials {
    const [, encrypted] = encryptedCredentials.split(':');
    const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, this.ENCRYPTION_KEY);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Create a new integration connection
   */
  static async createConnection(config: IntegrationConfig): Promise<IntegrationConnection> {
    const encryptedCredentials = this.encryptCredentials(config.credentials);
    
    const connection = await prisma.integrationConnection.create({
      data: {
        organizationId: config.organizationId,
        providerId: config.providerId,
        connectionName: config.connectionName,
        credentialsEncrypted: encryptedCredentials,
        status: ConnectionStatus.PENDING_SETUP,
        syncSchedule: config.syncSchedule,
        syncFrequency: config.syncFrequency,
        createdBy: config.createdBy,
        authMetadata: {
          providerId: config.providerId,
          createdAt: new Date().toISOString()
        }
      },
      include: {
        provider: true,
        creator: true
      }
    });

    return connection;
  }

  /**
   * Test connection and update status
   */
  static async testConnection(connectionId: string): Promise<boolean> {
    try {
      const connection = await prisma.integrationConnection.findUnique({
        where: { id: connectionId },
        include: { provider: true }
      });

      if (!connection) {
        throw new Error('Connection not found');
      }

      const credentials = this.decryptCredentials(connection.credentialsEncrypted!);
      
      // Test connection based on provider type
      const isConnected = await this.testProviderConnection(connection.provider, credentials);
      
      // Update connection status
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          status: isConnected ? ConnectionStatus.ACTIVE : ConnectionStatus.ERROR,
          lastErrorAt: isConnected ? null : new Date(),
          lastErrorMessage: isConnected ? null : 'Connection test failed'
        }
      });

      return isConnected;
    } catch (error) {
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          status: ConnectionStatus.ERROR,
          lastErrorAt: new Date(),
          lastErrorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return false;
    }
  }

  /**
   * Test provider-specific connection
   */
  private static async testProviderConnection(provider: IntegrationProvider, credentials: IntegrationCredentials): Promise<boolean> {
    switch (provider.category) {
      case 'GOOGLE_WORKSPACE':
        return await this.testGoogleWorkspaceConnection(credentials);
      case 'MICROSOFT_ENTRA_ID':
        return await this.testMicrosoftEntraConnection(credentials);
      case 'AWS_CONFIG':
        return await this.testAWSConfigConnection(credentials);
      default:
        throw new Error(`Unsupported provider: ${provider.category}`);
    }
  }

  /**
   * Test Google Workspace connection
   */
  private static async testGoogleWorkspaceConnection(credentials: IntegrationCredentials): Promise<boolean> {
    try {
      const { GoogleWorkspaceIntegration } = await import('./integrations/google-workspace');
      const integration = new GoogleWorkspaceIntegration({
        credentials,
        domain: credentials.domain || '',
        adminEmail: credentials.clientId || ''
      });
      return await integration.testConnection();
    } catch (error) {
      console.error('Google Workspace connection test failed:', error);
      return false;
    }
  }

  /**
   * Test Microsoft Entra ID connection
   */
  private static async testMicrosoftEntraConnection(credentials: IntegrationCredentials): Promise<boolean> {
    try {
      const { MicrosoftEntraIntegration } = await import('./integrations/microsoft-entra');
      const integration = new MicrosoftEntraIntegration({
        credentials,
        tenantId: credentials.tenantId || '',
        clientId: credentials.clientId || ''
      });
      return await integration.testConnection();
    } catch (error) {
      console.error('Microsoft Entra ID connection test failed:', error);
      return false;
    }
  }

  /**
   * Test AWS Config connection
   */
  private static async testAWSConfigConnection(credentials: IntegrationCredentials): Promise<boolean> {
    try {
      const { AWSConfigIntegration } = await import('./integrations/aws-config');
      const integration = new AWSConfigIntegration(credentials);
      return await integration.testConnection();
    } catch (error) {
      console.error('AWS Config connection test failed:', error);
      return false;
    }
  }

  /**
   * Create a sync job
   */
  static async createSyncJob(
    connectionId: string,
    jobType: JobType,
    priority: number = 5,
    _jobData?: Record<string, unknown>
  ): Promise<IntegrationJob> {
    const job = await prisma.integrationJob.create({
      data: {
        connectionId,
        jobType,
        status: JobStatus.PENDING,
        priority,
        jobData: _jobData ? JSON.parse(JSON.stringify(_jobData)) : null,
        scheduledAt: new Date()
      }
    });

    return job;
  }

  /**
   * Execute a sync job
   */
  static async executeSyncJob(jobId: string): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      const job = await prisma.integrationJob.findUnique({
        where: { id: jobId },
        include: { connection: { include: { provider: true } } }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      // Update job status to running
      await prisma.integrationJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.RUNNING,
          startedAt: new Date()
        }
      });

      const credentials = this.decryptCredentials(job.connection.credentialsEncrypted!);
      
      // Execute sync based on job type and provider
      const result = await this.executeProviderSync(job.connection.provider, credentials, job.jobType);
      
      const duration = Date.now() - startTime;

      // Update job with results
      await prisma.integrationJob.update({
        where: { id: jobId },
        data: {
          status: result.success ? JobStatus.COMPLETED : JobStatus.FAILED,
          completedAt: new Date(),
          resultData: JSON.parse(JSON.stringify(result)),
          errorMessage: result.success ? null : (result.errorDetails?.message as string) || 'Unknown error',
        }
      });

      // Create integration log
      await prisma.integrationLog.create({
        data: {
          organizationId: job.connection.organizationId,
          connectionId: job.connectionId,
          provider: job.connection.provider.name,
          syncType: SyncType.SCHEDULED,
          action: job.jobType,
          status: result.success ? 'success' : 'failed',
          recordsProcessed: result.recordsProcessed,
          errorsCount: result.errorsCount,
          durationSeconds: duration / 1000,
          startedAt: new Date(startTime),
          completedAt: new Date(),
          errorDetails: result.errorDetails ? JSON.parse(JSON.stringify(result.errorDetails)) : null,
          metadata: result.metadata ? JSON.parse(JSON.stringify(result.metadata)) : null
        }
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await prisma.integrationJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        success: false,
        recordsProcessed: 0,
        errorsCount: 1,
        duration,
        errorDetails: error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) }
      };
    }
  }

  /**
   * Execute provider-specific sync
   */
  private static async executeProviderSync(
    provider: IntegrationProvider,
    credentials: IntegrationCredentials,
    jobType: JobType
  ): Promise<SyncResult> {
    switch (provider.category) {
      case 'GOOGLE_WORKSPACE':
        return await this.syncGoogleWorkspace(credentials, jobType);
      case 'MICROSOFT_ENTRA_ID':
        return await this.syncMicrosoftEntra(credentials, jobType);
      case 'AWS_CONFIG':
        return await this.syncAWSConfig(credentials, jobType);
      default:
        throw new Error(`Unsupported provider: ${provider.category}`);
    }
  }

  /**
   * Sync Google Workspace data
   */
  private static async syncGoogleWorkspace(
    credentials: IntegrationCredentials,
    jobType: JobType
  ): Promise<SyncResult> {
    try {
      const { GoogleWorkspaceIntegration } = await import('./integrations/google-workspace');
      const integration = new GoogleWorkspaceIntegration({
        credentials,
        domain: credentials.domain || '',
        adminEmail: credentials.clientId || ''
      });

      let result: SyncResult;
      switch (jobType) {
        case JobType.FULL_SYNC:
          // Sync all data types
          const [usersResult, groupsResult, devicesResult] = await Promise.all([
            integration.syncUsers(),
            integration.syncGroups(),
            integration.syncDevices()
          ]);
          
          result = {
            success: usersResult.success && groupsResult.success && devicesResult.success,
            recordsProcessed: usersResult.recordsProcessed + groupsResult.recordsProcessed + devicesResult.recordsProcessed,
            errorsCount: usersResult.errorsCount + groupsResult.errorsCount + devicesResult.errorsCount,
            duration: Math.max(usersResult.duration, groupsResult.duration, devicesResult.duration),
            metadata: {
              provider: 'google_workspace',
              jobType,
              syncTime: new Date().toISOString(),
              users: usersResult.recordsProcessed,
              groups: groupsResult.recordsProcessed,
              devices: devicesResult.recordsProcessed
            }
          };
          break;
        case JobType.INCREMENTAL_SYNC:
          // Sync only users for incremental
          result = await integration.syncUsers();
          break;
        default:
          result = await integration.syncUsers();
      }

      return result;
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        errorsCount: 1,
        duration: 1000,
        errorDetails: error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) }
      };
    }
  }

  /**
   * Sync Microsoft Entra ID data
   */
  private static async syncMicrosoftEntra(
    credentials: IntegrationCredentials,
    jobType: JobType
  ): Promise<SyncResult> {
    try {
      const { MicrosoftEntraIntegration } = await import('./integrations/microsoft-entra');
      const integration = new MicrosoftEntraIntegration({
        credentials,
        tenantId: credentials.tenantId || '',
        clientId: credentials.clientId || ''
      });

      let result: SyncResult;
      switch (jobType) {
        case JobType.FULL_SYNC:
          // Sync all data types
          const [usersResult, groupsResult, devicesResult] = await Promise.all([
            integration.syncUsers(),
            integration.syncGroups(),
            integration.syncDevices()
          ]);
          
          result = {
            success: usersResult.success && groupsResult.success && devicesResult.success,
            recordsProcessed: usersResult.recordsProcessed + groupsResult.recordsProcessed + devicesResult.recordsProcessed,
            errorsCount: usersResult.errorsCount + groupsResult.errorsCount + devicesResult.errorsCount,
            duration: Math.max(usersResult.duration, groupsResult.duration, devicesResult.duration),
            metadata: {
              provider: 'microsoft_entra_id',
              jobType,
              syncTime: new Date().toISOString(),
              users: usersResult.recordsProcessed,
              groups: groupsResult.recordsProcessed,
              devices: devicesResult.recordsProcessed
            }
          };
          break;
        case JobType.INCREMENTAL_SYNC:
          // Sync only users for incremental
          result = await integration.syncUsers();
          break;
        default:
          result = await integration.syncUsers();
      }

      return result;
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        errorsCount: 1,
        duration: 1000,
        errorDetails: error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) }
      };
    }
  }

  /**
   * Sync AWS Config data
   */
  private static async syncAWSConfig(
    credentials: IntegrationCredentials,
    jobType: JobType
  ): Promise<SyncResult> {
    try {
      const { AWSConfigIntegration } = await import('./integrations/aws-config');
      const integration = new AWSConfigIntegration(credentials);

      let result: SyncResult;
      switch (jobType) {
        case JobType.FULL_SYNC:
          // Sync all data types
          const [configItemsResult, rulesResult, complianceResult] = await Promise.all([
            integration.syncConfigurationItems(),
            integration.syncConfigurationRules(),
            integration.syncComplianceResults()
          ]);
          
          result = {
            success: configItemsResult.success && rulesResult.success && complianceResult.success,
            recordsProcessed: configItemsResult.recordsProcessed + rulesResult.recordsProcessed + complianceResult.recordsProcessed,
            errorsCount: configItemsResult.errorsCount + rulesResult.errorsCount + complianceResult.errorsCount,
            duration: Math.max(configItemsResult.duration, rulesResult.duration, complianceResult.duration),
            metadata: {
              provider: 'aws_config',
              jobType,
              syncTime: new Date().toISOString(),
              configItems: configItemsResult.recordsProcessed,
              rules: rulesResult.recordsProcessed,
              complianceResults: complianceResult.recordsProcessed
            }
          };
          break;
        case JobType.INCREMENTAL_SYNC:
          // Sync only configuration items for incremental
          result = await integration.syncConfigurationItems();
          break;
        default:
          result = await integration.syncConfigurationItems();
      }

      return result;
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        errorsCount: 1,
        duration: 1000,
        errorDetails: error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) }
      };
    }
  }

  /**
   * Get integration connections for organization
   */
  static async getConnections(organizationId: string): Promise<IntegrationConnection[]> {
    return await prisma.integrationConnection.findMany({
      where: { organizationId },
      include: {
        provider: true,
        creator: true,
        _count: {
          select: {
            logs: true,
            jobs: true,
            automatedEvidence: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get integration logs for connection
   */
  static async getConnectionLogs(
    connectionId: string,
    limit: number = 50
  ): Promise<IntegrationLog[]> {
    return await prisma.integrationLog.findMany({
      where: { connectionId },
      orderBy: { startedAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get integration jobs for connection
   */
  static async getConnectionJobs(
    connectionId: string,
    limit: number = 50
  ): Promise<IntegrationJob[]> {
    return await prisma.integrationJob.findMany({
      where: { connectionId },
      orderBy: { scheduledAt: 'desc' },
      take: limit
    });
  }

  /**
   * Delete integration connection
   */
  static async deleteConnection(connectionId: string): Promise<void> {
    await prisma.integrationConnection.delete({
      where: { id: connectionId }
    });
  }

  /**
   * Update connection status
   */
  static async updateConnectionStatus(
    connectionId: string,
    status: ConnectionStatus,
    errorMessage?: string
  ): Promise<void> {
    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        status,
        lastErrorAt: status === ConnectionStatus.ERROR ? new Date() : null,
        lastErrorMessage: errorMessage || null
      }
    });
  }
}

import { prisma } from './prisma';
import { IntegrationService } from './integration-service';
import { EvidenceAutomationEngine } from './evidence-automation';
import { 
  IntegrationJob, 
  IntegrationConnection,
  JobStatus, 
  JobType,
  ConnectionStatus
} from '@prisma/client';

export interface SyncSchedule {
  id: string;
  connectionId: string;
  cronExpression: string;
  jobType: JobType;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface SyncOrchestrationConfig {
  maxConcurrentJobs: number;
  retryAttempts: number;
  retryDelay: number; // in minutes
  jobTimeout: number; // in minutes
  enableAutoEvidenceGeneration: boolean;
}

export class SyncOrchestrationService {
  private static readonly DEFAULT_CONFIG: SyncOrchestrationConfig = {
    maxConcurrentJobs: 5,
    retryAttempts: 3,
    retryDelay: 5,
    jobTimeout: 30,
    enableAutoEvidenceGeneration: true
  };

  /**
   * Start the sync orchestration service
   */
  static async startOrchestration(): Promise<void> {
    console.log('Starting sync orchestration service...');
    
    // Start background job processor
    this.processBackgroundJobs();
    
    // Start scheduled job processor
    this.processScheduledJobs();
    
    console.log('Sync orchestration service started');
  }

  /**
   * Process background jobs
   */
  private static async processBackgroundJobs(): Promise<void> {
    setInterval(async () => {
      try {
        await this.processPendingJobs();
      } catch (error) {
        console.error('Error processing background jobs:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Process scheduled jobs
   */
  private static async processScheduledJobs(): Promise<void> {
    setInterval(async () => {
      try {
        await this.processScheduledSyncs();
      } catch (error) {
        console.error('Error processing scheduled jobs:', error);
      }
    }, 60000); // Check every _minute
  }

  /**
   * Process pending jobs
   */
  static async processPendingJobs(): Promise<void> {
    const pendingJobs = await prisma.integrationJob.findMany({
      where: {
        status: JobStatus.PENDING,
        scheduledAt: { lte: new Date() }
      },
      include: {
        connection: {
          include: {
            provider: true
          }
        }
      },
      orderBy: [
        { priority: 'asc' },
        { scheduledAt: 'asc' }
      ],
      take: this.DEFAULT_CONFIG.maxConcurrentJobs
    });

    for (const job of pendingJobs) {
      this.executeJob(job);
    }
  }

  /**
   * Process scheduled syncs
   */
  static async processScheduledSyncs(): Promise<void> {
    const activeConnections = await prisma.integrationConnection.findMany({
      where: {
        status: ConnectionStatus.ACTIVE,
        syncSchedule: { not: null }
      },
      include: {
        provider: true
      }
    });

    for (const connection of activeConnections) {
      if (this.shouldRunScheduledSync(connection)) {
        await this.createScheduledSyncJob(connection);
      }
    }
  }

  /**
   * Check if scheduled sync should run
   */
  private static shouldRunScheduledSync(connection: IntegrationConnection): boolean {
    if (!connection.syncSchedule || !connection.nextSyncAt) {
      return false;
    }

    return new Date() >= connection.nextSyncAt;
  }

  /**
   * Create scheduled sync job
   */
  private static async createScheduledSyncJob(connection: IntegrationConnection): Promise<void> {
    const job = await IntegrationService.createSyncJob(
      connection.id,
      JobType.FULL_SYNC,
      5 // Normal priority
    );

    // Update next sync time
    const nextSyncTime = this.calculateNextSyncTime(connection.syncSchedule!);
    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        nextSyncAt: nextSyncTime,
        lastSyncAt: new Date()
      }
    });

    console.log(`Created scheduled sync job ${job.id} for connection ${connection.id}`);
  }

  /**
   * Calculate next sync time based on cron expression
   */
  private static calculateNextSyncTime(cronExpression: string): Date {
    // Simple cron parser - in production, use a proper cron library
    const now = new Date();
    const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 _hour from now
    
    // Parse cron expression (simplified)
    const parts = cronExpression.split(' ');
    if (parts.length >= 5) {
      // Cron expression parsed successfully

      // For now, just add 1 _hour to current time
      // In production, use a proper cron parser
    }

    return nextRun;
  }

  /**
   * Execute a job
   */
  private static async executeJob(job: IntegrationJob & { connection: IntegrationConnection & { provider: Record<string, unknown> } }): Promise<void> {
    try {
      console.log(`Executing job ${job.id} for connection ${job.connectionId}`);
      
      // Execute the sync
      const result = await IntegrationService.executeSyncJob(job.id);
      
      // Generate evidence if enabled and sync was successful
      if (this.DEFAULT_CONFIG.enableAutoEvidenceGeneration && result.success) {
        await this.generateEvidenceFromSync(job.connectionId, result as unknown as Record<string, unknown>);
      }
      
      console.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      await this.handleJobFailure(job, error as Error);
    }
  }

  /**
   * Generate evidence from sync result
   */
  private static async generateEvidenceFromSync(connectionId: string, syncResult: Record<string, unknown>): Promise<void> {
    try {
      const connection = await prisma.integrationConnection.findUnique({
        where: { id: connectionId },
        include: { provider: true }
      });

      if (!connection) {
        throw new Error('Connection not found');
      }

      // This would contain the actual data from the sync
      const sourceData = (syncResult.metadata || {}) as Record<string, unknown>;
      
      const evidence = await EvidenceAutomationEngine.generateEvidence({
        connectionId,
        organizationId: connection.organizationId,
        sourceData,
        controlIds: [], // Would be determined based on provider and data type
        generatedBy: 'system'
      });

      console.log(`Generated ${evidence.length} evidence records from sync`);
    } catch (error) {
      console.error('Error generating evidence from sync:', error);
    }
  }

  /**
   * Handle job failure
   */
  private static async handleJobFailure(job: IntegrationJob, error: Error): Promise<void> {
    const retryCount = job.retryCount + 1;
    
    if (retryCount < this.DEFAULT_CONFIG.retryAttempts) {
      // Retry the job
      const retryDelay = this.DEFAULT_CONFIG.retryDelay * 60 * 1000; // Convert to milliseconds
      const retryTime = new Date(Date.now() + retryDelay);
      
      await prisma.integrationJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.RETRYING,
          retryCount,
          scheduledAt: retryTime,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      console.log(`Job ${job.id} will retry in ${this.DEFAULT_CONFIG.retryDelay} minutes (attempt ${retryCount})`);
    } else {
      // Mark job as failed
      await prisma.integrationJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.FAILED,
          retryCount,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      console.log(`Job ${job.id} failed after ${retryCount} attempts`);
    }
  }

  /**
   * Create manual sync job
   */
  static async createManualSync(
    connectionId: string,
    jobType: JobType = JobType.FULL_SYNC,
    priority: number = 1
  ): Promise<IntegrationJob> {
    const job = await IntegrationService.createSyncJob(connectionId, jobType, priority);
    
    // Execute immediately for manual syncs
    this.executeJob(job as IntegrationJob & { connection: IntegrationConnection & { provider: Record<string, unknown> } });
    
    return job;
  }

  /**
   * Get job status and statistics
   */
  static async getJobStats(): Promise<{
    totalJobs: number;
    pendingJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageExecutionTime: number;
  }> {
    const stats = await prisma.integrationJob.groupBy({
      by: ['status'],
      _count: { id: true },
      _avg: { 
        // This would need to be calculated from startedAt and completedAt
      }
    });

    const result = {
      totalJobs: 0,
      pendingJobs: 0,
      runningJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      averageExecutionTime: 0
    };

    for (const stat of stats) {
      const count = stat._count.id;
      result.totalJobs += count;
      
      switch (stat.status) {
        case JobStatus.PENDING:
          result.pendingJobs += count;
          break;
        case JobStatus.RUNNING:
          result.runningJobs += count;
          break;
        case JobStatus.COMPLETED:
          result.completedJobs += count;
          break;
        case JobStatus.FAILED:
          result.failedJobs += count;
          break;
      }
    }

    return result;
  }

  /**
   * Get sync schedules for organization
   */
  static async getSyncSchedules(organizationId: string): Promise<SyncSchedule[]> {
    const connections = await prisma.integrationConnection.findMany({
      where: { organizationId },
      select: {
        id: true,
        connectionName: true,
        syncSchedule: true,
        lastSyncAt: true,
        nextSyncAt: true
      }
    });

    return connections
      .filter(conn => conn.syncSchedule)
      .map(conn => ({
        id: conn.id,
        connectionId: conn.id,
        cronExpression: conn.syncSchedule!,
        jobType: JobType.FULL_SYNC,
        isActive: true,
        lastRun: conn.lastSyncAt || undefined,
        nextRun: conn.nextSyncAt || undefined
      }));
  }

  /**
   * Update sync schedule
   */
  static async updateSyncSchedule(
    connectionId: string,
    cronExpression: string,
    isActive: boolean = true
  ): Promise<void> {
    const nextSyncTime = this.calculateNextSyncTime(cronExpression);
    
    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        syncSchedule: isActive ? cronExpression : null,
        nextSyncAt: isActive ? nextSyncTime : null
      }
    });
  }

  /**
   * Stop sync orchestration service
   */
  static async stopOrchestration(): Promise<void> {
    console.log('Stopping sync orchestration service...');
    // In a real implementation, this would stop the background processes
    console.log('Sync orchestration service stopped');
  }
}

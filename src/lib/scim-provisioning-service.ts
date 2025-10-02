import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

export interface SCIMUser {
  id: string;
  userName: string;
  name: {
    givenName: string;
    familyName: string;
    formatted?: string;
  };
  emails: Array<{
    value: string;
    type?: string;
    primary?: boolean;
  }>;
  active: boolean;
  groups?: Array<{
    value: string;
    display: string;
  }>;
  meta: {
    resourceType: string;
    created: string;
    lastModified: string;
    version: string;
  };
}

export interface SCIMGroup {
  id: string;
  displayName: string;
  members: Array<{
    value: string;
    display: string;
  }>;
  meta: {
    resourceType: string;
    created: string;
    lastModified: string;
    version: string;
  };
}

export interface SCIMEndpointConfig {
  id: string;
  organizationId: string;
  endpointUrl: string;
  bearerToken: string;
  syncFrequency: number;
}

export class SCIMProvisioningService {
  /**
   * Create SCIM endpoint configuration
   */
  async createEndpoint(config: SCIMEndpointConfig): Promise<void> {
    try {
      // Encrypt bearer token
      const encryptedToken = this.encryptToken(config.bearerToken);

      await prisma.sCIMEndpoint.create({
        data: {
          id: config.id,
          organizationId: config.organizationId,
          identityProviderId: config.id, // Assuming same as endpoint ID for now
          endpointUrl: config.endpointUrl,
          bearerToken: encryptedToken,
          syncFrequency: config.syncFrequency,
          syncStatus: 'PENDING',
        },
      });

    } catch (error) {
      console.error('SCIM endpoint creation error:', error);
      throw error;
    }
  }

  /**
   * Synchronize users from SCIM endpoint
   */
  async syncUsers(endpointId: string): Promise<{ created: number; updated: number; errors: number }> {
    try {
      const endpoint = await prisma.sCIMEndpoint.findUnique({
        where: { id: endpointId },
      });

      if (!endpoint) {
        throw new Error('SCIM endpoint not found');
      }

      // Decrypt bearer token
      const bearerToken = this.decryptToken(endpoint.bearerToken);

      // Update sync status
      await prisma.sCIMEndpoint.update({
        where: { id: endpointId },
        data: {
          syncStatus: 'IN_PROGRESS',
          lastSyncAt: new Date(),
        },
      });

      let created = 0;
      let updated = 0;
      let errors = 0;

      try {
        // Fetch users from SCIM endpoint
        const users = await this.fetchSCIMUsers(endpoint.endpointUrl, bearerToken);

        for (const scimUser of users) {
          try {
            const result = await this.processSCIMUser(scimUser, endpoint.organizationId);
            if (result === 'created') created++;
            else if (result === 'updated') updated++;
          } catch (error) {
            console.error(`Error processing SCIM user ${scimUser.id}:`, error);
            errors++;
            
            // Log provisioning audit
            await this.logProvisioningAudit(
              endpoint.organizationId,
              endpoint.identityProviderId,
              endpointId,
              'UPDATE',
              scimUser.id,
              'FAILURE',
              (error as Error).message
            );
          }
        }

        // Update sync status
        await prisma.sCIMEndpoint.update({
          where: { id: endpointId },
          data: {
            syncStatus: errors > 0 ? 'PARTIAL' : 'COMPLETED',
            errorLog: errors > 0 ? `Errors: ${errors}` : null,
          },
        });

      } catch (error) {
        // Update sync status to failed
        await prisma.sCIMEndpoint.update({
          where: { id: endpointId },
          data: {
            syncStatus: 'FAILED',
            errorLog: (error as Error).message,
          },
        });
        throw error;
      }

      return { created, updated, errors };

    } catch (error) {
      console.error('SCIM user sync error:', error);
      throw error;
    }
  }

  /**
   * Fetch users from SCIM endpoint
   */
  private async fetchSCIMUsers(endpointUrl: string, bearerToken: string): Promise<SCIMUser[]> {
    try {
      const response = await fetch(`${endpointUrl}/Users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Accept': 'application/scim+json',
          'Content-Type': 'application/scim+json',
        },
      });

      if (!response.ok) {
        throw new Error(`SCIM API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.Resources || [];

    } catch (error) {
      console.error('SCIM users fetch error:', error);
      throw error;
    }
  }

  /**
   * Process individual SCIM user
   */
  private async processSCIMUser(scimUser: SCIMUser, organizationId: string): Promise<'created' | 'updated'> {
    try {
      const primaryEmail = scimUser.emails.find(email => email.primary) || scimUser.emails[0];
      if (!primaryEmail) {
        throw new Error('No email found for SCIM user');
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: primaryEmail.value },
      });

      if (existingUser) {
        // Update existing user
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: scimUser.name.formatted || `${scimUser.name.givenName} ${scimUser.name.familyName}`,
            updatedAt: new Date(),
          },
        });

        // Update organization user relationship
        await prisma.organizationUser.upsert({
          where: {
            userId_organizationId: {
              userId: existingUser.id,
              organizationId,
            },
          },
          update: {
            isActive: scimUser.active,
            lastActiveAt: new Date(),
          },
          create: {
            userId: existingUser.id,
            organizationId,
            role: 'USER',
            isActive: scimUser.active,
          },
        });

        // Log provisioning audit
        await this.logProvisioningAudit(
          organizationId,
          'scim-endpoint',
          null,
          'UPDATE',
          existingUser.id,
          scimUser.id,
          'SUCCESS'
        );

        return 'updated';

      } else {
        // Create new user
        const newUser = await prisma.user.create({
          data: {
            email: primaryEmail.value,
            name: scimUser.name.formatted || `${scimUser.name.givenName} ${scimUser.name.familyName}`,
            emailVerified: new Date(),
          },
        });

        // Create organization user relationship
        await prisma.organizationUser.create({
          data: {
            userId: newUser.id,
            organizationId,
            role: 'USER',
            isActive: scimUser.active,
          },
        });

        // Log provisioning audit
        await this.logProvisioningAudit(
          organizationId,
          'scim-endpoint',
          null,
          'CREATE',
          newUser.id,
          scimUser.id,
          'SUCCESS'
        );

        return 'created';
      }

    } catch (error) {
      console.error('SCIM user processing error:', error);
      throw error;
    }
  }

  /**
   * Deactivate user via SCIM
   */
  async deactivateUser(userId: string, organizationId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update organization user relationship
      await prisma.organizationUser.updateMany({
        where: {
          userId,
          organizationId,
        },
        data: {
          isActive: false,
          lastActiveAt: new Date(),
        },
      });

      // Log provisioning audit
      await this.logProvisioningAudit(
        organizationId,
        'scim-endpoint',
        null,
        'SUSPEND',
        userId,
        null,
        'SUCCESS'
      );

    } catch (error) {
      console.error('SCIM user deactivation error:', error);
      throw error;
    }
  }

  /**
   * Sync groups from SCIM endpoint
   */
  async syncGroups(endpointId: string): Promise<{ created: number; updated: number; errors: number }> {
    try {
      const endpoint = await prisma.sCIMEndpoint.findUnique({
        where: { id: endpointId },
      });

      if (!endpoint) {
        throw new Error('SCIM endpoint not found');
      }

      const bearerToken = this.decryptToken(endpoint.bearerToken);

      let created = 0;
      let updated = 0;
      let errors = 0;

      try {
        // Fetch groups from SCIM endpoint
        const groups = await this.fetchSCIMGroups(endpoint.endpointUrl, bearerToken);

        for (const scimGroup of groups) {
          try {
            const result = await this.processSCIMGroup(scimGroup, endpoint.organizationId);
            if (result === 'created') created++;
            else if (result === 'updated') updated++;
          } catch (error) {
            console.error(`Error processing SCIM group ${scimGroup.id}:`, error);
            errors++;
          }
        }

      } catch (error) {
        console.error('SCIM group sync error:', error);
        throw error;
      }

      return { created, updated, errors };

    } catch (error) {
      console.error('SCIM group sync error:', error);
      throw error;
    }
  }

  /**
   * Fetch groups from SCIM endpoint
   */
  private async fetchSCIMGroups(endpointUrl: string, bearerToken: string): Promise<SCIMGroup[]> {
    try {
      const response = await fetch(`${endpointUrl}/Groups`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Accept': 'application/scim+json',
          'Content-Type': 'application/scim+json',
        },
      });

      if (!response.ok) {
        throw new Error(`SCIM API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.Resources || [];

    } catch (error) {
      console.error('SCIM groups fetch error:', error);
      throw error;
    }
  }

  /**
   * Process individual SCIM group
   */
  private async processSCIMGroup(scimGroup: SCIMGroup, organizationId: string): Promise<'created' | 'updated'> {
    try {
      // Check if organization role exists
      const existingRole = await prisma.organizationRole.findFirst({
        where: {
          organizationId,
          name: scimGroup.displayName,
        },
      });

      if (existingRole) {
        // Update existing role
        await prisma.organizationRole.update({
          where: { id: existingRole.id },
          data: {
            description: `SCIM group: ${scimGroup.displayName}`,
            updatedAt: new Date(),
          },
        });

        return 'updated';

      } else {
        // Create new organization role
        await prisma.organizationRole.create({
          data: {
            organizationId,
            name: scimGroup.displayName,
            description: `SCIM group: ${scimGroup.displayName}`,
            permissions: [], // Default permissions
            isActive: true,
          },
        });

        return 'created';
      }

    } catch (error) {
      console.error('SCIM group processing error:', error);
      throw error;
    }
  }

  /**
   * Log provisioning audit entry
   */
  private async logProvisioningAudit(
    organizationId: string,
    identityProviderId: string,
    scimEndpointId: string | null,
    action: string,
    userId: string | null,
    scimUserId: string | null,
    result: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.provisioningAudit.create({
        data: {
          organizationId,
          identityProviderId,
          scimEndpointId,
          action: action as 'CREATE' | 'UPDATE' | 'DELETE',
          userId,
          scimUserId,
          performedBy: 'SCIM_SYNC',
          details: {
            timestamp: new Date().toISOString(),
            action,
            result,
          },
          result,
          errorMessage,
        },
      });
    } catch (error) {
      console.error('Provisioning audit log error:', error);
    }
  }

  /**
   * Encrypt bearer token
   */
  private encryptToken(token: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt bearer token
   */
  private decryptToken(encryptedToken: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const [, encrypted] = encryptedToken.split(':');
    const decipher = crypto.createDecipher(algorithm, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Schedule automatic sync
   */
  async scheduleSync(endpointId: string): Promise<void> {
    try {
      const endpoint = await prisma.sCIMEndpoint.findUnique({
        where: { id: endpointId },
      });

      if (!endpoint) {
        throw new Error('SCIM endpoint not found');
      }

      // Schedule sync based on frequency
      const syncInterval = endpoint.syncFrequency * 1000; // Convert to milliseconds
      
      setInterval(async () => {
        try {
          await this.syncUsers(endpointId);
          await this.syncGroups(endpointId);
        } catch (error) {
          console.error('Scheduled SCIM sync error:', error);
        }
      }, syncInterval);

    } catch (error) {
      console.error('SCIM sync scheduling error:', error);
      throw error;
    }
  }

  /**
   * Get sync status for endpoint
   */
  async getSyncStatus(endpointId: string): Promise<{
    endpoint: unknown;
    lastSync: Date | null;
    syncStatus: string;
    totalUsers: number;
    syncErrors: number;
    nextSync: Date | null;
  }> {
    try {
      const endpoint = await prisma.sCIMEndpoint.findUnique({
        where: { id: endpointId },
        include: {
          provisioningAudit: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
        },
      });

      if (!endpoint) {
        throw new Error('SCIM endpoint not found');
      }

      return {
        endpoint: endpoint,
        lastSync: endpoint.lastSyncAt,
        syncStatus: endpoint.syncStatus,
        totalUsers: 0, // This would need to be calculated from actual user count
        syncErrors: 0, // This would need to be calculated from audit logs
        nextSync: null, // This would need to be calculated based on sync frequency
      };

    } catch (error) {
      console.error('Get SCIM sync status error:', error);
      throw error;
    }
  }
}

export const scimProvisioningService = new SCIMProvisioningService();

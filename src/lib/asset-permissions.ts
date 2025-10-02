import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface AssetPermissions {
  assets: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
  };
  vendors: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
  };
  software: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
  };
  licenses: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
  };
  systems: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
  };
  accessRegistry: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
  };
  importExport: {
    import: boolean;
    export: boolean;
  };
  reports: {
    generate: boolean;
    view: boolean;
  };
}

export class AssetPermissionManager {
  private static instance: AssetPermissionManager;
  private permissionCache = new Map<string, AssetPermissions>();

  static getInstance(): AssetPermissionManager {
    if (!AssetPermissionManager.instance) {
      AssetPermissionManager.instance = new AssetPermissionManager();
    }
    return AssetPermissionManager.instance;
  }

  async getUserPermissions(userId: string, organizationId: string): Promise<AssetPermissions> {
    const cacheKey = `${userId}-${organizationId}`;
    
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    try {
      // Get user's organization role
      const organizationUser = await prisma.organizationUser.findFirst({
        where: {
          userId,
          organizationId,
          isActive: true
        },
        include: {
          organization: {
            include: {
              roles: true
            }
          }
        }
      });

      if (!organizationUser) {
        return this.getDefaultPermissions();
      }

      // Get platform role for additional permissions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          platformRole: true
        }
      });

      const permissions = this.calculatePermissions(organizationUser.role, user?.platformRole?.permissions || []);

      this.permissionCache.set(cacheKey, permissions);
      return permissions;

    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return this.getDefaultPermissions();
    }
  }

  private calculatePermissions(orgRole: string, platformPermissions: string[]): AssetPermissions {
    const isPlatformAdmin = platformPermissions.includes('platform:admin');
    const isOrgAdmin = orgRole === 'admin';
    const isManager = orgRole === 'manager';
    const isAnalyst = orgRole === 'analyst';
    const isAuditor = orgRole === 'auditor';

    // Platform admins have full access
    if (isPlatformAdmin) {
      return this.getFullPermissions();
    }

    // Organization admins have full access within their org
    if (isOrgAdmin) {
      return this.getFullPermissions();
    }

    // Managers have most permissions except deletion
    if (isManager) {
      return {
        assets: { read: true, create: true, update: true, delete: false, export: true },
        vendors: { read: true, create: true, update: true, delete: false, export: true },
        software: { read: true, create: true, update: true, delete: false, export: true },
        licenses: { read: true, create: true, update: true, delete: false, export: true },
        systems: { read: true, create: true, update: true, delete: false, export: true },
        accessRegistry: { read: true, create: true, update: true, delete: false, export: true },
        importExport: { import: true, export: true },
        reports: { generate: true, view: true }
      };
    }

    // Analysts can create and update but not delete
    if (isAnalyst) {
      return {
        assets: { read: true, create: true, update: true, delete: false, export: true },
        vendors: { read: true, create: true, update: true, delete: false, export: false },
        software: { read: true, create: true, update: true, delete: false, export: false },
        licenses: { read: true, create: true, update: true, delete: false, export: false },
        systems: { read: true, create: true, update: true, delete: false, export: false },
        accessRegistry: { read: true, create: true, update: true, delete: false, export: false },
        importExport: { import: true, export: false },
        reports: { generate: false, view: true }
      };
    }

    // Auditors have read-only access
    if (isAuditor) {
      return {
        assets: { read: true, create: false, update: false, delete: false, export: true },
        vendors: { read: true, create: false, update: false, delete: false, export: true },
        software: { read: true, create: false, update: false, delete: false, export: true },
        licenses: { read: true, create: false, update: false, delete: false, export: true },
        systems: { read: true, create: false, update: false, delete: false, export: true },
        accessRegistry: { read: true, create: false, update: false, delete: false, export: true },
        importExport: { import: false, export: true },
        reports: { generate: false, view: true }
      };
    }

    // Default: minimal permissions
    return this.getDefaultPermissions();
  }

  private getFullPermissions(): AssetPermissions {
    return {
      assets: { read: true, create: true, update: true, delete: true, export: true },
      vendors: { read: true, create: true, update: true, delete: true, export: true },
      software: { read: true, create: true, update: true, delete: true, export: true },
      licenses: { read: true, create: true, update: true, delete: true, export: true },
      systems: { read: true, create: true, update: true, delete: true, export: true },
      accessRegistry: { read: true, create: true, update: true, delete: true, export: true },
      importExport: { import: true, export: true },
      reports: { generate: true, view: true }
    };
  }

  private getDefaultPermissions(): AssetPermissions {
    return {
      assets: { read: false, create: false, update: false, delete: false, export: false },
      vendors: { read: false, create: false, update: false, delete: false, export: false },
      software: { read: false, create: false, update: false, delete: false, export: false },
      licenses: { read: false, create: false, update: false, delete: false, export: false },
      systems: { read: false, create: false, update: false, delete: false, export: false },
      accessRegistry: { read: false, create: false, update: false, delete: false, export: false },
      importExport: { import: false, export: false },
      reports: { generate: false, view: false }
    };
  }

  clearCache(userId?: string, organizationId?: string): void {
    if (userId && organizationId) {
      this.permissionCache.delete(`${userId}-${organizationId}`);
    } else {
      this.permissionCache.clear();
    }
  }

  async checkPermission(
    userId: string, 
    organizationId: string, 
    resource: keyof AssetPermissions, 
    action: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, organizationId);
    const resourcePermissions = permissions[resource];

    if (typeof resourcePermissions === 'object' && resourcePermissions !== null) {
      return (resourcePermissions as Record<string, unknown>)[action] === true;
    }

    return false;
  }

  async requirePermission(
    userId: string, 
    organizationId: string, 
    resource: keyof AssetPermissions, 
    action: string
  ): Promise<void> {
    const hasPermission = await this.checkPermission(userId, organizationId, resource, action);
    
    if (!hasPermission) {
      throw new Error(`Insufficient permissions: ${resource}.${action}`);
    }
  }
}

// Helper function to get permissions from session
export async function getAssetPermissions(organizationId: string): Promise<AssetPermissions> {
  const session = await getServerSession(authOptions);
  
  if (!(session as unknown as { user?: { id?: string } })?.user?.id) {
    throw new Error('Unauthorized');
  }

  const permissionManager = AssetPermissionManager.getInstance();
  return await permissionManager.getUserPermissions((session as unknown as { user: { id: string } }).user.id, organizationId);
}

// Helper function to check specific permission
export async function checkAssetPermission(
  organizationId: string,
  resource: keyof AssetPermissions,
  action: string
): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!(session as unknown as { user?: { id?: string } })?.user?.id) {
    return false;
  }

  const permissionManager = AssetPermissionManager.getInstance();
  return await permissionManager.checkPermission((session as unknown as { user: { id: string } }).user.id, organizationId, resource, action);
}

// Helper function to require specific permission
export async function requireAssetPermission(
  organizationId: string,
  resource: keyof AssetPermissions,
  action: string
): Promise<void> {
  const session = await getServerSession(authOptions);
  
  if (!(session as unknown as { user?: { id?: string } })?.user?.id) {
    throw new Error('Unauthorized');
  }

  const permissionManager = AssetPermissionManager.getInstance();
  await permissionManager.requirePermission((session as unknown as { user: { id: string } }).user.id, organizationId, resource, action);
}

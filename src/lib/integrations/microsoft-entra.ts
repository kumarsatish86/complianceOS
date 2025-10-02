import { IntegrationCredentials, SyncResult } from '../integration-service';

export interface MicrosoftEntraConfig {
  credentials: IntegrationCredentials;
  tenantId: string;
  clientId: string;
}

export interface MicrosoftUser {
  id: string;
  userPrincipalName: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  accountEnabled: boolean;
  lastSignInDateTime?: string;
  createdDateTime: string;
  userType: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones: string[];
  signInActivity: {
    lastSignInDateTime?: string;
    lastSignInRequestId?: string;
  };
  assignedLicenses: Array<{
    disabledPlans: string[];
    skuId: string;
  }>;
}

export interface MicrosoftGroup {
  id: string;
  displayName: string;
  description?: string;
  mail?: string;
  mailEnabled: boolean;
  securityEnabled: boolean;
  groupTypes: string[];
  createdDateTime: string;
  members: Array<{
    id: string;
    displayName: string;
    userPrincipalName: string;
  }>;
  owners: Array<{
    id: string;
    displayName: string;
    userPrincipalName: string;
  }>;
}

export interface MicrosoftDevice {
  id: string;
  displayName: string;
  deviceId: string;
  deviceType: string;
  isCompliant: boolean;
  isManaged: boolean;
  operatingSystem: string;
  operatingSystemVersion: string;
  lastSignInDateTime?: string;
  createdDateTime: string;
  registeredOwners: Array<{
    id: string;
    displayName: string;
    userPrincipalName: string;
  }>;
}

export class MicrosoftEntraIntegration {
  private config: MicrosoftEntraConfig;
  private accessToken: string;
  private baseUrl: string;

  constructor(config: MicrosoftEntraConfig) {
    this.config = config;
    this.accessToken = config.credentials.accessToken || '';
    this.baseUrl = `https://graph.microsoft.com/v1.0`;
  }

  /**
   * Test connection to Microsoft Graph
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/me');
      return response.id !== undefined;
    } catch (error) {
      console.error('Microsoft Entra ID connection test failed:', error);
      return false;
    }
  }

  /**
   * Sync users from Microsoft Entra ID
   */
  async syncUsers(): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let errorsCount = 0;
    const errors: string[] = [];

    try {
      const users = await this.getAllUsers();
      recordsProcessed = users.length;

      // Process users and store in database
      for (const user of users) {
        try {
          await this.processUser(user);
        } catch (error) {
          errorsCount++;
          errors.push(error instanceof Error ? error.message : 'Unknown error');
        }
      }

      return {
        success: true,
        recordsProcessed,
        errorsCount,
        duration: Date.now() - startTime,
        metadata: {
          provider: 'microsoft_entra_id',
          dataType: 'users',
          syncTime: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed,
        errorsCount: errorsCount + 1,
        duration: Date.now() - startTime,
        errorDetails: error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) }
      };
    }
  }

  /**
   * Sync groups from Microsoft Entra ID
   */
  async syncGroups(): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let errorsCount = 0;
    const errors: string[] = [];

    try {
      const groups = await this.getAllGroups();
      recordsProcessed = groups.length;

      // Process groups and store in database
      for (const group of groups) {
        try {
          await this.processGroup(group);
        } catch (error) {
          errorsCount++;
          errors.push(error instanceof Error ? error.message : 'Unknown error');
        }
      }

      return {
        success: true,
        recordsProcessed,
        errorsCount,
        duration: Date.now() - startTime,
        metadata: {
          provider: 'microsoft_entra_id',
          dataType: 'groups',
          syncTime: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed,
        errorsCount: errorsCount + 1,
        duration: Date.now() - startTime,
        errorDetails: error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) }
      };
    }
  }

  /**
   * Sync devices from Microsoft Entra ID
   */
  async syncDevices(): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let errorsCount = 0;
    const errors: string[] = [];

    try {
      const devices = await this.getAllDevices();
      recordsProcessed = devices.length;

      // Process devices and store in database
      for (const device of devices) {
        try {
          await this.processDevice(device);
        } catch (error) {
          errorsCount++;
          errors.push(error instanceof Error ? error.message : 'Unknown error');
        }
      }

      return {
        success: true,
        recordsProcessed,
        errorsCount,
        duration: Date.now() - startTime,
        metadata: {
          provider: 'microsoft_entra_id',
          dataType: 'devices',
          syncTime: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed,
        errorsCount: errorsCount + 1,
        duration: Date.now() - startTime,
        errorDetails: error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) }
      };
    }
  }

  /**
   * Get all users from Microsoft Entra ID
   */
  private async getAllUsers(): Promise<MicrosoftUser[]> {
    const users: MicrosoftUser[] = [];
    let nextLink: string | undefined;

    do {
      const endpoint = nextLink || '/users';
      const response = await this.makeRequest(endpoint, {
        $select: 'id,userPrincipalName,displayName,givenName,surname,mail,accountEnabled,lastSignInDateTime,createdDateTime,userType,jobTitle,department,officeLocation,mobilePhone,businessPhones,signInActivity,assignedLicenses',
        $top: 999
      });

        if (response.value) {
          users.push(...(response.value as MicrosoftUser[]));
        }

      nextLink = response['@odata.nextLink'] as string | undefined;
    } while (nextLink);

    return users;
  }

  /**
   * Get all groups from Microsoft Entra ID
   */
  private async getAllGroups(): Promise<MicrosoftGroup[]> {
    const groups: MicrosoftGroup[] = [];
    let nextLink: string | undefined;

    do {
      const endpoint = nextLink || '/groups';
      const response = await this.makeRequest(endpoint, {
        $select: 'id,displayName,description,mail,mailEnabled,securityEnabled,groupTypes,createdDateTime',
        $top: 999
      });

        if (response.value) {
          groups.push(...(response.value as MicrosoftGroup[]));
        }

      nextLink = response['@odata.nextLink'] as string | undefined;
    } while (nextLink);

    return groups;
  }

  /**
   * Get all devices from Microsoft Entra ID
   */
  private async getAllDevices(): Promise<MicrosoftDevice[]> {
    const devices: MicrosoftDevice[] = [];
    let nextLink: string | undefined;

    do {
      const endpoint = nextLink || '/devices';
      const response = await this.makeRequest(endpoint, {
        $select: 'id,displayName,deviceId,deviceType,isCompliant,isManaged,operatingSystem,operatingSystemVersion,lastSignInDateTime,createdDateTime',
        $top: 999
      });

        if (response.value) {
          devices.push(...(response.value as MicrosoftDevice[]));
        }

      nextLink = response['@odata.nextLink'] as string | undefined;
    } while (nextLink);

    return devices;
  }

  /**
   * Process a user record
   */
  private async processUser(user: MicrosoftUser): Promise<void> {
    // This would store the user data in the database
    console.log(`Processing user: ${user.userPrincipalName}`);
    
    // In a real implementation, this would:
    // 1. Check if user exists in database
    // 2. Create or update user record
    // 3. Map to compliance controls
    // 4. Generate evidence if needed
  }

  /**
   * Process a group record
   */
  private async processGroup(group: MicrosoftGroup): Promise<void> {
    // This would store the group data in the database
    console.log(`Processing group: ${group.displayName}`);
    
    // In a real implementation, this would:
    // 1. Check if group exists in database
    // 2. Create or update group record
    // 3. Process group members
    // 4. Map to compliance controls
  }

  /**
   * Process a device record
   */
  private async processDevice(device: MicrosoftDevice): Promise<void> {
    // This would store the device data in the database
    console.log(`Processing device: ${device.displayName}`);
    
    // In a real implementation, this would:
    // 1. Check if device exists in database
    // 2. Create or update device record
    // 3. Map to compliance controls
    // 4. Generate evidence if needed
  }

  /**
   * Make authenticated request to Microsoft Graph API
   */
  private async makeRequest(endpoint: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, String(params[key]));
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token if needed
   */
  async refreshAccessToken(): Promise<string> {
    if (!this.config.credentials.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.credentials.clientSecret || '',
        refresh_token: this.config.credentials.refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/.default'
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    
    return data.access_token;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<MicrosoftUser | null> {
    try {
      const response = await this.makeRequest(`/users/${userId}`);
      return response as unknown as MicrosoftUser;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get group by ID
   */
  async getGroupById(groupId: string): Promise<MicrosoftGroup | null> {
    try {
      const response = await this.makeRequest(`/groups/${groupId}`);
      return response as unknown as MicrosoftGroup;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: string): Promise<Record<string, unknown>[]> {
    const members: Record<string, unknown>[] = [];
    let nextLink: string | undefined;

    do {
      const endpoint = nextLink || `/groups/${groupId}/members`;
      const response = await this.makeRequest(endpoint, {
        $top: 999
      });

        if (response.value) {
          members.push(...(response.value as Record<string, unknown>[]));
        }

      nextLink = response['@odata.nextLink'] as string | undefined;
    } while (nextLink);

    return members;
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(startDate: Date, endDate: Date): Promise<Record<string, unknown>[]> {
    const logs: Record<string, unknown>[] = [];
    let nextLink: string | undefined;

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    do {
      const endpoint = nextLink || '/auditLogs/signIns';
      const response = await this.makeRequest(endpoint, {
        $filter: `createdDateTime ge ${startDateStr} and createdDateTime le ${endDateStr}`,
        $top: 999
      });

        if (response.value) {
          logs.push(...(response.value as Record<string, unknown>[]));
        }

      nextLink = response['@odata.nextLink'] as string | undefined;
    } while (nextLink);

    return logs;
  }
}

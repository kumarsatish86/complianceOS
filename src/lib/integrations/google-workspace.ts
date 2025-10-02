import { IntegrationCredentials, SyncResult } from '../integration-service';

export interface GoogleWorkspaceConfig {
  credentials: IntegrationCredentials;
  domain: string;
  adminEmail: string;
}

export interface GoogleUser {
  id: string;
  primaryEmail: string;
  name: {
    givenName: string;
    familyName: string;
    fullName: string;
  };
  suspended: boolean;
  lastLoginTime?: string;
  creationTime: string;
  orgUnitPath: string;
  isAdmin: boolean;
  isDelegatedAdmin: boolean;
  changePasswordAtNextLogin: boolean;
  ipWhitelisted: boolean;
  emails: Array<{
    address: string;
    type: string;
  }>;
  aliases: string[];
  nonEditableAliases: string[];
}

export interface GoogleGroup {
  id: string;
  email: string;
  name: string;
  description: string;
  directMembersCount: number;
  adminCreated: boolean;
  members: Array<{
    id: string;
    email: string;
    role: string;
    type: string;
  }>;
}

export interface GoogleDevice {
  deviceId: string;
  deviceType: string;
  model: string;
  osVersion: string;
  lastSyncTime: string;
  userAgent: string;
  owner: string;
}

export class GoogleWorkspaceIntegration {
  private config: GoogleWorkspaceConfig;
  private accessToken: string;

  constructor(config: GoogleWorkspaceConfig) {
    this.config = config;
    this.accessToken = config.credentials.accessToken || '';
  }

  /**
   * Test connection to Google Workspace
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/admin/directory/v1/users/me');
      return response.status === 200;
    } catch (error) {
      console.error('Google Workspace connection test failed:', error);
      return false;
    }
  }

  /**
   * Sync users from Google Workspace
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
          provider: 'google_workspace',
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
   * Sync groups from Google Workspace
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
          provider: 'google_workspace',
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
   * Sync devices from Google Workspace
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
          provider: 'google_workspace',
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
   * Get all users from Google Workspace
   */
  private async getAllUsers(): Promise<GoogleUser[]> {
    const users: GoogleUser[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.makeRequest('/admin/directory/v1/users', {
        domain: this.config.domain,
        maxResults: 500,
        pageToken
      });

        if (response.users) {
          users.push(...(response.users as GoogleUser[]));
        }

      pageToken = response.nextPageToken as string | undefined;
    } while (pageToken);

    return users;
  }

  /**
   * Get all groups from Google Workspace
   */
  private async getAllGroups(): Promise<GoogleGroup[]> {
    const groups: GoogleGroup[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.makeRequest('/admin/directory/v1/groups', {
        domain: this.config.domain,
        maxResults: 500,
        pageToken
      });

        if (response.groups) {
          groups.push(...(response.groups as GoogleGroup[]));
        }

      pageToken = response.nextPageToken as string | undefined;
    } while (pageToken);

    return groups;
  }

  /**
   * Get all devices from Google Workspace
   */
  private async getAllDevices(): Promise<GoogleDevice[]> {
    const devices: GoogleDevice[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.makeRequest('/admin/directory/v1/customer/my_customer/devices/mobile', {
        maxResults: 500,
        pageToken
      });

        if (response.mobiledevices) {
          devices.push(...(response.mobiledevices as GoogleDevice[]));
        }

      pageToken = response.nextPageToken as string | undefined;
    } while (pageToken);

    return devices;
  }

  /**
   * Process a user record
   */
  private async processUser(user: GoogleUser): Promise<void> {
    // This would store the user data in the database
    // For now, we'll just log it
    console.log(`Processing user: ${user.primaryEmail}`);
    
    // In a real implementation, this would:
    // 1. Check if user exists in database
    // 2. Create or update user record
    // 3. Map to compliance controls
    // 4. Generate evidence if needed
  }

  /**
   * Process a group record
   */
  private async processGroup(group: GoogleGroup): Promise<void> {
    // This would store the group data in the database
    console.log(`Processing group: ${group.email}`);
    
    // In a real implementation, this would:
    // 1. Check if group exists in database
    // 2. Create or update group record
    // 3. Process group members
    // 4. Map to compliance controls
  }

  /**
   * Process a device record
   */
  private async processDevice(device: GoogleDevice): Promise<void> {
    // This would store the device data in the database
    console.log(`Processing device: ${device.deviceId}`);
    
    // In a real implementation, this would:
    // 1. Check if device exists in database
    // 2. Create or update device record
    // 3. Map to compliance controls
    // 4. Generate evidence if needed
  }

  /**
   * Make authenticated request to Google Workspace API
   */
  private async makeRequest(endpoint: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const url = new URL(`https://www.googleapis.com${endpoint}`);
    
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
      throw new Error(`Google Workspace API error: ${response.status} ${response.statusText}`);
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

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.config.credentials.clientId || '',
        client_secret: this.config.credentials.clientSecret || '',
        refresh_token: this.config.credentials.refreshToken,
        grant_type: 'refresh_token'
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
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<GoogleUser | null> {
    try {
      const response = await this.makeRequest(`/admin/directory/v1/users/${email}`);
      return response as unknown as GoogleUser;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get group by email
   */
  async getGroupByEmail(email: string): Promise<GoogleGroup | null> {
    try {
      const response = await this.makeRequest(`/admin/directory/v1/groups/${email}`);
      return response as unknown as GoogleGroup;
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
  async getGroupMembers(groupEmail: string): Promise<Record<string, unknown>[]> {
    const members: Record<string, unknown>[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.makeRequest(`/admin/directory/v1/groups/${groupEmail}/members`, {
        maxResults: 500,
        pageToken
      });

        if (response.members) {
          members.push(...(response.members as Record<string, unknown>[]));
        }

      pageToken = response.nextPageToken as string | undefined;
    } while (pageToken);

    return members;
  }
}

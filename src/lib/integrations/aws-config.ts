import { IntegrationCredentials, SyncResult } from '../integration-service';

export interface AWSConfigCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  sessionToken?: string;
}

export interface AWSConfigItem {
  configurationItemId: string;
  configurationItemStatus: string;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  configurationItemCaptureTime: string;
  configurationItemMD5Hash: string;
  arn: string;
  resourceCreationTime?: string;
  tags?: Record<string, string>;
  configuration: Record<string, unknown>;
  supplementaryConfiguration?: Record<string, unknown>;
  relationships?: Array<{
    resourceType: string;
    resourceId: string;
    resourceName?: string;
    relationshipName: string;
  }>;
}

export interface AWSConfigRule {
  configRuleName: string;
  configRuleArn: string;
  configRuleId: string;
  description?: string;
  scope: {
    complianceResourceTypes?: string[];
    tagKey?: string;
    tagValue?: string;
  };
  source: {
    owner: string;
    sourceIdentifier: string;
    sourceDetails?: Record<string, unknown>[];
  };
  inputParameters?: string;
  maximumExecutionFrequency?: string;
  configRuleState: string;
  createdBy?: string;
}

export interface AWSComplianceResult {
  configRuleName: string;
  complianceType: string;
  complianceContributorCount?: {
    cappedCount: number;
    capExceeded: boolean;
  };
  orderingTimestamp: string;
  annotation?: string;
}

export class AWSConfigIntegration {
  private credentials: AWSConfigCredentials;
  private region: string;

  constructor(credentials: IntegrationCredentials) {
    this.credentials = {
      accessKeyId: credentials.apiKey || '',
      secretAccessKey: credentials.serviceAccountKey || '',
      region: credentials.domain || 'us-east-1',
      sessionToken: credentials.accessToken
    };
    this.region = this.credentials.region;
  }

  /**
   * Test connection to AWS Config
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('DescribeConfigurationRecorders');
      return response.ConfigurationRecorders !== undefined;
    } catch (error) {
      console.error('AWS Config connection test failed:', error);
      return false;
    }
  }

  /**
   * Sync configuration items from AWS Config
   */
  async syncConfigurationItems(): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let errorsCount = 0;
    const errors: string[] = [];

    try {
      const configItems = await this.getAllConfigurationItems();
      recordsProcessed = configItems.length;

      // Process configuration items and store in database
      for (const item of configItems) {
        try {
          await this.processConfigurationItem(item);
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
          provider: 'aws_config',
          dataType: 'configuration_items',
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
   * Sync configuration rules from AWS Config
   */
  async syncConfigurationRules(): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let errorsCount = 0;
    const errors: string[] = [];

    try {
      const rules = await this.getAllConfigurationRules();
      recordsProcessed = rules.length;

      // Process rules and store in database
      for (const rule of rules) {
        try {
          await this.processConfigurationRule(rule);
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
          provider: 'aws_config',
          dataType: 'configuration_rules',
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
   * Sync compliance results from AWS Config
   */
  async syncComplianceResults(): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let errorsCount = 0;
    const errors: string[] = [];

    try {
      const results = await this.getAllComplianceResults();
      recordsProcessed = results.length;

      // Process compliance results and store in database
      for (const result of results) {
        try {
          await this.processComplianceResult(result);
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
          provider: 'aws_config',
          dataType: 'compliance_results',
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
   * Get all configuration items
   */
  private async getAllConfigurationItems(): Promise<AWSConfigItem[]> {
    const items: AWSConfigItem[] = [];
    let nextToken: string | undefined;

    do {
      const response = await this.makeRequest('GetResourceConfigHistory', {
        resourceType: 'AWS::EC2::Instance',
        laterTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        earlierTime: new Date(),
        limit: 100,
        nextToken
      });

        if (response.configurationItems) {
          items.push(...(response.configurationItems as AWSConfigItem[]));
        }

      nextToken = response.nextToken as string | undefined;
    } while (nextToken);

    return items;
  }

  /**
   * Get all configuration rules
   */
  private async getAllConfigurationRules(): Promise<AWSConfigRule[]> {
    const rules: AWSConfigRule[] = [];
    let nextToken: string | undefined;

    do {
      const response = await this.makeRequest('DescribeConfigRules', {
        nextToken
      });

        if (response.ConfigRules) {
          rules.push(...(response.ConfigRules as AWSConfigRule[]));
        }

      nextToken = response.nextToken as string | undefined;
    } while (nextToken);

    return rules;
  }

  /**
   * Get all compliance results
   */
  private async getAllComplianceResults(): Promise<AWSComplianceResult[]> {
    const results: AWSComplianceResult[] = [];
    let nextToken: string | undefined;

    do {
      const response = await this.makeRequest('GetComplianceDetailsByConfigRule', {
        configRuleName: 'required-tags',
        nextToken
      });

        if (response.EvaluationResults) {
          results.push(...(response.EvaluationResults as AWSComplianceResult[]));
        }

      nextToken = response.nextToken as string | undefined;
    } while (nextToken);

    return results;
  }

  /**
   * Process a configuration item
   */
  private async processConfigurationItem(item: AWSConfigItem): Promise<void> {
    // This would store the configuration item in the database
    console.log(`Processing configuration item: ${item.resourceId}`);
    
    // In a real implementation, this would:
    // 1. Check if item exists in database
    // 2. Create or update configuration item record
    // 3. Map to compliance controls
    // 4. Generate evidence if needed
  }

  /**
   * Process a configuration rule
   */
  private async processConfigurationRule(rule: AWSConfigRule): Promise<void> {
    // This would store the rule in the database
    console.log(`Processing configuration rule: ${rule.configRuleName}`);
    
    // In a real implementation, this would:
    // 1. Check if rule exists in database
    // 2. Create or update rule record
    // 3. Map to compliance controls
  }

  /**
   * Process a compliance result
   */
  private async processComplianceResult(result: AWSComplianceResult): Promise<void> {
    // This would store the compliance result in the database
    console.log(`Processing compliance result: ${result.configRuleName}`);
    
    // In a real implementation, this would:
    // 1. Check if result exists in database
    // 2. Create or update compliance result record
    // 3. Map to compliance controls
    // 4. Generate evidence if needed
  }

  /**
   * Make authenticated request to AWS Config API
   */
  private async makeRequest(_action: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const url = new URL(`https://config.${this.region}.amazonaws.com/`);
    
    // AWS Config uses POST requests with form data
    const formData = new URLSearchParams();
    formData.append('Action', _action);
    formData.append('Version', '2014-11-12');
    
    // Add parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        if (params[key] instanceof Date) {
          formData.append(key, params[key].toISOString());
        } else if (Array.isArray(params[key])) {
          params[key].forEach((item: unknown, index: number) => {
            formData.append(`${key}.${index + 1}`, String(item));
          });
        } else {
          formData.append(key, String(params[key]));
        }
      }
    });

    // Create AWS signature
    const signature = this.createAWSSignature();

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': signature,
        'X-Amz-Date': new Date().toISOString().replace(/[:\-]|\.\d{3}/g, ''),
        'X-Amz-Target': `StarlingDoveService.${_action}`
      },
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error(`AWS Config API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create AWS signature for authentication
   */
  private createAWSSignature(): string {
    // This is a simplified signature creation
    // In production, use AWS SDK or proper signature implementation
    const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const date = timestamp.substr(0, 8);
    
    // Simplified signature - in production, implement proper AWS signature v4
    return `AWS4-HMAC-SHA256 Credential=${this.credentials.accessKeyId}/${date}/${this.region}/config/aws4_request, SignedHeaders=host;x-amz-date, Signature=simplified-signature`;
  }

  /**
   * Get configuration item by resource ID
   */
  async getConfigurationItemByResourceId(resourceId: string, resourceType: string): Promise<AWSConfigItem | null> {
    try {
      const response = await this.makeRequest('GetResourceConfigHistory', {
        resourceType,
        resourceId,
        laterTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        earlierTime: new Date(),
        limit: 1
      });

      if (response.configurationItems && Array.isArray(response.configurationItems) && response.configurationItems.length > 0) {
        return response.configurationItems[0];
      }

      return null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get compliance summary
   */
  async getComplianceSummary(): Promise<{
    compliant: number;
    nonCompliant: number;
    notApplicable: number;
    insufficientData: number;
  }> {
    try {
      const response = await this.makeRequest('GetComplianceSummaryByConfigRule');
      
      return {
        compliant: (response.ComplianceSummary as Record<string, unknown>)?.CompliantResourceCount as number || 0,
        nonCompliant: (response.ComplianceSummary as Record<string, unknown>)?.NonCompliantResourceCount as number || 0,
        notApplicable: (response.ComplianceSummary as Record<string, unknown>)?.NotApplicableResourceCount as number || 0,
        insufficientData: (response.ComplianceSummary as Record<string, unknown>)?.InsufficientDataResourceCount as number || 0
      };
    } catch (error) {
      console.error('Error getting compliance summary:', error);
      return {
        compliant: 0,
        nonCompliant: 0,
        notApplicable: 0,
        insufficientData: 0
      };
    }
  }

  /**
   * Get resource inventory
   */
  async getResourceInventory(resourceType?: string): Promise<AWSConfigItem[]> {
    const items: AWSConfigItem[] = [];
    let nextToken: string | undefined;

    do {
      const params: Record<string, unknown> = { nextToken };
      if (resourceType) {
        params.resourceType = resourceType;
      }

      const response = await this.makeRequest('ListDiscoveredResources', params);

      if (response.resourceIdentifiers) {
        // Get detailed configuration for each resource
        for (const resource of (response.resourceIdentifiers as unknown[])) {
          try {
            const configItem = await this.getConfigurationItemByResourceId(
              (resource as Record<string, unknown>).resourceId as string,
              (resource as Record<string, unknown>).resourceType as string
            );
            if (configItem) {
              items.push(configItem);
            }
          } catch (error) {
            console.error(`Error getting config for resource ${(resource as Record<string, unknown>).resourceId}:`, error);
          }
        }
      }

      nextToken = response.nextToken as string | undefined;
    } while (nextToken);

    return items;
  }
}

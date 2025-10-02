import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const forge = require('node-forge');

const prisma = new PrismaClient();

export interface EncryptionConfig {
  organizationId: string;
  keyManagementType: 'HSM' | 'CLOUD_KMS' | 'BYOK' | 'SOFTWARE';
  kmsProvider?: string;
  byokEnabled: boolean;
  clientSideEncryption: boolean;
  keyRotationPolicy: {
    rotationInterval: number; // days
    autoRotation: boolean;
    notificationDays: number[];
  };
  complianceRequirements: string[];
}

export interface EncryptionKey {
  id: string;
  keyType: 'AES_256' | 'RSA_2048' | 'RSA_4096' | 'ECDSA_P256' | 'ECDSA_P384' | 'ECDSA_P521';
  keyMaterial: string;
  version: number;
  createdAt: Date;
  expiresAt?: Date;
  status: 'ACTIVE' | 'ROTATING' | 'EXPIRED' | 'REVOKED';
}

export interface EncryptedData {
  encryptedData: string;
  keyId: string;
  _iv: string;
  tag: string;
  algorithm: string;
}

export class EnterpriseEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly _keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  /**
   * Initialize encryption configuration for organization
   */
  async initializeEncryption(config: EncryptionConfig): Promise<void> {
    try {
      // Check if encryption config already exists
      const existingConfig = await prisma.encryptionConfig.findUnique({
        where: { organizationId: config.organizationId },
      });

      if (existingConfig) {
        throw new Error('Encryption configuration already exists for organization');
      }

      // Create encryption configuration
      await prisma.encryptionConfig.create({
        data: {
          organizationId: config.organizationId,
          keyManagementType: config.keyManagementType,
          kmsProvider: config.kmsProvider,
          byokEnabled: config.byokEnabled,
          clientSideEncryption: config.clientSideEncryption,
          keyRotationPolicy: config.keyRotationPolicy,
          complianceRequirements: config.complianceRequirements,
        },
      });

      // Generate initial encryption key
      await this.generateEncryptionKey(config.organizationId, 'AES_256');

    } catch (error) {
      console.error('Encryption initialization error:', error);
      throw error;
    }
  }

  /**
   * Generate new encryption key
   */
  async generateEncryptionKey(organizationId: string, keyType: string): Promise<EncryptionKey> {
    try {
      const config = await prisma.encryptionConfig.findUnique({
        where: { organizationId },
      });

      if (!config) {
        throw new Error('Encryption configuration not found');
      }

      let keyMaterial: string;
      switch (keyType) {
        case 'AES_256':
          keyMaterial = crypto.randomBytes(32).toString('hex');
          break;
        case 'RSA_2048':
          const rsaKeyPair = forge.pki.rsa.generateKeyPair(2048);
          keyMaterial = forge.pki.privateKeyToPem(rsaKeyPair.privateKey);
          break;
        case 'RSA_4096':
          const rsaKeyPair4096 = forge.pki.rsa.generateKeyPair(4096);
          keyMaterial = forge.pki.privateKeyToPem(rsaKeyPair4096.privateKey);
          break;
        case 'ECDSA_P256':
          const ecKeyPair = forge.pki.ec.generateKeyPair(forge.pki.ec.namedCurves.p256);
          keyMaterial = forge.pki.privateKeyToPem(ecKeyPair.privateKey);
          break;
        default:
          throw new Error(`Unsupported key type: ${keyType}`);
      }

      // Encrypt key material with master key
      const encryptedKeyMaterial = this.encryptKeyMaterial(keyMaterial);

      // Store encryption key
      const encryptionKey = await prisma.encryptionConfig.create({
        data: {
          organizationId,
          keyManagementType: keyType,
          kmsProvider: null,
          byokEnabled: false,
          clientSideEncryption: false,
          keyRotationPolicy: undefined,
          complianceRequirements: undefined,
        },
      });

      return {
        id: encryptionKey.id,
        keyType: encryptionKey.keyManagementType as 'AES_256' | 'RSA_2048' | 'RSA_4096' | 'ECDSA_P256' | 'ECDSA_P384' | 'ECDSA_P521',
        keyMaterial: encryptedKeyMaterial,
        version: 1,
        createdAt: encryptionKey.createdAt,
        expiresAt: undefined,
        status: 'ACTIVE',
      };

    } catch (error) {
      console.error('Encryption key generation error:', error);
      throw error;
    }
  }

  /**
   * Encrypt data with organization's encryption key
   */
  async encryptData(organizationId: string, data: string): Promise<EncryptedData> {
    try {
      const encryptionKey = await this.getActiveEncryptionKey(organizationId);
      if (!encryptionKey) {
        throw new Error('No active encryption key found');
      }
      const keyMaterial = this.decryptKeyMaterial(encryptionKey.keyMaterial);

      // Generate random IV
      const _iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, Buffer.from(keyMaterial, 'hex'));

      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const tag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        keyId: encryptionKey.id,
        _iv: _iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: this.algorithm,
      };

    } catch (error) {
      console.error('Data encryption error:', error);
      throw error;
    }
  }

  /**
   * Decrypt data with organization's encryption key
   */
  async decryptData(organizationId: string, encryptedData: EncryptedData): Promise<string> {
    try {
      const encryptionKey = await prisma.encryptionConfig.findUnique({
        where: { organizationId },
      });

      if (!encryptionKey) {
        throw new Error('Encryption key not found');
      }

      const keyMaterial = this.decryptKeyMaterial(''); // Placeholder - need to implement proper key storage

      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, Buffer.from(keyMaterial, 'hex'));

      // Set authentication tag
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

      // Decrypt data
      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;

    } catch (error) {
      console.error('Data decryption error:', error);
      throw error;
    }
  }

  /**
   * Rotate encryption key
   */
  async rotateEncryptionKey(organizationId: string): Promise<EncryptionKey> {
    try {
      const config = await prisma.encryptionConfig.findUnique({
        where: { organizationId },
      });

      if (!config) {
        throw new Error('Encryption configuration not found');
      }

      // Mark current key as rotating
      await prisma.encryptionConfig.updateMany({
        where: {
          organizationId,
        },
        data: {
          keyManagementType: 'ROTATING',
        },
      });

      // Generate new key
      const newKey = await this.generateEncryptionKey(organizationId, 'AES_256');

      // Mark old keys as expired
      await prisma.encryptionConfig.updateMany({
        where: {
          organizationId,
          keyManagementType: 'ROTATING',
        },
        data: {
          keyManagementType: 'EXPIRED',
        },
      });

      // Log key rotation
      await this.logSecurityEvent(organizationId, 'KEY_ROTATION', {
        oldKeyId: 'multiple',
        newKeyId: newKey.id,
        rotationReason: 'SCHEDULED_ROTATION',
      });

      return newKey;

    } catch (error) {
      console.error('Key rotation error:', error);
      throw error;
    }
  }

  /**
   * Get active encryption key for organization
   */
  private async getActiveEncryptionKey(organizationId: string): Promise<{
    id: string;
    keyType: string;
    keyMaterial: string;
    version: number;
    status: string;
    expiresAt: Date | null;
  } | null> {
    const encryptionKey = await prisma.encryptionConfig.findFirst({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!encryptionKey) {
      throw new Error('No active encryption key found for organization');
    }

    return {
      id: encryptionKey.id,
      keyType: encryptionKey.keyManagementType,
      keyMaterial: '', // Placeholder - need to implement proper key storage
      version: 1,
      status: 'ACTIVE',
      expiresAt: null,
    };
  }

  /**
   * Encrypt key material with master key
   */
  private encryptKeyMaterial(keyMaterial: string): string {
    const masterKey = this.getMasterKey();
    const _iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', masterKey);
    
    let encrypted = cipher.update(keyMaterial, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return _iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt key material with master key
   */
  private decryptKeyMaterial(encryptedKeyMaterial: string): string {
    const masterKey = this.getMasterKey();
    const [, encrypted] = encryptedKeyMaterial.split(':');
    const decipher = crypto.createDecipher('aes-256-cbc', masterKey);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Get master encryption key
   */
  private getMasterKey(): string {
    const masterKey = process.env.MASTER_ENCRYPTION_KEY;
    if (!masterKey) {
      throw new Error('Master encryption key not configured');
    }
    return masterKey;
  }

  /**
   * Calculate key expiry date based on rotation policy
   */
  private calculateKeyExpiry(rotationPolicy: Record<string, unknown>): Date {
    const rotationInterval = (rotationPolicy.rotationInterval as number) || 90; // days
    return new Date(Date.now() + rotationInterval * 24 * 60 * 60 * 1000);
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(
    organizationId: string,
    eventType: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await prisma.securityAuditLog.create({
        data: {
          organizationId,
          eventType: eventType as 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PERMISSION_CHANGE' | 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'SUSPICIOUS_ACTIVITY' | 'SECURITY_VIOLATION' | 'SYSTEM_ERROR',
          action: 'ENCRYPTION_KEY_ROTATION',
          metadata: JSON.parse(JSON.stringify(metadata)),
          riskScore: 0.1, // Low risk for scheduled operations
        },
      });
    } catch (error) {
      console.error('Security event logging error:', error);
    }
  }

  /**
   * Check if key rotation is needed
   */
  async checkKeyRotationNeeded(organizationId: string): Promise<boolean> {
    try {
      const config = await prisma.encryptionConfig.findUnique({
        where: { organizationId },
      });

      if (!config) {
        return false;
      }

      const activeKey = await prisma.encryptionConfig.findFirst({
        where: {
          organizationId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!activeKey) {
        return true; // No active key, need to generate one
      }

      // Check if key needs rotation based on creation date
      const keyAge = Date.now() - activeKey.createdAt.getTime();
      const rotationInterval = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
      
      if (keyAge > rotationInterval) {
        return true; // Key is old, needs rotation
      }

      // Check rotation policy
      const policyRotationInterval = (config.keyRotationPolicy as Record<string, unknown>)?.rotationInterval as number || 90;
      const daysSinceCreation = Math.floor(
        (Date.now() - activeKey.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      );

      return daysSinceCreation >= policyRotationInterval;

    } catch (error) {
      console.error('Key rotation check error:', error);
      return false;
    }
  }

  /**
   * Get encryption status for organization
   */
  async getEncryptionStatus(organizationId: string): Promise<{
    hasActiveKey: boolean;
    keyCount: number;
    lastRotation: Date | null;
    nextRotation: Date | null;
    encryptionEnabled: boolean;
  }> {
    try {
      const config = await prisma.encryptionConfig.findUnique({
        where: { organizationId },
      });

      if (!config) {
        return {
          hasActiveKey: false,
          keyCount: 0,
          lastRotation: null,
          nextRotation: null,
          encryptionEnabled: false
        };
      }

      const activeKey = await prisma.encryptionConfig.findFirst({
        where: {
          organizationId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const rotationNeeded = await this.checkKeyRotationNeeded(organizationId);

      return {
        hasActiveKey: !!activeKey,
        keyCount: 1,
        lastRotation: activeKey?.createdAt || null,
        nextRotation: rotationNeeded ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
        encryptionEnabled: config.clientSideEncryption || false
      };

    } catch (error) {
      console.error('Get encryption status error:', error);
      throw error;
    }
  }

  /**
   * Validate encryption compliance
   */
  async validateCompliance(organizationId: string): Promise<{
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
    complianceScore: number;
  }> {
    try {
      const config = await prisma.encryptionConfig.findUnique({
        where: { organizationId },
      });

      if (!config) {
        return {
          isCompliant: false,
          violations: ['Encryption not configured'],
          recommendations: ['Configure encryption settings'],
          complianceScore: 0,
        };
      }

      const issues: string[] = [];
      const activeKey = await prisma.encryptionConfig.findFirst({
        where: {
          organizationId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!activeKey) {
        issues.push('No active encryption key');
      }

      // Check if key rotation is needed
      const rotationNeeded = await this.checkKeyRotationNeeded(organizationId);
      if (rotationNeeded) {
        issues.push('Encryption key rotation needed');
      }

      // Check compliance requirements
      const complianceReqs = config.complianceRequirements as string[] || [];
      for (const requirement of complianceReqs) {
        switch (requirement) {
          case 'FIPS_140_2':
            if (config.keyManagementType !== 'HSM') {
              issues.push('FIPS 140-2 compliance requires HSM key management');
            }
            break;
          case 'GDPR':
            if (!config.clientSideEncryption) {
              issues.push('GDPR compliance requires client-side encryption');
            }
            break;
          case 'SOX':
            const rotationPolicy = config.keyRotationPolicy as Record<string, unknown>;
            if (!rotationPolicy?.autoRotation) {
              issues.push('SOX compliance requires automatic key rotation');
            }
            break;
        }
      }

      return {
        isCompliant: issues.length === 0,
        violations: issues,
        recommendations: issues.length > 0 ? ['Review encryption configuration'] : [],
        complianceScore: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 20)),
      };

    } catch (error) {
      console.error('Compliance validation error:', error);
      throw error;
    }
  }
}

export const enterpriseEncryptionService = new EnterpriseEncryptionService();

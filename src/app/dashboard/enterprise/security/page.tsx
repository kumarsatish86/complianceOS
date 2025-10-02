'use client';

import React, { useState, useEffect } from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, 
  Key, 
  Lock,
  CheckCircle,
  Activity,
  Settings,
  Database,
  Eye } from 'lucide-react';

interface EncryptionStatus {
  configured: boolean;
  keyManagementType: string;
  kmsProvider?: string;
  byokEnabled: boolean;
  clientSideEncryption: boolean;
  activeKey?: {
    keyType: string;
    version: string;
    createdAt: string;
    expiresAt?: string;
  };
  rotationNeeded: boolean;
  complianceRequirements: string[];
}

interface SecurityPolicy {
  id: string;
  policyType: string;
  enforcementLevel: string;
  effectiveDate: string;
  nextReviewDate?: string;
}

export default function SecuritySettingsPage() {
  const [encryptionStatus, setEncryptionStatus] = useState<EncryptionStatus | null>(null);
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      setLoading(true);
      
      // Fetch encryption status
      const encryptionResponse = await fetch('/api/enterprise/encryption?organizationId=default-org');
      if (encryptionResponse.ok) {
        const encryptionData = await encryptionResponse.json();
        setEncryptionStatus(encryptionData);
      }

      // TODO: Fetch security policies when API is available
      // For now, use mock data
      setSecurityPolicies([
        {
          id: '1',
          policyType: 'ACCESS_CONTROL',
          enforcementLevel: 'STRICT',
          effectiveDate: '2024-01-01',
          nextReviewDate: '2025-01-01',
        },
        {
          id: '2',
          policyType: 'DATA_ENCRYPTION',
          enforcementLevel: 'STRICT',
          effectiveDate: '2024-01-01',
          nextReviewDate: '2025-01-01',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch security settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyRotation = async () => {
    try {
      const response = await fetch('/api/enterprise/encryption/rotate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: 'default-org',
        }),
      });

      if (response.ok) {
        // Refresh encryption status
        fetchSecuritySettings();
      }
    } catch (error) {
      console.error('Failed to rotate encryption key:', error);
    }
  };

  const getPolicyTypeLabel = (type: string) => {
    switch (type) {
      case 'ACCESS_CONTROL': return 'Access Control';
      case 'DATA_ENCRYPTION': return 'Data Encryption';
      case 'AUDIT_LOGGING': return 'Audit Logging';
      case 'THREAT_DETECTION': return 'Threat Detection';
      case 'COMPLIANCE_MONITORING': return 'Compliance Monitoring';
      case 'INCIDENT_RESPONSE': return 'Incident Response';
      default: return type;
    }
  };

  const getEnforcementLevelColor = (level: string) => {
    switch (level) {
      case 'STRICT': return 'bg-red-100 text-red-800';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800';
      case 'PERMISSIVE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <PlatformAdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 animate-spin" />
              <span>Loading security settings...</span>
            </div>
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Security Settings</h1>
            <p className="text-gray-600 mt-2">
              Advanced security configuration and encryption management
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configure Security
          </Button>
        </div>

        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Encryption Status</p>
                <p className="text-2xl font-bold">
                  {encryptionStatus?.configured ? 'Active' : 'Inactive'}
                </p>
                <p className="text-xs text-green-600 mt-1">✓ Configured</p>
              </div>
              <Lock className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Key Management</p>
                <p className="text-2xl font-bold">
                  {encryptionStatus?.keyManagementType || 'None'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {encryptionStatus?.byokEnabled ? 'BYOK' : 'Managed'}
                </p>
              </div>
              <Key className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Policies</p>
                <p className="text-2xl font-bold">{securityPolicies.length}</p>
                <p className="text-xs text-purple-600 mt-1">Active</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance</p>
                <p className="text-2xl font-bold">
                  {encryptionStatus?.complianceRequirements.length || 0}
                </p>
                <p className="text-xs text-orange-600 mt-1">Standards</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Encryption Configuration */}
        {encryptionStatus?.configured ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-semibold">Encryption Configuration</h2>
              </div>
              {encryptionStatus.rotationNeeded && (
                <Button onClick={handleKeyRotation} className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Rotate Key
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Key Management</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <Badge variant="secondary">{encryptionStatus.keyManagementType}</Badge>
                  </div>
                  {encryptionStatus.kmsProvider && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Provider:</span>
                      <span className="text-sm font-medium">{encryptionStatus.kmsProvider}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">BYOK Enabled:</span>
                    <Badge className={encryptionStatus.byokEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {encryptionStatus.byokEnabled ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Client-Side Encryption:</span>
                    <Badge className={encryptionStatus.clientSideEncryption ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {encryptionStatus.clientSideEncryption ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Active Encryption Key</h3>
                {encryptionStatus.activeKey ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Key Type:</span>
                      <span className="text-sm font-medium">{encryptionStatus.activeKey.keyType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Version:</span>
                      <span className="text-sm font-medium">v{encryptionStatus.activeKey.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium">
                        {new Date(encryptionStatus.activeKey.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {encryptionStatus.activeKey.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expires:</span>
                        <span className="text-sm font-medium">
                          {new Date(encryptionStatus.activeKey.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No active encryption key</p>
                )}
              </div>
            </div>

            {encryptionStatus.complianceRequirements.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Compliance Requirements</h3>
                <div className="flex flex-wrap gap-2">
                  {encryptionStatus.complianceRequirements.map((req, index) => (
                    <Badge key={index} variant="secondary">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-6">
            <div className="text-center py-12">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Encryption Configuration</h3>
              <p className="text-gray-600 mb-4">
                Configure enterprise-grade encryption to protect your sensitive data
              </p>
              <Button className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Configure Encryption
              </Button>
            </div>
          </Card>
        )}

        {/* Security Policies */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Security Policies</h2>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {/* Manage Policies */}
            </Button>
          </div>

          {securityPolicies.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No security policies configured</p>
            </div>
          ) : (
            <div className="space-y-4">
              {securityPolicies.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">{getPolicyTypeLabel(policy.policyType)}</h3>
                      <p className="text-sm text-gray-600">
                        Effective: {new Date(policy.effectiveDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getEnforcementLevelColor(policy.enforcementLevel)}>
                      {policy.enforcementLevel}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Security Features */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Security Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Database className="h-4 w-4 text-green-600" />
                Data Protection
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  AES-256 encryption at rest
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  TLS 1.3 encryption in transit
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  HSM-backed key management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Client-side encryption
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Access Control
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Multi-factor authentication
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Role-based access control
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Conditional access policies
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Session management
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </PlatformAdminLayout>
  );
}

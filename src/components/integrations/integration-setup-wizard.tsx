'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  Info,
  Key,
  Shield,
  Settings,
  TestTube
} from 'lucide-react';

interface IntegrationProvider {
  id: string;
  name: string;
  displayName: string;
  category: string;
  authType: string;
  setupInstructions: Record<string, unknown>;
  capabilities: Record<string, unknown>;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SetupWizardProps {
  provider: IntegrationProvider;
  onComplete: (config: Record<string, unknown>) => void;
  onCancel: () => void;
}

export function IntegrationSetupWizard({ provider, onComplete, onCancel }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const steps: SetupStep[] = [
    {
      id: 'overview',
      title: 'Integration Overview',
      description: 'Learn about this integration and its capabilities',
      icon: Info
    },
    {
      id: 'credentials',
      title: 'Authentication Setup',
      description: 'Configure authentication credentials',
      icon: Key
    },
    {
      id: 'permissions',
      title: 'Permissions & Scopes',
      description: 'Configure required permissions and data access',
      icon: Shield
    },
    {
      id: 'settings',
      title: 'Sync Settings',
      description: 'Configure synchronization settings',
      icon: Settings
    },
    {
      id: 'test',
      title: 'Test Connection',
      description: 'Verify the integration is working correctly',
      icon: TestTube
    }
  ];

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateStep = (stepId: string): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepId) {
      case 'credentials':
        if (provider.authType === 'OAUTH2') {
          if (!config.clientId) newErrors.clientId = 'Client ID is required';
          if (!config.clientSecret) newErrors.clientSecret = 'Client Secret is required';
          if (!config.tenantId && provider.category === 'MICROSOFT_ENTRA_ID') {
            newErrors.tenantId = 'Tenant ID is required for Microsoft Entra ID';
          }
          if (!config.domain && provider.category === 'GOOGLE_WORKSPACE') {
            newErrors.domain = 'Domain is required for Google Workspace';
          }
        } else if (provider.authType === 'API_KEY') {
          if (!config.apiKey) newErrors.apiKey = 'API Key is required';
          if (!config.secretKey && provider.category === 'AWS_CONFIG') {
            newErrors.secretKey = 'Secret Key is required for AWS Config';
          }
        }
        break;
      case 'permissions':
        if (!config.scopes || (config.scopes as unknown[]).length === 0) {
          newErrors.scopes = 'At least one permission scope is required';
        }
        break;
      case 'settings':
        if (!config.connectionName) {
          newErrors.connectionName = 'Connection name is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(steps[currentStep].id)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would make an actual API call
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      setTestResult({
        success,
        message: success 
          ? 'Connection test successful! Integration is ready to use.'
          : 'Connection test failed. Please check your credentials and try again.'
      });
    } catch {
      setTestResult({
        success: false,
        message: 'Connection test failed due to an unexpected error.'
      });
    } finally {
      setTesting(false);
    }
  };

  const completeSetup = () => {
    onComplete({
      providerId: provider.id,
      connectionName: config.connectionName,
      credentials: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        tenantId: config.tenantId,
        domain: config.domain,
        apiKey: config.apiKey,
        secretKey: config.secretKey,
        accessToken: config.accessToken,
        refreshToken: config.refreshToken
      },
      syncSchedule: config.syncSchedule,
      syncFrequency: config.syncFrequency,
      scopes: config.scopes
    });
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{provider.displayName} Integration</h3>
              <p className="text-gray-600">{(provider.setupInstructions as Record<string, unknown>)?.title as string}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Setup Requirements</h4>
              <ul className="space-y-2">
                {((provider.setupInstructions as Record<string, unknown>)?.requirements as string[] || []).map((req: string, index: number) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3">Capabilities</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(provider.capabilities || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    {value ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'credentials':
        return (
          <div className="space-y-4">
            {provider.authType === 'OAUTH2' ? (
              <>
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={(config.clientId as string) || ''}
                    onChange={(e) => updateConfig('clientId', e.target.value)}
                    placeholder="Enter OAuth2 Client ID"
                  />
                  {errors.clientId && <p className="text-red-500 text-sm mt-1">{errors.clientId}</p>}
                </div>
                
                <div>
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={(config.clientSecret as string) || ''}
                    onChange={(e) => updateConfig('clientSecret', e.target.value)}
                    placeholder="Enter OAuth2 Client Secret"
                  />
                  {errors.clientSecret && <p className="text-red-500 text-sm mt-1">{errors.clientSecret}</p>}
                </div>

                {provider.category === 'MICROSOFT_ENTRA_ID' && (
                  <div>
                    <Label htmlFor="tenantId">Tenant ID</Label>
                    <Input
                      id="tenantId"
                      value={(config.tenantId as string) || ''}
                      onChange={(e) => updateConfig('tenantId', e.target.value)}
                      placeholder="Enter Azure Tenant ID"
                    />
                    {errors.tenantId && <p className="text-red-500 text-sm mt-1">{errors.tenantId}</p>}
                  </div>
                )}

                {provider.category === 'GOOGLE_WORKSPACE' && (
                  <div>
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      value={(config.domain as string) || ''}
                      onChange={(e) => updateConfig('domain', e.target.value)}
                      placeholder="Enter Google Workspace domain"
                    />
                    {errors.domain && <p className="text-red-500 text-sm mt-1">{errors.domain}</p>}
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    value={(config.apiKey as string) || ''}
                    onChange={(e) => updateConfig('apiKey', e.target.value)}
                    placeholder="Enter API Key"
                  />
                  {errors.apiKey && <p className="text-red-500 text-sm mt-1">{errors.apiKey}</p>}
                </div>

                {provider.category === 'AWS_CONFIG' && (
                  <div>
                    <Label htmlFor="secretKey">Secret Key</Label>
                    <Input
                      id="secretKey"
                      type="password"
                      value={(config.secretKey as string) || ''}
                      onChange={(e) => updateConfig('secretKey', e.target.value)}
                      placeholder="Enter AWS Secret Key"
                    />
                    {errors.secretKey && <p className="text-red-500 text-sm mt-1">{errors.secretKey}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'permissions':
        return (
          <div className="space-y-4">
            <div>
              <Label>Required Permissions</Label>
              <div className="mt-2 space-y-2">
                {((provider as unknown as Record<string, unknown>).supportedScopes as string[] || []).map((scope: string) => (
                  <label key={scope} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(config.scopes as string[] || []).includes(scope)}
                      onChange={(e) => {
                        const scopes = (config.scopes as string[]) || [];
                        if (e.target.checked) {
                          updateConfig('scopes', [...scopes, scope]);
                        } else {
                          updateConfig('scopes', scopes.filter((s: string) => s !== scope));
                        }
                      }}
                    />
                    <span className="text-sm">{scope}</span>
                  </label>
                ))}
              </div>
              {errors.scopes && <p className="text-red-500 text-sm mt-1">{errors.scopes}</p>}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="connectionName">Connection Name</Label>
              <Input
                id="connectionName"
                value={(config.connectionName as string) || ''}
                onChange={(e) => updateConfig('connectionName', e.target.value)}
                placeholder="Enter a name for this connection"
              />
              {errors.connectionName && <p className="text-red-500 text-sm mt-1">{errors.connectionName}</p>}
            </div>

            <div>
              <Label htmlFor="syncSchedule">Sync Schedule (Cron Expression)</Label>
              <Input
                id="syncSchedule"
                value={(config.syncSchedule as string) || '0 */6 * * *'}
                onChange={(e) => updateConfig('syncSchedule', e.target.value)}
                placeholder="0 */6 * * * (every 6 hours)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty for manual sync only
              </p>
            </div>

            <div>
              <Label htmlFor="syncFrequency">Sync Frequency (minutes)</Label>
              <Input
                id="syncFrequency"
                type="number"
                value={(config.syncFrequency as number) || 360}
                onChange={(e) => updateConfig('syncFrequency', parseInt(e.target.value))}
                min="1"
                max="1440"
              />
            </div>
          </div>
        );

      case 'test':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Test Connection</h3>
              <p className="text-gray-600">
                Verify that your integration is configured correctly
              </p>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={testConnection} 
                disabled={testing}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <p className={`mt-1 text-sm ${
                  testResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testResult.message}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Setup {provider.displayName}</h2>
            <Button variant="ghost" onClick={onCancel}>
              ×
            </Button>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {React.createElement(steps[currentStep].icon, { className: "h-5 w-5 text-primary" })}
              <div>
                <h3 className="font-medium">{steps[currentStep].title}</h3>
                <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-6">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              
              {currentStep === steps.length - 1 ? (
                <Button 
                  onClick={completeSetup}
                  disabled={!testResult?.success}
                >
                  Complete Setup
                </Button>
              ) : (
                <Button onClick={nextStep}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Plus, 
  Settings, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Activity } from 'lucide-react';
import { IntegrationSetupWizard } from '@/components/integrations/integration-setup-wizard';

interface IntegrationProvider {
  id: string;
  name: string;
  displayName: string;
  type: string;
  category: string;
  authType: string;
  logoUrl?: string;
  setupInstructions: Record<string, unknown>;
  capabilities: Record<string, unknown>;
  _count: {
    connections: number;
    templates: number;
  };
}

interface IntegrationConnection {
  id: string;
  connectionName: string;
  status: string;
  lastSyncAt?: string;
  nextSyncAt?: string;
  errorCount: number;
  lastErrorMessage?: string;
  provider: {
    name: string;
    displayName: string;
    category: string;
    logoUrl?: string;
  };
  _count: {
    logs: number;
    jobs: number;
    automatedEvidence: number;
  };
}

export default function IntegrationsPage() {
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [connectionName, setConnectionName] = useState('');
  // const [credentials] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [providersRes, connectionsRes] = await Promise.all([
        fetch('/api/admin/integration-providers'),
        fetch('/api/admin/integrations?organizationId=org-123') // Replace with actual org ID
      ]);

      const providersData = await providersRes.json();
      const connectionsData = await connectionsRes.json();

      setProviders(providersData.providers || []);
      setConnections(connectionsData.connections || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnectionClick = () => {
    handleCreateConnection({});
  };

  const handleCreateConnection = async (config: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          organizationId: 'org-123' // Replace with actual org ID
        })
      });

      if (response.ok) {
        setShowSetupWizard(false);
        setSelectedProvider('');
        fetchData();
      }
    } catch (error) {
      console.error('Error creating connection:', error);
    }
  };

  const handleSetupProvider = (provider: IntegrationProvider) => {
    setSelectedProvider(provider.id);
    setShowSetupWizard(true);
  };

  const handleTestConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/admin/integrations/${connectionId}/test`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error testing connection:', error);
    }
  };

  const handleSyncConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/admin/integrations/${connectionId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType: 'FULL_SYNC' })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error syncing connection:', error);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;

    try {
      const response = await fetch(`/api/admin/integrations/${connectionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING_SETUP':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'PENDING_SETUP':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <PlatformAdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integration Management</h1>
            <p className="text-gray-600">Manage your IT system integrations and automated evidence collection</p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Integration
          </Button>
        </div>

        {/* Add Integration Form */}
        {showAddForm && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Integration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider">Integration Provider</Label>
                <select
                  id="provider"
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a provider</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="connectionName">Connection Name</Label>
                <Input
                  id="connectionName"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  placeholder="Enter connection name"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreateConnectionClick} disabled={!selectedProvider || !connectionName}>
                {/* Create Connection */}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Available Providers */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Available Integration Providers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <div key={provider.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  {provider.logoUrl && (
                    <Image src={provider.logoUrl} alt={provider.displayName} width={32} height={32} className="h-8 w-8" />
                  )}
                  <div>
                    <h4 className="font-medium">{provider.displayName}</h4>
                    <p className="text-sm text-gray-600">{provider.category}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  <p>Connections: {provider._count.connections}</p>
                  <p>Templates: {provider._count.templates}</p>
                </div>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleSetupProvider(provider)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Setup Integration
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Active Connections */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Active Connections</h3>
          {connections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No connections configured yet. Add an integration to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div key={connection.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {connection.provider.logoUrl && (
                        <Image 
                          src={connection.provider.logoUrl} 
                          alt={connection.provider.displayName}
                          width={32}
                          height={32}
                          className="h-8 w-8" 
                        />
                      )}
                      <div>
                        <h4 className="font-medium">{connection.connectionName}</h4>
                        <p className="text-sm text-gray-600">{connection.provider.displayName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(connection.status)}`}>
                        {getStatusIcon(connection.status)}
                        <span className="ml-1">{connection.status}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Last Sync:</span>
                      <p>{connection.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleString() : 'Never'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Logs:</span>
                      <p>{connection._count.logs}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Jobs:</span>
                      <p>{connection._count.jobs}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Evidence:</span>
                      <p>{connection._count.automatedEvidence}</p>
                    </div>
                  </div>

                  {connection.lastErrorMessage && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Error:</strong> {connection.lastErrorMessage}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleTestConnection(connection.id)}
                    >
                      <Activity className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSyncConnection(connection.id)}
                      disabled={connection.status !== 'ACTIVE'}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Sync
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {/* Navigate to settings */}}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      {/* Settings */}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteConnection(connection.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Setup Wizard */}
        {showSetupWizard && selectedProvider && providers.find(p => p.id === selectedProvider) && (
          <IntegrationSetupWizard
            provider={providers.find(p => p.id === selectedProvider)!}
            onComplete={handleCreateConnection}
            onCancel={() => {
              setShowSetupWizard(false);
              setSelectedProvider('');
            }}
          />
        )}
      </div>
    </PlatformAdminLayout>
  );
}

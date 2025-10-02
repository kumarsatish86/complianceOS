'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Settings, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Activity,
  BarChart3,
  FileText,
  Shield } from 'lucide-react';

interface IntegrationConnection {
  id: string;
  connectionName: string;
  status: string;
  lastSyncAt?: string;
  nextSyncAt?: string;
  syncSchedule?: string;
  syncFrequency?: number;
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

interface IntegrationLog {
  id: string;
  syncType: string;
  action: string;
  status: string;
  recordsProcessed: number;
  errorsCount: number;
  durationSeconds?: number;
  startedAt: string;
  completedAt?: string;
  errorDetails?: Record<string, unknown>;
}

interface IntegrationJob {
  id: string;
  jobType: string;
  status: string;
  priority: number;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  progress?: number;
  errorMessage?: string;
}

export default function IntegrationDetailPage() {
  const params = useParams();
  const connectionId = params.id as string;
  
  const [connection, setConnection] = useState<IntegrationConnection | null>(null);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [jobs, setJobs] = useState<IntegrationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'jobs' | 'settings'>('overview');
  const [, setShowSettings] = useState(false);
  const [syncSchedule, setSyncSchedule] = useState('');
  const [syncFrequency, setSyncFrequency] = useState(60);

  const fetchConnectionDetails = useCallback(async () => {
    try {
      const [connectionRes, logsRes, jobsRes] = await Promise.all([
        fetch(`/api/admin/integrations/${connectionId}`),
        fetch(`/api/admin/integrations/${connectionId}/logs`),
        fetch(`/api/admin/integrations/${connectionId}/jobs`)
      ]);

      const connectionData = await connectionRes.json();
      const logsData = await logsRes.json();
      const jobsData = await jobsRes.json();

      setConnection(connectionData.connection);
      setLogs(logsData.logs || []);
      setJobs(jobsData.jobs || []);
      
      if (connectionData.connection) {
        setSyncSchedule(connectionData.connection.syncSchedule || '');
        setSyncFrequency(connectionData.connection.syncFrequency || 60);
      }
    } catch (error) {
      console.error('Error fetching connection details:', error);
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    if (connectionId) {
      fetchConnectionDetails();
    }
  }, [connectionId, fetchConnectionDetails]);

  const handleTestConnection = async () => {
    try {
      const response = await fetch(`/api/admin/integrations/${connectionId}/test`, {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchConnectionDetails();
      }
    } catch (error) {
      console.error('Error testing connection:', error);
    }
  };

  const handleSyncConnection = async () => {
    try {
      const response = await fetch(`/api/admin/integrations/${connectionId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType: 'FULL_SYNC' })
      });
      
      if (response.ok) {
        fetchConnectionDetails();
      }
    } catch (error) {
      console.error('Error syncing connection:', error);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const response = await fetch(`/api/admin/integrations/${connectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncSchedule,
          syncFrequency
        })
      });
      
      if (response.ok) {
        setShowSettings(false);
        fetchConnectionDetails();
      }
    } catch (error) {
      console.error('Error updating settings:', error);
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

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
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

  if (!connection) {
    return (
      <PlatformAdminLayout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Connection Not Found</h1>
            <p className="text-gray-600 mt-2">The requested integration connection could not be found.</p>
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {connection.provider.logoUrl && (
              <Image src={connection.provider.logoUrl} alt={connection.provider.displayName} width={32} height={32} className="h-8 w-8" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{connection.connectionName}</h1>
              <p className="text-gray-600">{connection.provider.displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(connection.status)}`}>
              {getStatusIcon(connection.status)}
              <span className="ml-1">{connection.status}</span>
            </span>
            <Button onClick={() => setShowSettings(true)} variant="outline">
              <Settings className="h-4 w-4 mr-1" />
              {/* Settings */}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'logs', label: 'Sync Logs', icon: FileText },
              { id: 'jobs', label: 'Jobs', icon: Activity },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "overview" | "jobs" | "settings")}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{connection._count.logs}</div>
                    <div className="text-sm text-gray-600">Sync Logs</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{connection._count.jobs}</div>
                    <div className="text-sm text-gray-600">Jobs</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{connection._count.automatedEvidence}</div>
                    <div className="text-sm text-gray-600">Evidence Generated</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold">{connection.errorCount}</div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="flex gap-3">
                <Button onClick={handleTestConnection} variant="outline">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Test Connection
                </Button>
                <Button onClick={handleSyncConnection} disabled={connection.status !== 'ACTIVE'}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Sync Now
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{log.action}</div>
                        <div className="text-sm text-gray-600">
                          {log.recordsProcessed} records • {log.durationSeconds}s
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sync Logs</h3>
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-sm text-gray-600">({log.syncType})</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Records:</span>
                      <span className="ml-1 font-medium">{log.recordsProcessed}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Errors:</span>
                      <span className="ml-1 font-medium">{log.errorsCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <span className="ml-1 font-medium">{log.durationSeconds}s</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Started:</span>
                      <span className="ml-1 font-medium">
                        {new Date(log.startedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {log.errorDetails && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Error:</strong> {JSON.stringify(log.errorDetails)}
                    </div>
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No sync logs available</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Jobs</h3>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{job.jobType}</span>
                      <span className="text-sm text-gray-600">Priority: {job.priority}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Scheduled:</span>
                      <span className="ml-1 font-medium">
                        {new Date(job.scheduledAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Started:</span>
                      <span className="ml-1 font-medium">
                        {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Not started'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Completed:</span>
                      <span className="ml-1 font-medium">
                        {job.completedAt ? new Date(job.completedAt).toLocaleString() : 'Not completed'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Progress:</span>
                      <span className="ml-1 font-medium">{job.progress || 0}%</span>
                    </div>
                  </div>
                  {job.errorMessage && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Error:</strong> {job.errorMessage}
                    </div>
                  )}
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No jobs available</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Connection Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="syncSchedule">Sync Schedule (Cron Expression)</Label>
                <Input
                  id="syncSchedule"
                  value={syncSchedule}
                  onChange={(e) => setSyncSchedule(e.target.value)}
                  placeholder="0 */6 * * * (every 6 hours)"
                />
              </div>
              <div>
                <Label htmlFor="syncFrequency">Sync Frequency (minutes)</Label>
                <Input
                  id="syncFrequency"
                  type="number"
                  value={syncFrequency}
                  onChange={(e) => setSyncFrequency(parseInt(e.target.value))}
                  min="1"
                  max="1440"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateSettings}>
                  Save Settings
                </Button>
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PlatformAdminLayout>
  );
}

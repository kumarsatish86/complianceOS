'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plug, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Activity
} from 'lucide-react';

interface IntegrationStatus {
  totalConnections: number;
  activeConnections: number;
  errorConnections: number;
  pendingConnections: number;
  lastSyncTime?: string;
  totalEvidenceGenerated: number;
}

export function IntegrationStatusWidget() {
  const [status, setStatus] = useState<IntegrationStatus>({
    totalConnections: 0,
    activeConnections: 0,
    errorConnections: 0,
    pendingConnections: 0,
    totalEvidenceGenerated: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      // This would fetch from a dedicated API endpoint
      // For now, we'll simulate the data
      setStatus({
        totalConnections: 8,
        activeConnections: 6,
        errorConnections: 1,
        pendingConnections: 1,
        lastSyncTime: new Date().toISOString(),
        totalEvidenceGenerated: 142
      });
    } catch (error) {
      console.error('Error fetching integration status:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Integration Status</h3>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={fetchIntegrationStatus}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{status.totalConnections}</div>
          <div className="text-sm text-gray-600">Total Connections</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{status.activeConnections}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Active</span>
          </div>
          <span className="text-sm font-medium">{status.activeConnections}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Pending</span>
          </div>
          <span className="text-sm font-medium">{status.pendingConnections}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm">Errors</span>
          </div>
          <span className="text-sm font-medium">{status.errorConnections}</span>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Evidence Generated</span>
          <span className="text-sm font-medium">{status.totalEvidenceGenerated}</span>
        </div>
        {status.lastSyncTime && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-600">Last Sync</span>
            <span className="text-sm text-gray-500">
              {new Date(status.lastSyncTime).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => window.location.href = '/dashboard/integrations'}
        >
          <Activity className="h-4 w-4 mr-2" />
          {/* Manage Integrations */}
        </Button>
      </div>
    </Card>
  );
}

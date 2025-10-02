'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, FileText, FileSpreadsheet, Archive, Code } from 'lucide-react';

interface AuditPackGeneratorProps {
  auditRunId: string;
  auditRunStatus: string;
}

interface ExportHistoryItem {
  id: string;
  fileName: string;
  format: string;
  scope: string;
  createdAt: string;
  checksum: string;
  status: string;
  downloadUrl?: string;
}

export function AuditPackGenerator({ auditRunId, auditRunStatus }: AuditPackGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('PDF');
  const [selectedScope, setSelectedScope] = useState('FULL');
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);

  const formatOptions = [
    { value: 'PDF', label: 'PDF Report', icon: FileText, description: 'Comprehensive PDF report with all sections' },
    { value: 'EXCEL', label: 'Excel Workbook', icon: FileSpreadsheet, description: 'Multi-sheet Excel workbook with raw data' },
    { value: 'JSON', label: 'JSON Data', icon: Code, description: 'Machine-readable JSON format' },
    { value: 'ZIP', label: 'ZIP Archive', icon: Archive, description: 'Complete audit pack with all documents' }
  ];

  const scopeOptions = [
    { value: 'FULL', label: 'Full Audit Pack', description: 'Complete audit documentation' },
    { value: 'EXECUTIVE', label: 'Executive Summary', description: 'High-level summary only' },
    { value: 'CONTROLS', label: 'Controls Only', description: 'Control matrix and evidence' },
    { value: 'FINDINGS', label: 'Findings Only', description: 'Findings and remediation plans' }
  ];

  const handleGeneratePack = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/admin/audit-runs/${auditRunId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: selectedFormat,
          scope: selectedScope
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate audit pack');
      }

      const result = await response.json();
      
      // Add to export history
      setExportHistory(prev => [{
        id: result.exportId,
        fileName: result.fileName,
        format: selectedFormat,
        scope: selectedScope,
        checksum: result.checksum,
        downloadUrl: result.downloadUrl,
        createdAt: new Date().toISOString(),
        status: 'completed'
      }, ...prev]);

      // Trigger download
      window.open(result.downloadUrl, '_blank');

    } catch (error) {
      console.error('Error generating audit pack:', error);
      alert('Failed to generate audit pack. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isLocked = auditRunStatus === 'LOCKED';
  const canExport = auditRunStatus !== 'DRAFT';

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Generate Audit Pack</h3>
          <div className="text-sm text-gray-500">
            Status: <span className="font-medium">{auditRunStatus}</span>
          </div>
        </div>

        {!canExport && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              Audit pack generation is only available for audits that are not in draft status.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="space-y-2">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedFormat === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedFormat(option.value)}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scope Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Scope
            </label>
            <div className="space-y-2">
              {scopeOptions.map((option) => (
                <div
                  key={option.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedScope === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedScope(option.value)}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {isLocked && (
              <span className="text-green-600 font-medium">
                ✓ This audit is locked - exports are immutable
              </span>
            )}
          </div>
          <Button
            onClick={handleGeneratePack}
            disabled={!canExport || isGenerating}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{isGenerating ? 'Generating...' : 'Generate Audit Pack'}</span>
          </Button>
        </div>
      </Card>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Export History</h3>
          <div className="space-y-3">
            {exportHistory.map((export_) => (
              <div key={export_.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <div className="font-medium">{export_.fileName}</div>
                    <div className="text-gray-500">
                      {export_.format} • {export_.scope} • {new Date(export_.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-500 font-mono">
                    {export_.checksum.substring(0, 8)}...
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(export_.downloadUrl, '_blank')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

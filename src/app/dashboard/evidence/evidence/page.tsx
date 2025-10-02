'use client';

import { useState, useEffect } from 'react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  Upload,
  Download,
  Calendar,
  Link,
  AlertTriangle } from 'lucide-react';

interface Evidence {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  addedAt: string;
  expiryDate: string | null;
  uploader: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    controlLinks: number;
    versions: number;
  };
}

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/evidence');
      if (response.ok) {
        const data = await response.json();
        setEvidence(data.evidence || []);
      }
    } catch (error) {
      console.error('Error fetching evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvidence = evidence.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    let matchesExpiry = true;
    if (expiryFilter !== 'all') {
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      
      if (item.expiryDate) {
        const expiry = new Date(item.expiryDate);
        switch (expiryFilter) {
          case 'expired':
            matchesExpiry = expiry < now;
            break;
          case 'expiring-30':
            matchesExpiry = expiry >= now && expiry <= thirtyDays;
            break;
          case 'expiring-60':
            matchesExpiry = expiry > thirtyDays && expiry <= sixtyDays;
            break;
          case 'no-expiry':
            matchesExpiry = !item.expiryDate;
            break;
        }
      } else {
        matchesExpiry = expiryFilter === 'no-expiry';
      }
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesExpiry;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'LOCKED': return 'bg-purple-100 text-purple-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'POLICY': return 'bg-blue-100 text-blue-800';
      case 'PROCEDURE': return 'bg-green-100 text-green-800';
      case 'TRAINING': return 'bg-purple-100 text-purple-800';
      case 'AUDIT_REPORT': return 'bg-orange-100 text-orange-800';
      case 'CONFIGURATION': return 'bg-gray-100 text-gray-800';
      case 'OTHER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { status: 'no-expiry', color: 'text-gray-500' };
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'text-red-600' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring-soon', color: 'text-orange-600' };
    } else if (daysUntilExpiry <= 60) {
      return { status: 'expiring', color: 'text-yellow-600' };
    } else {
      return { status: 'valid', color: 'text-green-600' };
    }
  };

  return (
    <PlatformAdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Evidence Repository</h1>
            <p className="text-gray-600">Manage compliance evidence and documentation</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Evidence
            </Button>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Evidence
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Evidence</p>
                <p className="text-2xl font-bold text-gray-900">{evidence.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {evidence.filter(e => e.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">
                  {evidence.filter(e => {
                    if (!e.expiryDate) return false;
                    const daysUntilExpiry = Math.ceil((new Date(e.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                  }).length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Link className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Linked to Controls</p>
                <p className="text-2xl font-bold text-gray-900">
                  {evidence.reduce((sum, e) => sum + e._count.controlLinks, 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search evidence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="LOCKED">Locked</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="POLICY">Policy</SelectItem>
                <SelectItem value="PROCEDURE">Procedure</SelectItem>
                <SelectItem value="TRAINING">Training</SelectItem>
                <SelectItem value="AUDIT_REPORT">Audit Report</SelectItem>
                <SelectItem value="CONFIGURATION">Configuration</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={expiryFilter} onValueChange={setExpiryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by expiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expiry</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="expiring-30">Expiring in 30 days</SelectItem>
                <SelectItem value="expiring-60">Expiring in 60 days</SelectItem>
                <SelectItem value="no-expiry">No Expiry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Evidence Table */}
        <Card>
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Evidence</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploader</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Controls</TableHead>
                  <TableHead>Versions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading evidence...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEvidence.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No evidence found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvidence.map((item) => {
                    const expiryStatus = getExpiryStatus(item.expiryDate);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{item.title}</div>
                            <div className="text-sm text-gray-500">{item.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeBadgeColor(item.type)}>
                            {item.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{item.uploader.name}</div>
                            <div className="text-gray-500">{item.uploader.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(item.addedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {item.expiryDate ? (
                            <div className={`text-sm ${expiryStatus.color}`}>
                              {new Date(item.expiryDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-400">No expiry</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium">{item._count.controlLinks}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium">{item._count.versions}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </PlatformAdminLayout>
  );
}

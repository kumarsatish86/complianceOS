'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ApprovalStatus } from '@prisma/client';
import { Plus, 
  Search, 
  Filter, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  Edit,
  Trash2,
  Key,
  Users, } from 'lucide-react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';

interface Software {
  id: string;
  name: string;
  version?: string;
  publisher?: string;
  category?: string;
  approvalStatus: ApprovalStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
  licenses: Array<{
    id: string;
    seatsTotal: number;
    seatsUsed: number;
    expiryDate?: string;
  }>;
  _count: {
    licenses: number;
  };
}

interface License {
  id: string;
  licenseKey?: string;
  seatsTotal: number;
  seatsUsed: number;
  purchaseDate?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  software: {
    id: string;
    name: string;
    version?: string;
    publisher?: string;
  };
  renewalVendor?: {
    id: string;
    name: string;
  };
  allocations: Array<{
    id: string;
    user: {
      id: string;
      name?: string;
      email: string;
    };
    allocatedAt: string;
  }>;
}

export default function SoftwareLicensesPage() {
  const [activeTab, setActiveTab] = useState<'software' | 'licenses'>('software');
  const [software, setSoftware] = useState<Software[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mock organization ID - in real app, get from context/auth
  const organizationId = 'org-123';

  const fetchSoftware = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        organizationId,
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { approvalStatus: statusFilter })
      });

      const response = await fetch(`/api/admin/software?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setSoftware(data.software);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching software:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, currentPage, searchTerm, statusFilter]);

  const fetchLicenses = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        organizationId,
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/licenses?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setLicenses(data.licenses);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching licenses:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, currentPage, searchTerm]);

  useEffect(() => {
    if (activeTab === 'software') {
      fetchSoftware();
    } else {
      fetchLicenses();
    }
  }, [activeTab, currentPage, searchTerm, statusFilter, fetchSoftware, fetchLicenses]);

  const getApprovalColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'RESTRICTED': return 'text-yellow-600 bg-yellow-100';
      case 'BANNED': return 'text-red-600 bg-red-100';
      case 'PENDING': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getApprovalIcon = (status: ApprovalStatus) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'RESTRICTED': return <AlertTriangle className="h-4 w-4" />;
      case 'BANNED': return <AlertTriangle className="h-4 w-4" />;
      case 'PENDING': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getLicenseUtilization = (used: number, total: number) => {
    const percentage = total > 0 ? (used / total) * 100 : 0;
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry >= new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Software & Licenses</h1>
          <p className="text-muted-foreground">
            {/* Manage software catalog, licenses, and compliance */}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Add License
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Software
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Software</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{software.length}</div>
            <p className="text-xs text-muted-foreground">
              In catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenses.length}</div>
            <p className="text-xs text-muted-foreground">
              {/* Total licenses */}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {licenses.filter(l => isExpiringSoon(l.expiryDate)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {software.filter(s => s.approvalStatus === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'software' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('software')}
        >
          Software Catalog
        </Button>
        <Button
          variant={activeTab === 'licenses' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('licenses')}
        >
          Licenses
        </Button>
      </div>

      {/* Software Catalog Tab */}
      {activeTab === 'software' && (
        <Card>
          <CardHeader>
            <CardTitle>Software Catalog</CardTitle>
            <CardDescription>
              {/* Manage approved and restricted software in your organization */}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search software by name, publisher, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <div>
                  <Label htmlFor="status">Approval Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      {Object.values(ApprovalStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('');
                      setCurrentPage(1);
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Software</TableHead>
                    <TableHead>Publisher</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Licenses</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {software.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.version && (
                            <div className="text-sm text-muted-foreground">
                              Version {item.version}
                            </div>
                          )}
                          {item.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{item.publisher || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{item.category || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalColor(item.approvalStatus)}`}>
                          {getApprovalIcon(item.approvalStatus)}
                          {item.approvalStatus}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{item._count.licenses}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.licenses.reduce((sum, l) => sum + l.seatsTotal, 0)} total seats
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Licenses Tab */}
      {activeTab === 'licenses' && (
        <Card>
          <CardHeader>
            <CardTitle>License Management</CardTitle>
            <CardDescription>
              Track license utilization, expiry dates, and user allocations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search licenses by software name or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Software</TableHead>
                    <TableHead>License Key</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Renewal Vendor</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{license.software.name}</div>
                          {license.software.version && (
                            <div className="text-sm text-muted-foreground">
                              Version {license.software.version}
                            </div>
                          )}
                          {license.software.publisher && (
                            <div className="text-xs text-muted-foreground">
                              {license.software.publisher}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Key className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-mono">
                            {license.licenseKey ? 
                              `${license.licenseKey.substring(0, 8)}...` : 
                              'No key'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {license.seatsUsed} / {license.seatsTotal}
                          </div>
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getLicenseUtilization(license.seatsUsed, license.seatsTotal)}`}>
                            {license.seatsTotal > 0 ? 
                              `${Math.round((license.seatsUsed / license.seatsTotal) * 100)}%` : 
                              '0%'
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {license.expiryDate ? (
                          <div className="space-y-1">
                            <div className="text-sm">
                              {new Date(license.expiryDate).toLocaleDateString()}
                            </div>
                            {isExpiringSoon(license.expiryDate) && (
                              <div className="flex items-center gap-1 text-xs text-orange-600">
                                <AlertTriangle className="h-3 w-3" />
                                Expiring soon
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {license.renewalVendor?.name || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Users className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {activeTab === 'software' ? software.length : licenses.length} items
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
      </div>
    </PlatformAdminLayout>
  );
}

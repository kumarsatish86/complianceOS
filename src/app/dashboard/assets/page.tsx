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
import { AssetType, 
  AssetStatus } from '@prisma/client';
import { Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  Edit, 
  Trash2,
  User,
  Building,
  Shield,
  AlertTriangle,
  Clock } from 'lucide-react';
import PlatformAdminLayout from '@/components/layout/platform-admin-layout';

interface Asset {
  id: string;
  name: string;
  type: AssetType;
  hostname?: string;
  serial?: string;
  assetTag?: string;
  status: AssetStatus;
  department?: string;
  location?: string;
  purchaseDate?: string;
  warrantyEnd?: string;
  owner?: {
    id: string;
    name?: string;
    email: string;
  };
  vendor?: {
    id: string;
    name: string;
  };
  tagLinks: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  _count: {
    attachments: number;
    activities: number;
  };
}

interface DashboardStats {
  totalAssets: number;
  assetsByType: Record<AssetType, number>;
  assetsByStatus: Record<AssetStatus, number>;
  warrantyExpiring: number;
  totalVendors: number;
  totalLicenses: number;
  totalSystems: number;
  accessReviewsDue: number;
}

export default function AssetManagementDashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    department: '',
    owner: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mock organization ID - in real app, get from context/auth
  const organizationId = 'org-123';

  const fetchAssets = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        organizationId,
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.department && { department: filters.department }),
        ...(filters.owner && { ownerId: filters.owner })
      });

      const response = await fetch(`/api/admin/assets?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setAssets(data.assets || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        console.error('Failed to fetch assets:', data.error);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  }, [organizationId, currentPage, searchTerm, filters]);

  useEffect(() => {
    fetchAssets();
    fetchStats();
  }, [fetchAssets]);

  const fetchStats = async () => {
    try {
      // Mock stats - in real app, create dedicated stats API
      setStats({
        totalAssets: 1247,
        assetsByType: {
          LAPTOP: 450,
          DESKTOP: 320,
          SERVER: 45,
          VM: 120,
          MOBILE: 180,
          TABLET: 95,
          NETWORK_DEVICE: 25,
          PERIPHERAL: 12,
          SOFTWARE: 0,
          LICENSE: 0,
          OTHER: 0
        },
        assetsByStatus: {
          IN_USE: 1100,
          SPARE: 85,
          IN_REPAIR: 15,
          RETIRED: 35,
          DISPOSED: 10,
          LOST: 2
        },
        warrantyExpiring: 23,
        totalVendors: 45,
        totalLicenses: 156,
        totalSystems: 28,
        accessReviewsDue: 12
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: '', status: '', department: '', owner: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case 'IN_USE': return 'text-green-600 bg-green-100';
      case 'SPARE': return 'text-blue-600 bg-blue-100';
      case 'IN_REPAIR': return 'text-yellow-600 bg-yellow-100';
      case 'RETIRED': return 'text-gray-600 bg-gray-100';
      case 'DISPOSED': return 'text-red-600 bg-red-100';
      case 'LOST': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: AssetType) => {
    switch (type) {
      case 'LAPTOP': return '💻';
      case 'DESKTOP': return '🖥️';
      case 'SERVER': return '🖥️';
      case 'VM': return '☁️';
      case 'MOBILE': return '📱';
      case 'TABLET': return '📱';
      case 'NETWORK_DEVICE': return '🌐';
      case 'PERIPHERAL': return '🖨️';
      default: return '📦';
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Asset Management</h1>
          <p className="text-muted-foreground">
            {/* Manage IT assets, vendors, licenses, and access controls */}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssets.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warranty Expiring</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.warrantyExpiring}</div>
              <p className="text-xs text-muted-foreground">
                Next 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLicenses}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalVendors} vendors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Access Reviews Due</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accessReviewsDue}</div>
              <p className="text-xs text-muted-foreground">
                Quarterly reviews
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Inventory</CardTitle>
          <CardDescription>
            {/* Search and filter your organization&apos;s IT assets */}
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
                  placeholder="Search by name, hostname, serial, or tag..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {Object.values(AssetType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {getTypeIcon(type)} {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    {Object.values(AssetStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Department"
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {/* Assets Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Warranty</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {asset.assetTag && `Tag: ${asset.assetTag}`}
                          {asset.serial && ` • Serial: ${asset.serial}`}
                        </div>
                        {asset.hostname && (
                          <div className="text-xs text-muted-foreground">
                            {asset.hostname}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getTypeIcon(asset.type)}</span>
                        <span className="text-sm">{asset.type.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                        {asset.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {asset.owner ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{asset.owner.name}</div>
                            <div className="text-xs text-muted-foreground">{asset.owner.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{asset.department || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{asset.vendor?.name || '-'}</span>
                    </TableCell>
                    <TableCell>
                      {asset.warrantyEnd ? (
                        <div className="text-sm">
                          {new Date(asset.warrantyEnd).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {assets.length} assets
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
        </CardContent>
      </Card>
      </div>
    </PlatformAdminLayout>
  );
}

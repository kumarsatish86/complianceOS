'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus,
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2,
  Copy,
  ExternalLink } from 'lucide-react';

interface GuestAuditor {
  id: string;
  email: string;
  name: string;
  role: string;
  accessLevel: string;
  invitedAt: string;
  acceptedAt: string | null;
  expiresAt: string;
  isActive: boolean;
  lastAccessAt: string | null;
  inviter: {
    name: string;
    email: string;
  };
}

interface GuestAuditorManagementProps {
  auditRunId: string;
}

export function GuestAuditorManagement({ auditRunId }: GuestAuditorManagementProps) {
  const [guestAuditors, setGuestAuditors] = useState<GuestAuditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: '',
    accessLevel: 'READ_ONLY',
    expiresInDays: 30
  });

  const fetchGuestAuditors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/audit-runs/${auditRunId}/guest-auditors`);
      if (response.ok) {
        const data = await response.json();
        setGuestAuditors(data.guestAuditors || []);
      }
    } catch (error) {
      console.error('Error fetching guest auditors:', error);
    } finally {
      setLoading(false);
    }
  }, [auditRunId]);

  useEffect(() => {
    fetchGuestAuditors();
  }, [fetchGuestAuditors]);

  const handleInviteGuest = async () => {
    if (!inviteForm.email || !inviteForm.name) {
      alert('Email and name are required');
      return;
    }

    try {
      const response = await fetch(`/api/admin/audit-runs/${auditRunId}/guest-auditors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm)
      });

      if (response.ok) {
        const data = await response.json();
        setGuestAuditors(prev => [data.guestAuditor, ...prev]);
        setShowInviteForm(false);
        setInviteForm({
          email: '',
          name: '',
          role: '',
          accessLevel: 'READ_ONLY',
          expiresInDays: 30
        });
        
        // TODO: Send invitation email
        alert('Guest auditor invited successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to invite guest auditor');
      }
    } catch (error) {
      console.error('Error inviting guest auditor:', error);
      alert('Failed to invite guest auditor');
    }
  };

  const handleRevokeAccess = async (guestAuditorId: string) => {
    if (!confirm('Are you sure you want to revoke access for this guest auditor?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/audit-runs/${auditRunId}/guest-auditors/${guestAuditorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setGuestAuditors(prev => prev.filter(ga => ga.id !== guestAuditorId));
        alert('Access revoked successfully');
      } else {
        alert('Failed to revoke access');
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      alert('Failed to revoke access');
    }
  };

  const copyInvitationLink = (guestAuditor: GuestAuditor) => {
    const link = `${window.location.origin}/guest-auditor/${auditRunId}?token=${guestAuditor.id}`;
    navigator.clipboard.writeText(link);
    alert('Invitation link copied to clipboard');
  };

  const getStatusBadge = (guestAuditor: GuestAuditor) => {
    if (!guestAuditor.isActive) {
      return <Badge className="bg-gray-100 text-gray-800">Revoked</Badge>;
    }
    
    if (guestAuditor.acceptedAt) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    
    if (new Date(guestAuditor.expiresAt) < new Date()) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }
    
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  const getAccessLevelBadge = (accessLevel: string) => {
    const colors = {
      'READ_ONLY': 'bg-blue-100 text-blue-800',
      'REVIEW': 'bg-green-100 text-green-800',
      'COMMENT': 'bg-purple-100 text-purple-800',
      'FULL': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={colors[accessLevel as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {accessLevel.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Guest Auditor Management</h3>
          <Button onClick={() => setShowInviteForm(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Guest Auditor
          </Button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="border rounded-lg p-4 mb-4 bg-gray-50">
            <h4 className="font-medium mb-3">Invite New Guest Auditor</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="auditor@external.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Auditor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <Input
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="External Auditor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                <Select value={inviteForm.accessLevel} onValueChange={(value) => setInviteForm(prev => ({ ...prev, accessLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="READ_ONLY">Read Only</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="COMMENT">Comment</SelectItem>
                    <SelectItem value="FULL">Full Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires In (Days)</label>
                <Input
                  type="number"
                  value={inviteForm.expiresInDays}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) || 30 }))}
                  className="w-24"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowInviteForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteGuest}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Guest Auditors Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest Auditor</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead>Last Access</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Loading guest auditors...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : guestAuditors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No guest auditors invited yet
                  </TableCell>
                </TableRow>
              ) : (
                guestAuditors.map((guestAuditor) => (
                  <TableRow key={guestAuditor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{guestAuditor.name}</div>
                        <div className="text-sm text-gray-500">{guestAuditor.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{guestAuditor.role || 'N/A'}</TableCell>
                    <TableCell>{getAccessLevelBadge(guestAuditor.accessLevel)}</TableCell>
                    <TableCell>{getStatusBadge(guestAuditor)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(guestAuditor.invitedAt).toLocaleDateString()}</div>
                        <div className="text-gray-500">by {guestAuditor.inviter.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {guestAuditor.lastAccessAt ? (
                        <div className="text-sm">
                          <div>{new Date(guestAuditor.lastAccessAt).toLocaleDateString()}</div>
                          <div className="text-gray-500">{new Date(guestAuditor.lastAccessAt).toLocaleTimeString()}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInvitationLink(guestAuditor)}
                          title="Copy invitation link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {guestAuditor.acceptedAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/guest-auditor/${auditRunId}?token=${guestAuditor.id}`, '_blank')}
                            title="View guest portal"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeAccess(guestAuditor.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Revoke access"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Guest Auditor Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Invited</p>
              <p className="text-xl font-bold">{guestAuditors.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-xl font-bold">
                {guestAuditors.filter(ga => ga.acceptedAt && ga.isActive).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-bold">
                {guestAuditors.filter(ga => !ga.acceptedAt && ga.isActive && new Date(ga.expiresAt) > new Date()).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-xl font-bold">
                {guestAuditors.filter(ga => new Date(ga.expiresAt) < new Date()).length}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

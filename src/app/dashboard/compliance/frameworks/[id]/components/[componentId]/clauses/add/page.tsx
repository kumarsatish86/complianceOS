'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, X } from 'lucide-react';

export default function AddClausePage() {
  const router = useRouter();
  const params = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, status } = useSession() as any;
  
  const [formData, setFormData] = useState({
    clauseId: '',
    title: '',
    description: '',
    implementationGuidance: '',
    evidenceRequirements: '',
    riskLevel: 'MEDIUM',
    testingProcedures: ''
  });
  const [loading, setLoading] = useState(false);

  const frameworkId = params.id as string;
  const componentId = params.componentId as string;

  // Redirect if not authenticated or not authorized
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user?.platformRole !== "SUPER_ADMIN" && session.user?.platformRole !== "PLATFORM_ADMIN") {
      router.push("/dashboard")
      return
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/compliance/structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          componentId,
          clauseId: formData.clauseId,
          title: formData.title,
          description: formData.description,
          implementationGuidance: formData.implementationGuidance,
          evidenceRequirements: formData.evidenceRequirements,
          riskLevel: formData.riskLevel,
          testingProcedures: formData.testingProcedures
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create clause');
      }

      router.push(`/dashboard/compliance/frameworks/${frameworkId}`);
    } catch (error) {
      console.error('Error creating clause:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/compliance/frameworks/${frameworkId}`);
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Compliance Clause</h1>
          <p className="text-muted-foreground">
            Add a new compliance clause to the framework
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clause Details</CardTitle>
          <CardDescription>
            Enter the details for the new compliance clause
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clauseId">Clause ID</Label>
                <Input
                  id="clauseId"
                  value={formData.clauseId}
                  onChange={(e) => setFormData({ ...formData, clauseId: e.target.value })}
                  placeholder="e.g., A.8.1.1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="riskLevel">Risk Level</Label>
                <Select value={formData.riskLevel} onValueChange={(value) => setFormData({ ...formData, riskLevel: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter clause title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter clause description"
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="implementationGuidance">Implementation Guidance</Label>
              <Textarea
                id="implementationGuidance"
                value={formData.implementationGuidance}
                onChange={(e) => setFormData({ ...formData, implementationGuidance: e.target.value })}
                placeholder="Enter implementation guidance"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="evidenceRequirements">Evidence Requirements</Label>
              <Textarea
                id="evidenceRequirements"
                value={formData.evidenceRequirements}
                onChange={(e) => setFormData({ ...formData, evidenceRequirements: e.target.value })}
                placeholder="Enter evidence requirements"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="testingProcedures">Testing Procedures</Label>
              <Textarea
                id="testingProcedures"
                value={formData.testingProcedures}
                onChange={(e) => setFormData({ ...formData, testingProcedures: e.target.value })}
                placeholder="Enter testing procedures"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Clause'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

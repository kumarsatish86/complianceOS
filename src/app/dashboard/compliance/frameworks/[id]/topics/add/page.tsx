'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, X } from 'lucide-react';

export default function AddTopicPage() {
  const router = useRouter();
  const params = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, status } = useSession() as any;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    orderIndex: 0
  });
  const [loading, setLoading] = useState(false);

  const frameworkId = params.id as string;

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
          frameworkId,
          name: formData.name,
          description: formData.description,
          orderIndex: formData.orderIndex
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create topic');
      }

      router.push(`/dashboard/compliance/frameworks/${frameworkId}`);
    } catch (error) {
      console.error('Error creating topic:', error);
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
          <h1 className="text-3xl font-bold tracking-tight">Add Compliance Topic</h1>
          <p className="text-muted-foreground">
            Add a new compliance topic to the framework
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Topic Details</CardTitle>
          <CardDescription>
            Enter the details for the new compliance topic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Topic Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter topic name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter topic description"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="orderIndex">Order Index</Label>
              <Input
                id="orderIndex"
                type="number"
                value={formData.orderIndex}
                onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Topic'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

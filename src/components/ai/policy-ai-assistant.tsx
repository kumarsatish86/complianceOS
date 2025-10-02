'use client';

import React, { useState } from 'react';
import { Bot, FileCheck, AlertTriangle, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIChat } from './ai-chat';

interface PolicyAIAssistantProps {
  organizationId: string;
  className?: string;
}

export function PolicyAIAssistant({ organizationId, className }: PolicyAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);

  const policyQuickActions = [
    {
      icon: Clock,
      title: "Overdue Policies",
      description: "Find policies overdue for review",
      query: "Show me all policies that are overdue for review",
      color: "bg-red-100 text-red-600",
    },
    {
      icon: Users,
      title: "Acknowledgment Status",
      description: "Check employee policy acknowledgments",
      query: "Show me the status of policy acknowledgments across the organization",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: FileCheck,
      title: "Policy Analysis",
      description: "Analyze policy effectiveness and gaps",
      query: "Analyze our current policies and identify any gaps or areas for improvement",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: AlertTriangle,
      title: "Compliance Risk",
      description: "Assess policy compliance risks",
      query: "Assess the compliance risks related to our current policies",
      color: "bg-orange-100 text-orange-600",
    },
  ];

  const handleQuickAction = (query: string) => {
    console.log('AI Query:', query);
  };

  return (
    <div className={className}>
      {/* AI Assistant Toggle Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">AI Policy Assistant</h3>
          <Badge variant="secondary" className="text-xs">
            Powered by AI
          </Badge>
        </div>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant={isOpen ? "default" : "outline"}
          size="sm"
        >
          {isOpen ? "Hide Assistant" : "Show Assistant"}
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {policyQuickActions.map((action, index) => (
          <Card
            key={index}
            className="p-3 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleQuickAction(action.query)}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${action.color}`}>
                <action.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{action.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{action.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* AI Chat Interface */}
      {isOpen && (
        <Card className="h-[400px]">
          <AIChat 
            organizationId={organizationId}
            className="h-full"
          />
        </Card>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Bot, AlertTriangle, TrendingUp, Target, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIChat } from './ai-chat';

interface RiskAIAssistantProps {
  organizationId: string;
  className?: string;
}

export function RiskAIAssistant({ organizationId, className }: RiskAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);

  const riskQuickActions = [
    {
      icon: AlertTriangle,
      title: "High-Risk Items",
      description: "Identify highest priority risks",
      query: "Show me all high and critical risks that need immediate attention",
      color: "bg-red-100 text-red-600",
    },
    {
      icon: Target,
      title: "Treatment Status",
      description: "Check risk treatment progress",
      query: "Show me the status of all risk treatments and their progress",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: TrendingUp,
      title: "Risk Trends",
      description: "Analyze risk trends and patterns",
      query: "Analyze our risk trends and identify any emerging patterns or concerns",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: Shield,
      title: "Risk Mitigation",
      description: "Find risk mitigation opportunities",
      query: "Identify risks that can be mitigated through existing controls or policies",
      color: "bg-purple-100 text-purple-600",
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
          <h3 className="font-semibold">AI Risk Assistant</h3>
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
        {riskQuickActions.map((action, index) => (
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

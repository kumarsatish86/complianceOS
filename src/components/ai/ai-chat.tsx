'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: Record<string, unknown>[];
  feedback?: {
    rating?: number;
    comment?: string;
  };
}

interface AIChatProps {
  sessionId?: string;
  organizationId: string;
  className?: string;
}

export function AIChat({ sessionId, organizationId, className }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSessionHistory = useCallback(async () => {
    if (!currentSessionId) return;

    try {
      const response = await fetch(`/api/ai/query?sessionId=${currentSessionId}&organizationId=${organizationId}`);
      if (response.ok) {
        const history = await response.json();
        const formattedMessages: Message[] = [];

        history.forEach((query: Record<string, unknown>) => {
          // Add user message
          formattedMessages.push({
            id: `${query.id}-user`,
            type: 'user',
            content: query.queryText as string,
            timestamp: new Date(query.createdAt as string),
          });

          // Add AI response if available
          if (query.responseText) {
            formattedMessages.push({
              id: `${query.id}-ai`,
              type: 'ai',
              content: query.responseText as string,
              timestamp: new Date(query.updatedAt as string),
              confidence: query.confidenceScore as number,
              sources: query.contextSources as Record<string, unknown>[],
              feedback: (query.feedback as Record<string, unknown>[])?.[0] ? {
                rating: (query.feedback as Record<string, unknown>[])[0].rating as number,
                comment: (query.feedback as Record<string, unknown>[])[0].comment as string,
              } : undefined,
            });
          }
        });

        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load session history:', error);
    }
  }, [currentSessionId, organizationId]);

  useEffect(() => {
    if (currentSessionId) {
      loadSessionHistory();
    }
  }, [currentSessionId, loadSessionHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewSession = async () => {
    try {
      const response = await fetch('/api/ai/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          title: 'New AI Chat Session',
        }),
      });

      if (response.ok) {
        const { sessionId } = await response.json();
        setCurrentSessionId(sessionId);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Create session if needed
      if (!currentSessionId) {
        await createNewSession();
      }

      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryText: inputText,
          sessionId: currentSessionId,
          organizationId,
        }),
      });

      if (response.ok) {
        const aiResponse = await response.json();
        
        const aiMessage: Message = {
          id: `ai-${aiResponse.id}`,
          type: 'ai',
          content: aiResponse.responseText,
          timestamp: new Date(),
          confidence: aiResponse.confidenceScore,
          sources: aiResponse.contextSources,
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitFeedback = async (messageId: string, feedbackType: string, rating?: number) => {
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: messageId.replace('ai-', ''),
          feedbackType,
          rating,
        }),
      });

      // Update message with feedback
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, feedback: { rating, comment: feedbackType } }
          : msg
      ));
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">AI Assistant</h3>
          {currentSessionId && (
            <Badge variant="secondary" className="text-xs">
              Session Active
            </Badge>
          )}
        </div>
        {!currentSessionId && (
          <Button onClick={createNewSession} size="sm" variant="outline">
            Start New Session
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Start a conversation with the AI assistant</p>
            <p className="text-sm">Ask about evidence, policies, controls, or compliance</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'ai' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            )}

            <Card className={`max-w-[80%] p-3 ${
              message.type === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-50'
            }`}>
              <div className="space-y-2">
                <p className="text-sm">{message.content}</p>
                
                {message.type === 'ai' && (
                  <div className="space-y-2">
                    {/* Confidence Score */}
                    {message.confidence && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Confidence:</span>
                        <Badge 
                          variant={message.confidence > 0.8 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {Math.round(message.confidence * 100)}%
                        </Badge>
                      </div>
                    )}

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="text-xs text-gray-500">
                        <p className="font-medium mb-1">Sources:</p>
                        <div className="space-y-1">
                          {message.sources.slice(0, 3).map((source, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {(source as Record<string, unknown>).sourceType as string}
                              </Badge>
                              <span className="truncate">{(source as Record<string, unknown>).chunkText as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span className="text-xs text-gray-500">Was this helpful?</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => submitFeedback(message.id, 'HELPFUL', 5)}
                        disabled={!!message.feedback}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => submitFeedback(message.id, 'NOT_HELPFUL', 1)}
                        disabled={!!message.feedback}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {message.type === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <Card className="p-3 bg-gray-50">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">AI is thinking...</span>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about evidence, policies, controls, or compliance..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!inputText.trim() || isLoading}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

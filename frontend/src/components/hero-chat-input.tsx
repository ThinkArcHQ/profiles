'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { PromptInput } from '@/components/ai-elements/prompt-input';
import { Message } from '@/components/ai-elements/message';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar, Search, MessageCircle } from 'lucide-react';

export function HeroChatInput() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [],
  });

  const quickActions = [
    { icon: Search, label: 'Find Expert', prompt: 'Help me find an expert in' },
    { icon: Calendar, label: 'Book Meeting', prompt: 'I want to schedule a meeting with' },
    { icon: MessageCircle, label: 'Get Quote', prompt: 'I need a quote for' },
  ];

  const handleQuickAction = (prompt: string) => {
    handleInputChange({ target: { value: prompt } } as any);
    setIsExpanded(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Chat Interface */}
      <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-orange-400" />
              <h3 className="text-xl font-semibold text-white">AI Assistant</h3>
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-200 border-orange-500/30">
                Beta
              </Badge>
            </div>
          </div>

          {/* Quick Actions */}
          {!isExpanded && (
            <div className="mb-6">
              <p className="text-center text-gray-300 mb-4">What can I help you with today?</p>
              <div className="flex flex-wrap justify-center gap-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.prompt)}
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-orange-500/50"
                  >
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="mb-6 max-h-60 overflow-y-auto space-y-4">
              {messages.map((message) => (
                <Message
                  key={message.id}
                  message={message}
                  className="text-white"
                />
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <PromptInput
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              placeholder="Ask me to find experts, book meetings, or get quotes..."
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500/50 focus:ring-orange-500/20"
            />
            
            {input && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">
                  Press Enter to send or Shift+Enter for new line
                </p>
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    'Send'
                  )}
                </Button>
              </div>
            )}
          </form>

          {/* Expand/Collapse */}
          {messages.length === 0 && (
            <div className="text-center mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-white"
              >
                {isExpanded ? 'Show less' : 'Show more options'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Helper Text */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-400">
          Powered by AI • Find experts, book meetings, and get quotes instantly
        </p>
      </div>
    </div>
  );
}
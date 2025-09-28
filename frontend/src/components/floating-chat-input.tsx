'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PromptInput } from '@/components/ai-elements/prompt-input';
import { Message, MessageContent, MessageAvatar } from '@/components/ai-elements/message';
import { Conversation, ConversationContent, ConversationEmptyState } from '@/components/ai-elements/conversation';
import { MessageCircle, X, Send, Sparkles, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingChatInputProps {
  className?: string;
}

export function FloatingChatInput({ className }: FloatingChatInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hi! I\'m here to help you connect with professionals on our platform. You can ask me to:\n\n• Find experts in specific fields\n• Request appointments or meetings\n• Get quotes for services\n• Learn about someone\'s expertise\n\nWhat would you like to do today?'
      }
    ]
  });

  const toggleChat = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const maximizeChat = () => {
    setIsMinimized(false);
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          size="lg"
          className="h-14 w-14 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="sr-only">Open AI Assistant</span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "w-96 shadow-2xl border-0 bg-white/95 backdrop-blur-sm transition-all duration-300",
          isMinimized ? "h-16" : "h-[500px]"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">AI Assistant</span>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                Beta
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={minimizeChat}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                >
                  <span className="text-lg leading-none">−</span>
                </Button>
              )}
              {isMinimized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={maximizeChat}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                >
                  <span className="text-lg leading-none">□</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-[436px]">
              {/* Messages */}
              <Conversation className="flex-1 min-h-0">
                <ConversationContent className="space-y-4">
                  {messages.length === 0 ? (
                    <ConversationEmptyState
                      icon={<MessageCircle className="h-8 w-8" />}
                      title="Start a conversation"
                      description="Ask me to help you find professionals or request appointments"
                    />
                  ) : (
                    messages.map((message) => (
                      <Message key={message.id} from={message.role}>
                        <MessageAvatar
                          src={message.role === 'user' ? '/user-avatar.png' : '/ai-avatar.png'}
                          name={message.role === 'user' ? 'You' : 'AI'}
                        />
                        <MessageContent variant="contained">
                          <div className="whitespace-pre-wrap">
                            {message.content}
                          </div>
                        </MessageContent>
                      </Message>
                    ))
                  )}
                  {isLoading && (
                    <Message from="assistant">
                      <MessageAvatar
                        src="/ai-avatar.png"
                        name="AI"
                      />
                      <MessageContent variant="contained">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-500">AI is thinking...</span>
                        </div>
                      </MessageContent>
                    </Message>
                  )}
                </ConversationContent>
              </Conversation>

              {/* Input */}
              <div className="p-4 border-t bg-gray-50/50">
                <PromptInput
                  onSubmit={(message, event) => {
                    event.preventDefault();
                    if (message.text?.trim()) {
                      handleSubmit(event as any);
                    }
                  }}
                  className="flex items-end gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask me to find professionals or request appointments..."
                      className="w-full resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent max-h-32 min-h-[40px]"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (input.trim()) {
                            handleSubmit(e as any);
                          }
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || isLoading}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </PromptInput>
              </div>

              {/* Quick Actions */}
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const event = { preventDefault: () => {} } as any;
                      handleInputChange({ target: { value: "Find me a web developer for a project" } } as any);
                      setTimeout(() => handleSubmit(event), 100);
                    }}
                    className="text-xs"
                  >
                    <User className="h-3 w-3 mr-1" />
                    Find Expert
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const event = { preventDefault: () => {} } as any;
                      handleInputChange({ target: { value: "I need to schedule a meeting with a marketing consultant" } } as any);
                      setTimeout(() => handleSubmit(event), 100);
                    }}
                    className="text-xs"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Book Meeting
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
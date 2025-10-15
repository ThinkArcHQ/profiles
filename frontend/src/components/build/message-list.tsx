'use client';

import { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  files?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[85%] space-y-2 rounded-xl px-4 py-3 ${
              message.role === 'user'
                ? 'bg-orange-500/10 border border-orange-500/20 text-white'
                : 'bg-white/5 border border-white/10 text-white/90'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
            
            {/* Display attached files if any */}
            {message.files && message.files.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-current/10">
                {message.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 text-xs opacity-70"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Timestamp */}
            <p className="text-xs opacity-50">
              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

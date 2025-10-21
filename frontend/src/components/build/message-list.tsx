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

/**
 * Strip code blocks and FILE: declarations from chat messages
 * Code should only appear in the preview panel, not in chat
 * 
 * Extracts only the description/explanation text before the first FILE: block
 * Also removes SEARCH/REPLACE blocks
 */
function sanitizeMessageForDisplay(message: string): string {
  // Find the first FILE: declaration
  const fileIndex = message.search(/FILE:\s*[^\n]+/i);
  
  if (fileIndex !== -1) {
    // Take only the text before the first FILE: declaration
    message = message.substring(0, fileIndex);
  }
  
  // Remove SEARCH/REPLACE blocks
  message = message.replace(/<<<<<<< SEARCH[\s\S]*?>>>>>>> REPLACE/g, '');
  
  // Remove any remaining code blocks
  message = message.replace(/```[\s\S]*?```/g, '');
  
  // Remove multiple consecutive newlines
  message = message.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace
  return message.trim();
}

/**
 * Detect if message contains a step indicator emoji
 */
function getMessageType(message: string): 'planning' | 'building' | 'styling' | 'interactive' | 'complete' | 'update' | 'default' {
  if (message.includes('🎯') || message.toLowerCase().includes('planning')) return 'planning';
  if (message.includes('📐') || message.toLowerCase().includes('structure') || message.toLowerCase().includes('building')) return 'building';
  if (message.includes('🎨') || message.toLowerCase().includes('style') || message.toLowerCase().includes('design')) return 'styling';
  if (message.includes('⚡') || message.toLowerCase().includes('interactivity') || message.toLowerCase().includes('interactive')) return 'interactive';
  if (message.includes('✅') || message.toLowerCase().includes('done') || message.toLowerCase().includes('complete')) return 'complete';
  if (message.includes('🔧') || message.includes('🔍') || message.toLowerCase().includes('updating')) return 'update';
  return 'default';
}

/**
 * Get styling based on message type
 */
function getMessageStyling(type: string) {
  switch (type) {
    case 'planning':
      return 'bg-blue-500/10 border-blue-500/30 shadow-blue-500/5';
    case 'building':
      return 'bg-purple-500/10 border-purple-500/30 shadow-purple-500/5';
    case 'styling':
      return 'bg-pink-500/10 border-pink-500/30 shadow-pink-500/5';
    case 'interactive':
      return 'bg-yellow-500/10 border-yellow-500/30 shadow-yellow-500/5';
    case 'complete':
      return 'bg-green-500/10 border-green-500/30 shadow-green-500/5';
    case 'update':
      return 'bg-orange-500/10 border-orange-500/30 shadow-orange-500/5';
    default:
      return 'bg-white/5 border-white/10';
  }
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-6">
      {messages.map((message) => {
        // Sanitize assistant messages to remove code blocks
        const displayContent = message.role === 'assistant' 
          ? sanitizeMessageForDisplay(message.content)
          : message.content;
        
        // Skip rendering if message is empty after sanitization
        if (!displayContent.trim()) {
          return null;
        }

        // Detect message type for assistant messages
        const messageType = message.role === 'assistant' ? getMessageType(displayContent) : 'default';
        const messageStyling = message.role === 'assistant' ? getMessageStyling(messageType) : '';

        return (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] space-y-2 rounded-xl px-4 py-3 shadow-lg transition-all duration-300 ${
                message.role === 'user'
                  ? 'bg-orange-500/10 border border-orange-500/20 text-white'
                  : `${messageStyling} border text-white/90`
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{displayContent}</p>
            
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
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

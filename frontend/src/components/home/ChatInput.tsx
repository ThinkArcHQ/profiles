'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { GlobeIcon, Sparkles } from 'lucide-react';

const models = [
  { id: 'gpt-5', name: 'GPT-5' },
];

export function ChatInput() {
  const [text, setText] = useState<string>('');
  const [model, setModel] = useState<string>(models[0].id);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);

  const { messages, status, sendMessage, error } = useChat({
    api: '/api/chat',
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files,
      },
      {
        body: {
          model: model,
          webSearch: useWebSearch,
        },
      }
    );

    setText('');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
      <div className="p-4">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 text-red-600">⚠️</div>
              <div className="text-sm text-red-700">
                <strong>Error:</strong> {error.message}
              </div>
            </div>
          </div>
        )}

        {/* AI Input */}
        <PromptInput 
          onSubmit={handleSubmit} 
          className="border-gray-200 focus-within:border-orange-500"
          globalDrop 
          multiple
        >
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputTextarea
              onChange={(e) => setText(e.target.value)}
              value={text}
              placeholder="Ask AI to find experts, book appointments, or get help..."
              className="min-h-[50px] resize-none border-0 focus:ring-0 text-gray-900 placeholder:text-gray-500"
            />
          </PromptInputBody>
          <PromptInputToolbar className="border-t border-gray-200 bg-gray-50/50">
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              <PromptInputButton
                onClick={() => setUseWebSearch(!useWebSearch)}
                variant={useWebSearch ? 'default' : 'ghost'}
                size="sm"
                className={useWebSearch ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>


            </PromptInputTools>

            <PromptInputSubmit 
              disabled={!text && status !== 'streaming'} 
              status={status}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            />
          </PromptInputToolbar>
        </PromptInput>

        {/* Helper Text */}
        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
          <div className="flex items-center space-x-1">
            <Sparkles className="w-3 h-3" />
            <span>AI Assistant powered by GPT-5</span>
          </div>
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>

        {/* Chat Messages - Timeline Format with Fixed Height */}
        {messages.length > 0 && (
          <div className="mt-4 h-80 rounded-lg border border-gray-200 bg-white relative flex flex-col">
            {/* Orange Timeline Line - Fixed positioning */}
            <div className="absolute left-4 top-4 bottom-4 w-1 bg-orange-500 z-10"></div>
            
            {/* Scrollable Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 pl-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {messages.map((message, index) => (
                <div key={message.id} className="relative mb-4 last:mb-0 flex items-start gap-3">
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    {/* Message Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {/* Message Body */}
                    <div className="break-words overflow-hidden">
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        message.role === 'user' 
                          ? 'bg-orange-50 text-gray-900 border border-orange-200' 
                          : 'bg-gray-50 text-gray-900 border border-gray-200'
                      }`}>
                        {message.parts.map((part, i) => {
                          switch (part.type) {
                            case 'text':
                              return (
                                <div key={`${message.id}-${i}`} className="break-words">
                                  {part.text}
                                </div>
                              );
                            default:
                              return null;
                          }
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import { 
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputAttachments,
  PromptInputAttachment
} from '@/components/ai-elements/prompt-input';

export function FloatingPromptInput() {
  const { input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  const placeholderExamples = [
    "Schedule a coffee with Sarah tomorrow...",
    "Meet with John next week...",
    "Book lunch with Maria on Friday...",
    "Schedule a call with Alex...",
    "Meet with Lisa this afternoon...",
    "Book dinner with Tom tonight...",
    "Schedule time with Emma...",
    "Meet with David for drinks...",
    "Book a session with coach Mike...",
    "Schedule brunch with Jennifer..."
  ];

  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prevIndex) => 
        (prevIndex + 1) % placeholderExamples.length
      );
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [placeholderExamples.length]);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[500px] max-w-[90vw]">
      <PromptInput
        onSubmit={(message, event) => {
          event.preventDefault();
          if (message.text?.trim()) {
            // Convert the PromptInput message format to useChat format
            const syntheticEvent = {
              ...event,
              currentTarget: {
                ...event.currentTarget,
                message: { value: message.text }
              }
            } as any;
            handleSubmit(syntheticEvent);
          }
        }}
      >
        <PromptInputAttachments>
          {(attachment) => (
            <PromptInputAttachment key={attachment.id} data={attachment} />
          )}
        </PromptInputAttachments>
        
        <PromptInputBody className="relative">
          <PromptInputTextarea 
            placeholder={placeholderExamples[currentPlaceholderIndex]}
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            className="pr-12 min-h-[60px]"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <PromptInputSubmit 
              status={isLoading ? "submitted" : undefined}
              disabled={isLoading}
            />
          </div>
        </PromptInputBody>
      </PromptInput>
    </div>
  );
}
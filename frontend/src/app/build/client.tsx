'use client';

import { useState, useCallback } from 'react';
import { MessageList } from '@/components/build/message-list';
import { ChatInput } from '@/components/build/chat-input';
import { FileUploadButton } from '@/components/build/file-upload-button';
import { PreviewPanel } from '@/components/build/preview-panel';
import { GenerationProgress } from '@/components/build/generation-progress';
import { parseCodeBlocks, isModificationRequest } from '@/lib/utils/code-parser';
import { useFileState } from '@/hooks/use-file-state';
import type { GeneratedFile as PreviewFile } from '@/components/build/preview-panel';
import { Code2 } from 'lucide-react';
import Link from 'next/link';

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

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Convert a file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function BuildPageClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileState, fileActions] = useFileState();
  const [previewMode, setPreviewMode] = useState<'code' | 'preview'>('code');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Process file uploads to base64
  const processFiles = useCallback(async (filesToProcess: File[]) => {
    const images: Array<{ name: string; mimeType: string; base64Data: string }> = [];
    const documents: Array<{ name: string; text: string }> = [];

    for (const file of filesToProcess) {
      if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        images.push({
          name: file.name,
          mimeType: file.type,
          base64Data: base64,
        });
      } else if (file.type === 'application/pdf') {
        // For PDFs, we'll just include the filename for now
        // Full PDF text extraction can be added later
        documents.push({
          name: file.name,
          text: `[PDF file: ${file.name}]`,
        });
      }
    }

    return { images, documents };
  }, []);

  const handleSendMessage = async (message: string) => {
    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
      files: uploadedFiles.length > 0 
        ? uploadedFiles.map(file => ({
            id: `${file.name}-${Date.now()}`,
            name: file.name,
            type: file.type,
          }))
        : undefined,
    };

    setMessages(prev => [...prev, userMessage]);

    // Build enhanced user message with current code context for iterative refinement
    let enhancedMessage = message;
    
    // If there are existing files and this looks like a modification request, include code context
    const isModification = isModificationRequest(message);
    if (fileState.files.length > 0 && isModification) {
      const fileContext = fileState.files
        .map(file => `\nFILE: ${file.path}\n\`\`\`${file.language}\n${file.content}\n\`\`\``)
        .join('\n');
      
      enhancedMessage = `${message}\n\n--- Current Code Context ---${fileContext}\n--- End of Current Code ---`;
    }

    // Add to conversation history with enhanced context
    setConversationHistory(prev => [
      ...prev,
      { role: 'user', content: enhancedMessage }
    ]);

    // Process uploaded files
    const processedFiles = uploadedFiles.length > 0 
      ? await processFiles(uploadedFiles)
      : undefined;

    // Clear uploaded files
    setUploadedFiles([]);

    // Create placeholder for streaming assistant message
    const assistantMessageId = `assistant-${Date.now()}`;
    setIsGenerating(true);

    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    // Send to API
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: message,
          files: processedFiles,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      // Handle streaming response - plain text stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the chunk as plain text
          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          // Update streaming message
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );

          // Parse and update files in real-time
          const codeBlocks = parseCodeBlocks(accumulatedContent);
          if (codeBlocks.length > 0) {
            // Update each file using file state management
            codeBlocks.forEach(block => {
              fileActions.updateFile(
                block.path,
                block.content,
                block.isComplete
              );
            });
          }
        }

        // Finalize - mark all files as complete
        fileActions.markAllFilesComplete();

        // Add to conversation history
        setConversationHistory(prev => [
          ...prev,
          { role: 'assistant', content: accumulatedContent }
        ]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Update the assistant message with error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { 
                ...msg, 
                content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.` 
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files].slice(0, 5));
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-14 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm z-50 flex items-center px-4">
        <Link href="/home" className="text-lg font-semibold flex-shrink-0">
          <span className="text-white">Profile</span>
          <span className="text-orange-500">Base</span>
          <span className="text-white/50 ml-2 text-sm font-normal">/ AI Builder</span>
        </Link>
      </div>

      {/* Chat Panel */}
      <div className="flex w-full flex-col border-r border-white/10 lg:w-1/2 mt-14">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="mb-6">
                <Code2 className="h-16 w-16 text-orange-500/50 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-white mb-2">
                  AI Profile Builder
                </h2>
                <p className="text-white/50 max-w-md">
                  Describe your profile page and let AI generate the code. You can upload images or design mockups to guide the generation.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                <button
                  onClick={() => handleSendMessage("Create a modern profile page with a hero section, skills list, and contact form")}
                  className="text-left p-4 rounded-lg border border-white/10 hover:border-orange-500/50 hover:bg-white/5 transition-all"
                >
                  <p className="text-sm text-white/70">Create a modern profile page with hero, skills, and contact form</p>
                </button>
                <button
                  onClick={() => handleSendMessage("Build a portfolio page with project showcase and about section")}
                  className="text-left p-4 rounded-lg border border-white/10 hover:border-orange-500/50 hover:bg-white/5 transition-all"
                >
                  <p className="text-sm text-white/70">Build a portfolio page with project showcase</p>
                </button>
              </div>
            </div>
          ) : (
            <>
              <MessageList messages={messages} />
              
              {/* Generation Progress Indicator */}
              {isGenerating && (
                <div className="mt-4">
                  <GenerationProgress 
                    isGenerating={isGenerating}
                    generatingFiles={fileState.generatingFiles}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* File Preview Area */}
        {uploadedFiles.length > 0 && (
          <div className="border-t border-white/10 px-4 py-2 bg-[#0a0a0a]">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 rounded-md bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                >
                  <svg
                    className="h-4 w-4 text-white/50"
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
                  <span className="max-w-[150px] truncate text-white/70">{file.name}</span>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="ml-1 text-white/50 hover:text-white"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-white/10 p-4 bg-[#0a0a0a]">
          <div className="flex gap-2">
            <FileUploadButton
              onFilesSelected={handleFilesSelected}
              disabled={isGenerating}
            />
            <ChatInput
              onSend={handleSendMessage}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="hidden w-1/2 flex-col lg:flex mt-14">
        <PreviewPanel
          files={fileState.files as PreviewFile[]}
          activeFile={fileState.activeFile}
          previewMode={previewMode}
          onFileSelect={fileActions.setActiveFile}
          onModeChange={setPreviewMode}
        />
      </div>
    </div>
  );
}

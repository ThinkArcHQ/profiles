"use client";

import { useState, useCallback, useEffect } from "react";
import { MessageList } from "@/components/build/message-list";
import { ChatInput } from "@/components/build/chat-input";
import { FileUploadButton } from "@/components/build/file-upload-button";
import { PreviewPanel } from "@/components/build/preview-panel";
import { GenerationProgress } from "@/components/build/generation-progress";
import {
  parseCodeBlocks,
  isModificationRequest,
} from "@/lib/utils/code-parser";
import { useFileState } from "@/hooks/use-file-state";
import type { GeneratedFile as PreviewFile } from "@/components/build/preview-panel";
import { Code2 } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  files?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

interface ConversationMessage {
  role: "user" | "assistant";
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
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function BuildPageClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileState, fileActions] = useFileState();
  const [previewMode, setPreviewMode] = useState<"code" | "preview">("code");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dividerPosition, setDividerPosition] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloadingFiles, setIsDownloadingFiles] = useState(false);

  // Process file uploads to base64
  const processFiles = useCallback(async (filesToProcess: File[]) => {
    const images: Array<{
      name: string;
      mimeType: string;
      base64Data: string;
    }> = [];
    const documents: Array<{ name: string; text: string }> = [];

    for (const file of filesToProcess) {
      if (file.type.startsWith("image/")) {
        const base64 = await fileToBase64(file);
        images.push({
          name: file.name,
          mimeType: file.type,
          base64Data: base64,
        });
      } else if (file.type === "application/pdf") {
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
      role: "user",
      content: message,
      timestamp: Date.now(),
      files:
        uploadedFiles.length > 0
          ? uploadedFiles.map((file) => ({
              id: `${file.name}-${Date.now()}`,
              name: file.name,
              type: file.type,
            }))
          : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Build enhanced user message with current code context for iterative refinement
    let enhancedMessage = message;

    // If there are existing files and this looks like a modification request, include code context
    const isModification = isModificationRequest(message);
    if (fileState.files.length > 0 && isModification) {
      const fileContext = fileState.files
        .map(
          (file) =>
            `\nFILE: ${file.path}\n\`\`\`${file.language}\n${file.content}\n\`\`\``
        )
        .join("\n");

      enhancedMessage = `${message}\n\n--- Current Code Context ---${fileContext}\n--- End of Current Code ---`;
    }

    // Add to conversation history with enhanced context
    setConversationHistory((prev) => [
      ...prev,
      { role: "user", content: enhancedMessage },
    ]);

    // Process uploaded files
    const processedFiles =
      uploadedFiles.length > 0 ? await processFiles(uploadedFiles) : undefined;

    // Clear uploaded files
    setUploadedFiles([]);

    // Create placeholder for streaming assistant message
    const assistantMessageId = `assistant-${Date.now()}`;
    setIsGenerating(true);

    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Send to API
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the chunk as plain text
          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          // Update streaming message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );

          // Parse and update files in real-time
          const codeBlocks = parseCodeBlocks(accumulatedContent);
          if (codeBlocks.length > 0) {
            // Update each file using file state management
            codeBlocks.forEach((block) => {
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
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: accumulatedContent },
        ]);
      }
    } catch (err) {
      console.error("Error sending message:", err);

      // Update the assistant message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `Error: ${
                  err instanceof Error ? err.message : "Unknown error"
                }. Please try again.`,
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

  const handleDownloadAll = async () => {
    if (fileState.files.length === 0) return;

    setIsDownloadingFiles(true);
    try {
      const { downloadFilesAsZip } = await import("@/lib/utils/download-utils");
      await downloadFilesAsZip(
        fileState.files.map((file) => ({
          path: file.path,
          content: file.content,
        })),
        "profile-page.zip"
      );
    } catch (error) {
      console.error("Error downloading files:", error);
      alert("Failed to download files. Please try again.");
    } finally {
      setIsDownloadingFiles(false);
    }
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  // Handle drag events with useEffect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const container = document.getElementById("split-container");
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;

      // Constrain between 20% and 50%
      setDividerPosition(Math.min(Math.max(newPosition, 20), 50));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-14 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm z-50 flex items-center justify-between px-4">
        <Link href="/home" className="text-lg font-semibold flex-shrink-0">
          <span className="text-white">Profile</span>
          <span className="text-orange-500">Base</span>
          <span className="text-white/50 ml-2 text-sm font-normal">
            / AI Builder
          </span>
        </Link>

        {/* Preview Mode Toggle and Download */}
        {fileState.files.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode("code")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                previewMode === "code"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              <svg
                className="w-4 h-4 inline-block mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              Code
            </button>
            <button
              onClick={() => setPreviewMode("preview")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                previewMode === "preview"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              <svg
                className="w-4 h-4 inline-block mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Preview
            </button>

            <div className="w-px h-6 bg-white/10 mx-1" />

            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingFiles}
              className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white hover:border-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {isDownloadingFiles ? "Downloading..." : "Download"}
            </button>
          </div>
        )}
      </div>

      {/* Split Container */}
      <div id="split-container" className="flex w-full mt-14 relative">
        {/* Chat Panel */}
        <div
          className="flex flex-col border-r border-white/10 transition-none"
          style={{ width: `${dividerPosition}%` }}
        >
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
                    Describe your profile page and let AI generate the code. You
                    can upload images or design mockups to guide the generation.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                  <button
                    onClick={() =>
                      handleSendMessage(
                        "Create a modern profile page with a hero section, skills list, and contact form"
                      )
                    }
                    className="text-left p-4 rounded-lg border border-white/10 hover:border-orange-500/50 hover:bg-white/5 transition-all"
                  >
                    <p className="text-sm text-white/70">
                      Create a modern profile page with hero, skills, and
                      contact form
                    </p>
                  </button>
                  <button
                    onClick={() =>
                      handleSendMessage(
                        "Build a portfolio page with project showcase and about section"
                      )
                    }
                    className="text-left p-4 rounded-lg border border-white/10 hover:border-orange-500/50 hover:bg-white/5 transition-all"
                  >
                    <p className="text-sm text-white/70">
                      Build a portfolio page with project showcase
                    </p>
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
                    <span className="max-w-[150px] truncate text-white/70">
                      {file.name}
                    </span>
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

        {/* Resizable Divider */}
        <div
          className="w-1 bg-white/10 hover:bg-orange-500 cursor-col-resize transition-colors relative group flex-shrink-0"
          onMouseDown={handleMouseDown}
          style={{ userSelect: "none" }}
        >
          <div className="absolute inset-y-0 -left-2 -right-2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-16 bg-white/10 group-hover:bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
              />
            </svg>
          </div>
        </div>

        {/* Preview Panel */}
        <div
          className="flex flex-col"
          style={{ width: `${100 - dividerPosition}%` }}
        >
          <PreviewPanel
            files={fileState.files as PreviewFile[]}
            activeFile={fileState.activeFile}
            previewMode={previewMode}
            onFileSelect={fileActions.setActiveFile}
            onModeChange={setPreviewMode}
          />
        </div>
      </div>
    </div>
  );
}

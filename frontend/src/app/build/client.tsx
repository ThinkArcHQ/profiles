"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@/components/ai-elements/task";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputAttachments,
  PromptInputAttachment,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Loader } from "@/components/ai-elements/loader";
import { PreviewPanel } from "@/components/build/preview-panel";
import { useFileState } from "@/hooks/use-file-state";
import type { GeneratedFile as PreviewFile } from "@/components/build/preview-panel";
import { Sparkles } from "lucide-react";
import Link from "next/link";

const STREAMING_TIMEOUT = 2000;

const EXAMPLE_PROMPTS = [
  {
    title: "Minimalist Dark",
    prompt:
      "Create a minimalist dark theme profile page with a clean layout, subtle animations, and a focus on typography. Include sections for bio, skills, and contact information.",
    gradient: "from-slate-900 to-zinc-900",
  },
  {
    title: "Glassmorphism",
    prompt:
      "Design a modern profile page with glassmorphism effects, frosted glass cards, backdrop blur, and vibrant gradient backgrounds. Make it feel premium and futuristic.",
    gradient: "from-purple-900 to-pink-900",
  },
  {
    title: "Brutalist Design",
    prompt:
      "Build a bold brutalist profile page with strong typography, high contrast black and white colors, geometric shapes, and raw, unpolished aesthetic.",
    gradient: "from-black to-zinc-800",
  },
  {
    title: "Gradient Colorful",
    prompt:
      "Create a vibrant profile page with colorful gradients, smooth transitions, playful animations, and an energetic modern feel. Use bright colors and dynamic elements.",
    gradient: "from-orange-600 to-pink-600",
  },
  {
    title: "Neon Cyberpunk",
    prompt:
      "Design a cyberpunk-inspired profile page with neon colors, glowing effects, futuristic elements, and a dark background. Include animated neon borders and sci-fi aesthetics.",
    gradient: "from-cyan-900 to-blue-900",
  },
];

export function BuildPageClient() {
  const [fileState, fileActions] = useFileState();
  const [previewMode, setPreviewMode] = useState<"code" | "preview">("code");
  const [dividerPosition, setDividerPosition] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloadingFiles, setIsDownloadingFiles] = useState(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [text, setText] = useState<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const processedToolCallsRef = useRef<Set<string>>(new Set());

  // Use the AI SDK's useChat hook for agent communication
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/generate",
    }),
  });

  // Track loading state from status
  const isLoading = status === "streaming" || status === "submitted";

  // Process tool calls from messages in real-time
  useEffect(() => {
    console.log("📨 Messages updated:", messages.length);

    messages.forEach((message, msgIndex) => {
      if (message.role === "assistant") {
        console.log(
          `Processing assistant message ${msgIndex} with ${message.parts.length} parts`
        );

        message.parts.forEach((part, partIndex) => {
          // Type guard for tool parts
          const partAny = part as Record<string, unknown>;

          // Log all part types for debugging
          console.log(
            `Part ${partIndex}: type=${partAny.type}, state=${partAny.state}`
          );

          // Process tool calls with input available OR streaming
          if (
            partAny.type &&
            typeof partAny.type === "string" &&
            partAny.type.startsWith("tool-")
          ) {
            const toolName = partAny.type.replace("tool-", "");

            // Create unique ID for this tool call
            const toolCallId = `${message.id}-${partIndex}-${toolName}`;

            // Process createFile tool calls - STREAM CONTENT AS IT ARRIVES
            if (toolName === "createFile") {
              // Process both streaming and complete states
              if (
                (partAny.state === "input-streaming" ||
                  partAny.state === "input-available") &&
                partAny.input
              ) {
                const input = partAny.input as {
                  filePath: string;
                  content: string;
                  explanation: string;
                };

                if (input.filePath && input.content) {
                  // Create a unique ID based on content to detect actual changes
                  const contentHash = `${toolCallId}-${partAny.state}-${input.content.length}`;

                  // FIXED: Always update when streaming to show real-time progress
                  // Only deduplicate when input is complete (input-available)
                  if (partAny.state === "input-streaming") {
                    // Only update if content has actually changed
                    if (!processedToolCallsRef.current.has(contentHash)) {
                      console.log(
                        `📝 Streaming file: ${input.filePath} (${
                          input.content?.length || 0
                        } chars) - First 50 chars: ${input.content.substring(
                          0,
                          50
                        )}`
                      );
                      fileActions.updateFile(
                        input.filePath,
                        input.content,
                        false // Not complete yet
                      );
                      processedToolCallsRef.current.add(contentHash);
                    }
                  } else if (partAny.state === "input-available") {
                    // Only deduplicate final updates
                    const finalId = `${toolCallId}-final`;
                    if (!processedToolCallsRef.current.has(finalId)) {
                      console.log(
                        `✅ Created file: ${input.filePath} (${
                          input.content?.length || 0
                        } chars) - COMPLETE`
                      );
                      fileActions.updateFile(
                        input.filePath,
                        input.content,
                        true // Mark complete
                      );
                      processedToolCallsRef.current.add(finalId);
                    }
                  }
                } else {
                  console.warn(
                    `⚠️ Missing filePath or content for createFile:`,
                    {
                      hasFilePath: !!input.filePath,
                      hasContent: !!input.content,
                      contentLength: input.content?.length || 0,
                    }
                  );
                }
              }
            }

            // Process modifyFile tool calls
            if (toolName === "modifyFile") {
              if (
                (partAny.state === "input-streaming" ||
                  partAny.state === "input-available") &&
                partAny.input
              ) {
                const input = partAny.input as {
                  filePath: string;
                  searchContent: string;
                  replaceContent: string;
                  explanation: string;
                };

                // Use getFile to avoid dependency on fileState.files
                const existingFile = fileActions.getFile(input.filePath);

                if (
                  existingFile &&
                  input.searchContent &&
                  input.replaceContent
                ) {
                  // FIXED: Always update when streaming
                  if (partAny.state === "input-streaming") {
                    console.log(`📝 Modifying file: ${input.filePath}`);
                    const newContent = existingFile.content.replace(
                      input.searchContent,
                      input.replaceContent
                    );
                    fileActions.updateFile(input.filePath, newContent, false);
                  } else if (partAny.state === "input-available") {
                    // Only deduplicate final updates
                    const finalId = `${toolCallId}-modify-final`;
                    if (!processedToolCallsRef.current.has(finalId)) {
                      console.log(`✅ Modified file: ${input.filePath}`);
                      const newContent = existingFile.content.replace(
                        input.searchContent,
                        input.replaceContent
                      );
                      fileActions.updateFile(input.filePath, newContent, true);
                      processedToolCallsRef.current.add(finalId);
                    }
                  }
                }
              }
            }
          }
        });
      }
    });
  }, [fileActions, messages]); // Only depend on messages - fileActions is stable from useCallback

  const stop = () => {
    console.log("Stopping request...");
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Note: status is managed by useChat, no need to set it manually
  };

  const handleSubmit = async (
    message: PromptInputMessage,
    event?: FormEvent
  ) => {
    // If currently streaming, stop instead of submitting
    if (status === "streaming") {
      stop();
      return;
    }

    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    console.log("Submitting message:", message);

    // Build enhanced message with current code context for modifications
    let enhancedMessage = message.text || "";

    // If there are existing files, include code context for better modifications
    if (fileState.files.length > 0) {
      const fileContext = fileState.files
        .map(
          (file) =>
            `\nCURRENT FILE: ${file.path}\n\`\`\`${file.language}\n${file.content}\n\`\`\``
        )
        .join("\n");

      enhancedMessage = `${enhancedMessage}\n\n--- Current Code Context ---${fileContext}\n--- End of Current Code ---`;
    }

    // Send message using the useChat hook (AI SDK 5.0 format)
    sendMessage({
      text: enhancedMessage,
    });

    // CRITICAL: Clear the input state
    setText("");

    // Reset the form to clear the textarea
    if (event?.currentTarget instanceof HTMLFormElement) {
      event.currentTarget.reset();
    }

    // Mark all files as complete after generation finishes
    setTimeout(() => {
      fileActions.markAllFilesComplete();
    }, STREAMING_TIMEOUT);
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

  const handleRefreshPreview = () => {
    setPreviewRefreshKey((prev) => prev + 1);
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
    <>
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="flex h-screen w-full overflow-hidden bg-black">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-14 border-b border-white/10 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-between px-4">
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

              {previewMode === "preview" && (
                <button
                  onClick={handleRefreshPreview}
                  className="rounded-lg bg-white/5 border border-white/10 p-2 text-white/80 transition-all hover:bg-white/10 hover:text-white hover:border-orange-500/30"
                  title="Refresh preview"
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}

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
            {/* Messages Area with AI Elements */}
            <Conversation className="flex-1">
              <ConversationContent>
                {messages.length === 0 ? (
                  <ConversationEmptyState
                    title="Build Your Profile with AI"
                    description="Tell me what kind of profile page you want, and I'll generate beautiful, modern HTML, CSS, and JavaScript code. Choose a design style below or describe your own vision."
                    icon={
                      <Sparkles className="size-16 text-orange-500 animate-pulse" />
                    }
                  />
                ) : (
                  <>
                    {messages.map((message) => (
                      <Message key={message.id} from={message.role}>
                        {message.parts.map((part, partIndex: number) => {
                          const partAny = part as Record<string, unknown>;

                          // Render text parts in separate bubbles
                          if (part.type === "text" && part.text) {
                            return (
                              <MessageContent
                                key={`${message.id}-text-${partIndex}`}
                                variant={
                                  message.role === "user" ? "contained" : "flat"
                                }
                              >
                                <Response>{part.text}</Response>
                              </MessageContent>
                            );
                          }

                          // Show tool call progress with Task component
                          if (
                            partAny.type &&
                            typeof partAny.type === "string" &&
                            partAny.type.startsWith("tool-")
                          ) {
                            const toolName = partAny.type.replace("tool-", "");
                            const input = partAny.input as
                              | Record<string, unknown>
                              | undefined;
                            const state = partAny.state as string;

                            // Get file path for display
                            const filePath = input?.filePath as
                              | string
                              | undefined;
                            const explanation = input?.explanation as
                              | string
                              | undefined;

                            // Determine task title based on tool and state
                            let taskTitle = "Processing...";
                            if (toolName === "createFile") {
                              taskTitle =
                                state === "input-streaming"
                                  ? "Creating file..."
                                  : state === "input-available"
                                  ? "File created"
                                  : "Creating file...";
                            } else if (toolName === "modifyFile") {
                              taskTitle =
                                state === "input-streaming"
                                  ? "Modifying file..."
                                  : state === "input-available"
                                  ? "File modified"
                                  : "Modifying file...";
                            }

                            return (
                              <MessageContent
                                key={`${message.id}-tool-${partIndex}`}
                                variant="flat"
                              >
                                <Task
                                  className="w-full"
                                  defaultOpen={state === "input-streaming"}
                                >
                                  <TaskTrigger title={taskTitle} />
                                  <TaskContent>
                                    {explanation && (
                                      <TaskItem>{explanation}</TaskItem>
                                    )}
                                    {filePath && (
                                      <TaskItem>
                                        <span className="inline-flex items-center gap-1">
                                          {state === "input-streaming"
                                            ? "Writing"
                                            : "Wrote"}
                                          <TaskItemFile>
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
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                              />
                                            </svg>
                                            <span>{filePath}</span>
                                          </TaskItemFile>
                                        </span>
                                      </TaskItem>
                                    )}
                                    {state === "input-streaming" && (
                                      <TaskItem>
                                        <span className="inline-flex items-center gap-2 text-orange-500">
                                          <Loader size={12} />
                                          <span>Streaming content...</span>
                                        </span>
                                      </TaskItem>
                                    )}
                                  </TaskContent>
                                </Task>
                              </MessageContent>
                            );
                          }

                          return null;
                        })}
                      </Message>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                      <div className="flex items-center gap-2 px-4 py-2">
                        <Loader size={16} />
                        <span className="text-sm text-white/60">
                          AI is building your profile...
                        </span>
                      </div>
                    )}
                  </>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>

            {/* Input Area - Full AI Elements Structure */}
            <div className="bg-black">
              <PromptInput globalDrop multiple onSubmit={handleSubmit}>
                <PromptInputBody className="bg-black border-0">
                  <PromptInputAttachments>
                    {(attachment) => (
                      <PromptInputAttachment data={attachment} />
                    )}
                  </PromptInputAttachments>
                  <PromptInputTextarea
                    onChange={(e) => setText(e.target.value)}
                    ref={textareaRef}
                    value={text}
                    placeholder="Describe your profile page..."
                    className="bg-black text-white placeholder:text-white/40 border-0"
                  />
                </PromptInputBody>
                <PromptInputToolbar className="bg-black border-0">
                  <PromptInputTools>
                    <PromptInputActionMenu>
                      <PromptInputActionMenuTrigger className="text-white/60 hover:text-white/80" />
                      <PromptInputActionMenuContent>
                        <PromptInputActionAddAttachments />
                      </PromptInputActionMenuContent>
                    </PromptInputActionMenu>
                  </PromptInputTools>
                  <PromptInputSubmit
                    status={status}
                    className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/20"
                  />
                </PromptInputToolbar>
              </PromptInput>
            </div>
          </div>

          {/* Resizable Divider */}
          <div
            className="w-0.5 bg-white/10 hover:bg-orange-500 cursor-col-resize transition-colors relative group flex-shrink-0"
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
            style={{
              width: `${100 - dividerPosition}%`,
              backgroundColor: "#0f0f0f",
            }}
          >
            {/* Example Prompts Carousel - Show only when no files */}
            {fileState.files.length === 0 && (
              <div
                className="flex-1 flex flex-col items-center justify-center px-6"
                style={{ backgroundColor: "#0f0f0f" }}
              >
                <div className="max-w-6xl w-full">
                  <div className="text-center mb-8">
                    <Sparkles className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Choose Your Design Style
                    </h2>
                    <p className="text-white/60">
                      Select a theme to get started or describe your own
                    </p>
                  </div>
                  <div className="relative overflow-hidden">
                    <div className="flex gap-4 animate-scroll-left">
                      {/* Duplicate for seamless loop */}
                      {[...EXAMPLE_PROMPTS, ...EXAMPLE_PROMPTS].map(
                        (example, index) => (
                          <button
                            key={`${example.title}-${index}`}
                            onClick={() => {
                              setText(example.prompt);
                              textareaRef.current?.focus();
                            }}
                            className="group relative flex-shrink-0 w-72 h-40 rounded-xl overflow-hidden border border-white/10 hover:border-orange-500/50 transition-all hover:scale-105"
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${example.gradient} opacity-80`}
                            />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="relative h-full p-6 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Sparkles className="w-5 h-5 text-orange-500" />
                                  <h3 className="text-lg font-bold text-white">
                                    {example.title}
                                  </h3>
                                </div>
                                <p className="text-sm text-white/70 line-clamp-3">
                                  {example.prompt}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-orange-500 font-medium">
                                <span>Try this style</span>
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
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {fileState.files.length > 0 && (
              <PreviewPanel
                files={fileState.files as PreviewFile[]}
                activeFile={fileState.activeFile}
                previewMode={previewMode}
                onFileSelect={fileActions.setActiveFile}
                onModeChange={setPreviewMode}
                refreshKey={previewRefreshKey}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

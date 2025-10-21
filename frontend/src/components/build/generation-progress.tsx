"use client";

import { useEffect, useState } from "react";

interface GenerationProgressProps {
  isGenerating: boolean;
  generatingFiles: Set<string>;
}

const interestingMessages = {
  thinking: [
    "🎯 Planning your profile page",
    "🤔 Analyzing your requirements",
    "💭 Gathering ideas",
    "📋 Creating the blueprint",
    "🎨 Designing the layout",
  ],
  html: [
    "📐 Building the structure",
    "🏗️ Crafting semantic HTML",
    "🔨 Assembling components",
    "📄 Creating the foundation",
    "🧱 Laying out the framework",
  ],
  css: [
    "🎨 Adding styles and design",
    "✨ Polishing the visuals",
    "🌈 Applying colors and gradients",
    "💅 Making it beautiful",
    "🖌️ Perfecting the details",
  ],
  js: [
    "⚡ Adding interactivity",
    "🔧 Wiring up functionality",
    "🎭 Bringing it to life",
    "🚀 Implementing features",
    "💫 Adding the magic",
  ],
  general: [
    "⚙️ Working on your page",
    "🔨 Building your vision",
    "✨ Creating something awesome",
    "🎯 Making it happen",
    "🚀 Almost there",
  ],
};

function getRandomMessage(category: keyof typeof interestingMessages): string {
  const messages = interestingMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getGenerationMessage(generatingFiles: Set<string>): string {
  // If no files yet, show thinking
  if (generatingFiles.size === 0) {
    return getRandomMessage("thinking");
  }

  // Get the current file being generated
  const filesArray = Array.from(generatingFiles);
  const currentFile = filesArray[filesArray.length - 1]; // Get the most recent file

  // Extract filename from path
  const fileName = currentFile.split("/").pop() || currentFile;

  // Determine message based on file type
  if (fileName.includes(".html") || fileName.includes("index")) {
    return getRandomMessage("html");
  } else if (fileName.includes(".css") || fileName.includes("style")) {
    return getRandomMessage("css");
  } else if (fileName.includes(".js") || fileName.includes("script")) {
    return getRandomMessage("js");
  } else {
    return getRandomMessage("general");
  }
}

export function GenerationProgress({
  isGenerating,
  generatingFiles,
}: GenerationProgressProps) {
  const [dots, setDots] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");

  useEffect(() => {
    if (!isGenerating) return;

    // Set initial message
    setCurrentMessage(getGenerationMessage(generatingFiles));

    // Animate dots every 500ms
    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    // Change message every 3 seconds for variety
    const messageInterval = setInterval(() => {
      setCurrentMessage(getGenerationMessage(generatingFiles));
    }, 3000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(messageInterval);
    };
  }, [isGenerating, generatingFiles]);

  if (!isGenerating) {
    return null;
  }

  const fileCount = generatingFiles.size;

  return (
    <div className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 px-4 py-3 backdrop-blur-sm">
      {/* Animated spinner with gradient */}
      <div className="relative">
        <svg
          className="h-5 w-5 animate-spin text-orange-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <div className="absolute inset-0 animate-ping">
          <svg
            className="h-5 w-5 text-orange-500 opacity-20"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>
        </div>
      </div>

      {/* Progress text with animation */}
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-white">
          {currentMessage}
          <span className="inline-block w-6 text-left text-orange-500">
            {dots}
          </span>
        </p>
        {fileCount > 0 && (
          <p className="text-xs text-white/60">
            {fileCount} {fileCount === 1 ? "file" : "files"}
          </p>
        )}
      </div>

      {/* Animated pulse indicator */}
      <div className="flex items-center gap-1">
        <span
          className="h-2 w-2 animate-pulse rounded-full bg-orange-500"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-2 w-2 animate-pulse rounded-full bg-orange-500"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-2 w-2 animate-pulse rounded-full bg-orange-500"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

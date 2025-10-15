'use client';

interface GenerationProgressProps {
  isGenerating: boolean;
  generatingFiles: Set<string>;
}

export function GenerationProgress({ isGenerating, generatingFiles }: GenerationProgressProps) {
  if (!isGenerating) {
    return null;
  }

  const fileCount = generatingFiles.size;

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
      {/* Animated spinner */}
      <svg
        className="h-4 w-4 animate-spin text-primary"
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
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>

      {/* Progress text */}
      <div className="flex-1">
        <p className="font-medium">Generating code...</p>
        {fileCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {fileCount} {fileCount === 1 ? 'file' : 'files'} in progress
          </p>
        )}
      </div>

      {/* Animated dots */}
      <div className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
      </div>
    </div>
  );
}

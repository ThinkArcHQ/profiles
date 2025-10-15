'use client';

import { useEffect, useRef, useState } from 'react';
import type { GeneratedFile } from './preview-panel';

interface LivePreviewProps {
  files: GeneratedFile[];
}

function buildPreviewHTML(files: GeneratedFile[]): string {
  // Find HTML, CSS, and JS files
  const htmlFile = files.find((f) => f.language === 'html');
  const cssFiles = files.filter((f) => f.language === 'css');
  const jsFiles = files.filter(
    (f) => f.language === 'javascript' || f.language === 'typescript'
  );

  // If no HTML file, create a basic structure
  let htmlContent = htmlFile?.content || '<div id="root"></div>';

  // Combine all CSS
  const cssContent = cssFiles.map((f) => f.content).join('\n\n');

  // Combine all JS (note: TypeScript won't run directly, would need transpilation)
  const jsContent = jsFiles
    .filter((f) => f.language === 'javascript')
    .map((f) => f.content)
    .join('\n\n');

  // Build complete HTML document with sandbox security
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.5;
    }
    ${cssContent}
  </style>
</head>
<body>
  ${htmlContent}
  <script>
    // Disable dangerous APIs for security
    window.eval = undefined;
    window.Function = undefined;
    
    // Error handling
    window.addEventListener('error', (event) => {
      console.error('Preview error:', event.error);
      window.parent.postMessage({
        type: 'preview-error',
        error: event.error?.message || 'Unknown error'
      }, '*');
    });

    // Execute user code
    try {
      ${jsContent}
    } catch (error) {
      console.error('Script execution error:', error);
      window.parent.postMessage({
        type: 'preview-error',
        error: error.message
      }, '*');
    }
  </script>
</body>
</html>
  `.trim();
}

export function LivePreview({ files }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    // Listen for errors from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'preview-error') {
        setError(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // Clear error when files change
    setError(null);

    // Update iframe content
    if (iframeRef.current) {
      try {
        const previewHTML = buildPreviewHTML(files);
        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(previewHTML);
          iframeDoc.close();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render preview');
      }
    }
  }, [files, previewKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setError(null);
    setPreviewKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <span className="text-sm font-medium">Live Preview</span>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          aria-label="Refresh preview"
        >
          <svg
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
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
          <span>Refresh</span>
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="border-b bg-destructive/10 px-4 py-3">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 flex-shrink-0 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                Preview Error
              </p>
              <p className="mt-1 text-sm text-destructive/80">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-destructive/60 hover:text-destructive"
              aria-label="Dismiss error"
            >
              <svg
                className="h-5 w-5"
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
        </div>
      )}

      {/* Preview iframe */}
      <div className="flex-1 overflow-hidden bg-white">
        <iframe
          ref={iframeRef}
          key={previewKey}
          title="Live Preview"
          sandbox="allow-scripts allow-same-origin"
          className="h-full w-full border-0"
          style={{
            colorScheme: 'light',
          }}
        />
      </div>
    </div>
  );
}

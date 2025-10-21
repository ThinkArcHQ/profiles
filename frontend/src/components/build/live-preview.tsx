'use client';

import { useEffect, useRef, useState } from 'react';
import type { GeneratedFile } from './preview-panel';

interface LivePreviewProps {
  files: GeneratedFile[];
  refreshKey?: number;
}

/**
 * Build preview HTML from generated files
 * Supports vanilla HTML/CSS/JS only
 */
function buildPreviewHTML(files: GeneratedFile[]): string {
  const htmlFile = files.find((f) => f.language === 'html');
  const cssFiles = files.filter((f) => f.language === 'css');
  const jsFiles = files.filter((f) => f.language === 'javascript');

  console.log('Building preview with files:', {
    htmlFile: htmlFile?.path,
    cssFiles: cssFiles.map(f => ({ path: f.path, language: f.language, hasContent: !!f.content })),
    jsFiles: jsFiles.map(f => ({ path: f.path, language: f.language })),
  });

  // If we have a complete HTML file, use it as base
  if (htmlFile && htmlFile.content.includes('<!DOCTYPE html>')) {
    let html = htmlFile.content;
    
    // Check if CSS needs to be injected
    // Only inject if there are CSS files AND the HTML doesn't already have inline styles
    // NOTE: We ALWAYS inject even if there's a <link> tag because the linked file won't exist in iframe
    const hasInlineStyles = html.includes('<style>') || html.includes('<style ');
    
    console.log('CSS injection check:', {
      cssFilesCount: cssFiles.length,
      hasInlineStyles,
      willInject: cssFiles.length > 0 && !hasInlineStyles
    });
    
    if (cssFiles.length > 0 && !hasInlineStyles) {
      const cssContent = cssFiles.map((f) => f.content).join('\n\n');
      const styleTag = `  <style>\n${cssContent}\n  </style>`;
      
      console.log('Injecting CSS:', cssContent.substring(0, 100) + '...');
      
      // Try to inject before </head>
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${styleTag}\n</head>`);
        console.log('CSS injected before </head>');
      } else if (html.includes('<head>')) {
        // If no closing head tag, add after opening head tag
        html = html.replace('<head>', `<head>\n${styleTag}`);
        console.log('CSS injected after <head>');
      }
    }
    
    // Check if JS needs to be injected
    const hasInlineScript = html.includes('<script>') || html.includes('<script ');
    const hasLinkedScript = html.includes('src="script.js"') || html.includes("src='script.js'");
    
    if (jsFiles.length > 0 && !hasInlineScript && !hasLinkedScript) {
      const jsContent = jsFiles.map((f) => f.content).join('\n\n');
      const scriptTag = `  <script>\n${jsContent}\n  </script>`;
      
      // Try to inject before </body>
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${scriptTag}\n</body>`);
      } else {
        // If no closing body tag, append at the end
        html += `\n${scriptTag}`;
      }
    }
    
    return html;
  }

  // Otherwise, build HTML from scratch
  const htmlContent = htmlFile?.content || '<div class="container"><h1>No content generated yet</h1></div>';
  const cssContent = cssFiles.map((f) => f.content).join('\n\n');
  const jsContent = jsFiles.map((f) => f.content).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Profile Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    ${cssContent}
  </style>
</head>
<body>
  ${htmlContent}
  
  <script>
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
</html>`.trim();
}

export function LivePreview({ files, refreshKey = 0 }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Create a stable hash of file contents to detect changes
  const filesHash = files.map(f => `${f.path}:${f.content.substring(0, 50)}`).join('|');

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

  // Function to update iframe content
  const updatePreview = () => {
    if (iframeRef.current && files.length > 0) {
      try {
        const previewHTML = buildPreviewHTML(files);
        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

        if (iframeDoc) {
          console.log('Updating preview with', files.length, 'files');
          iframeDoc.open();
          iframeDoc.write(previewHTML);
          iframeDoc.close();
        }
      } catch (err) {
        console.error('Preview update error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render preview');
      }
    }
  };

  useEffect(() => {
    // Clear error when files change
    setError(null);
    
    // Update preview whenever files change or refresh is triggered
    console.log('Files changed, updating preview. Hash:', filesHash.substring(0, 100));
    updatePreview();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesHash, refreshKey]);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Error display - only show if there's an error */}
      {error && (
        <div className="border-b bg-red-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 flex-shrink-0 text-red-600"
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
              <p className="text-sm font-medium text-red-800">
                Preview Error
              </p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
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

      {/* Preview iframe - full height, no header */}
      <div className="flex-1 overflow-hidden bg-white">
        <iframe
          ref={iframeRef}
          key={refreshKey}
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

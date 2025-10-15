'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { GeneratedFile } from './preview-panel';

interface CodeEditorProps {
  file: GeneratedFile;
}

function getLanguageForHighlighter(language: string): string {
  const languageMap: Record<string, string> = {
    tsx: 'tsx',
    typescript: 'typescript',
    javascript: 'javascript',
    html: 'markup',
    css: 'css',
  };
  return languageMap[language] || 'markup';
}

export function CodeEditor({ file }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      {/* Header with file name and actions */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#1e1e1e] px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-sm font-medium text-white/90 truncate">{file.path}</span>
          {file.isGenerating && (
            <span className="flex items-center gap-1.5 text-xs text-orange-500 flex-shrink-0">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
              Generating...
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-4">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white whitespace-nowrap"
            aria-label="Copy code to clipboard"
          >
            {copied ? (
              <>
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white whitespace-nowrap"
            aria-label="Download file"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Code content with syntax highlighting */}
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={getLanguageForHighlighter(file.language)}
          style={vscDarkPlus}
          showLineNumbers
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            height: '100%',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            },
          }}
        >
          {file.content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { FileTree } from './file-tree';
import { CodeEditor } from './code-editor';
import { LivePreview } from './live-preview';
import { downloadFilesAsZip } from '@/lib/utils/download-utils';
import { IconDownload } from '@tabler/icons-react';
import type { GeneratedFile } from '@/hooks/use-file-state';

export type { GeneratedFile };

interface PreviewPanelProps {
  files: GeneratedFile[];
  activeFile: string | null;
  previewMode: 'code' | 'preview';
  onFileSelect: (filePath: string) => void;
  onModeChange: (mode: 'code' | 'preview') => void;
}

export function PreviewPanel({
  files,
  activeFile,
  previewMode,
  onFileSelect,
  onModeChange,
}: PreviewPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const activeFileData = files.find((f) => f.path === activeFile);

  const handleDownloadAll = async () => {
    if (files.length === 0) return;

    setIsDownloading(true);
    try {
      await downloadFilesAsZip(
        files.map((file) => ({
          path: file.path,
          content: file.content,
        })),
        'profile-page.zip'
      );
    } catch (error) {
      console.error('Error downloading files:', error);
      alert('Failed to download files. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0a0a]">
      {/* Header with toggle */}
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={() => onModeChange('code')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                previewMode === 'code'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
              aria-pressed={previewMode === 'code'}
              aria-label="Show code view"
            >
              Code
            </button>
            <button
              onClick={() => onModeChange('preview')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                previewMode === 'preview'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
              aria-pressed={previewMode === 'preview'}
              aria-label="Show live preview"
            >
              Preview
            </button>
            {files.length > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                aria-label="Download all files as ZIP"
              >
                <IconDownload className="h-4 w-4" />
                {isDownloading ? 'Downloading...' : 'Download All'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {files.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-center">
            <div className="space-y-2">
              <p className="text-lg font-medium text-white">No files generated yet</p>
              <p className="text-sm text-white/50">
                Start a conversation to generate your profile page
              </p>
            </div>
          </div>
        ) : (
          <>
            {previewMode === 'code' ? (
              <>
                {/* File Tree Sidebar */}
                <div className="w-64 border-r border-white/10">
                  <FileTree
                    files={files}
                    activeFile={activeFile}
                    onFileSelect={onFileSelect}
                  />
                </div>

                {/* Code Editor */}
                <div className="flex-1">
                  {activeFileData ? (
                    <CodeEditor file={activeFileData} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-center">
                      <p className="text-sm text-white/50">
                        Select a file to view its contents
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1">
                <LivePreview files={files} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

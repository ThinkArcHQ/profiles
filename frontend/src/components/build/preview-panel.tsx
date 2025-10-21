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
  refreshKey?: number;
}

export function PreviewPanel({
  files,
  activeFile,
  previewMode,
  onFileSelect,
  onModeChange,
  refreshKey = 0,
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

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {files.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-center p-8">
            <div className="space-y-4 max-w-md">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-white mb-2">Ready to build</p>
                <p className="text-sm text-white/50 leading-relaxed">
                  Start a conversation to generate your profile page. The code will appear here in real-time.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {previewMode === 'code' ? (
              <>
                {/* File Tree Sidebar */}
                <div className="w-64 border-r border-white/10 bg-[#0a0a0a]">
                  <FileTree
                    files={files}
                    activeFile={activeFile}
                    onFileSelect={onFileSelect}
                  />
                </div>

                {/* Code Editor */}
                <div className="flex-1 bg-[#1e1e1e]">
                  {activeFileData ? (
                    <CodeEditor file={activeFileData} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-center p-8">
                      <div className="space-y-3">
                        <svg className="w-12 h-12 mx-auto text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-white/50">
                          Select a file from the sidebar
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 bg-white">
                <LivePreview files={files} refreshKey={refreshKey} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

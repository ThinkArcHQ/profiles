'use client';

import { useMemo } from 'react';
import type { GeneratedFile } from './preview-panel';

interface FileTreeProps {
  files: GeneratedFile[];
  activeFile: string | null;
  onFileSelect: (filePath: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  file?: GeneratedFile;
}

function buildFileTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  files.forEach((file) => {
    const parts = file.path.split('/');
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const path = parts.slice(0, index + 1).join('/');

      let existingNode = currentLevel.find((node) => node.name === part);

      if (!existingNode) {
        existingNode = {
          name: part,
          path,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          file: isFile ? file : undefined,
        };
        currentLevel.push(existingNode);
      }

      if (!isFile && existingNode.children) {
        currentLevel = existingNode.children;
      }
    });
  });

  return root;
}

function getFileExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? `.${ext}` : '';
}

function TreeNodeComponent({
  node,
  activeFile,
  onFileSelect,
  level = 0,
}: {
  node: TreeNode;
  activeFile: string | null;
  onFileSelect: (filePath: string) => void;
  level?: number;
}) {
  const isActive = node.type === 'file' && node.path === activeFile;
  const paddingLeft = level * 12 + 8;

  if (node.type === 'file') {
    return (
      <button
        onClick={() => onFileSelect(node.path)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-mono transition-all group ${
          isActive 
            ? 'bg-orange-500/10 text-white border-l-2 border-orange-500' 
            : 'text-white/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
        }`}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className="truncate flex-1">{node.name}</span>
        {node.file?.isGenerating && (
          <span className="flex items-center gap-1.5 text-xs text-orange-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
          </span>
        )}
      </button>
    );
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 text-sm font-mono font-medium text-white/50"
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
      >
        <span className="truncate">{node.name}/</span>
      </div>
      {node.children?.map((child) => (
        <TreeNodeComponent
          key={child.path}
          node={child}
          activeFile={activeFile}
          onFileSelect={onFileSelect}
          level={level + 1}
        />
      ))}
    </div>
  );
}

export function FileTree({ files, activeFile, onFileSelect }: FileTreeProps) {
  const tree = useMemo(() => buildFileTree(files), [files]);

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a]">
      <div className="border-b border-white/10 px-3 py-3">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Files
        </p>
      </div>
      <div className="py-2">
        {tree.map((node) => (
          <TreeNodeComponent
            key={node.path}
            node={node}
            activeFile={activeFile}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    </div>
  );
}

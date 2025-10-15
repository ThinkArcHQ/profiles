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

function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'html':
      return '📄';
    case 'css':
      return '🎨';
    case 'js':
    case 'jsx':
      return '📜';
    case 'ts':
    case 'tsx':
      return '📘';
    case 'json':
      return '📋';
    case 'md':
      return '📝';
    default:
      return '📄';
  }
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
        className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
          isActive ? 'bg-muted font-medium' : ''
        }`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className="text-base">{getFileIcon(node.name)}</span>
        <span className="truncate">{node.name}</span>
        {node.file?.isGenerating && (
          <span className="ml-auto flex items-center gap-1 text-xs text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Generating...
          </span>
        )}
      </button>
    );
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <span className="text-base">📁</span>
        <span className="truncate">{node.name}</span>
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
    <div className="h-full overflow-y-auto">
      <div className="border-b p-2">
        <p className="text-xs font-medium text-muted-foreground">
          FILES ({files.length})
        </p>
      </div>
      <div className="py-1">
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

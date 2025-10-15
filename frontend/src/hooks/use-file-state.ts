import { useState, useCallback } from 'react';

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  isGenerating?: boolean;
}

export interface FileState {
  files: GeneratedFile[];
  activeFile: string | null;
  generatingFiles: Set<string>;
}

export interface FileStateActions {
  addFile: (file: GeneratedFile) => void;
  updateFile: (path: string, content: string, isComplete?: boolean) => void;
  setActiveFile: (path: string | null) => void;
  clearFiles: () => void;
  markFileComplete: (path: string) => void;
  markAllFilesComplete: () => void;
  getFile: (path: string) => GeneratedFile | undefined;
}

/**
 * Custom hook for managing generated file state
 * Tracks files, active file selection, and generation status
 */
export function useFileState(): [FileState, FileStateActions] {
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [activeFile, setActiveFileState] = useState<string | null>(null);
  const [generatingFiles, setGeneratingFiles] = useState<Set<string>>(new Set());

  const addFile = useCallback((file: GeneratedFile) => {
    setFiles(prev => {
      const existingIndex = prev.findIndex(f => f.path === file.path);
      if (existingIndex >= 0) {
        // Update existing file
        const updated = [...prev];
        updated[existingIndex] = file;
        return updated;
      }
      // Add new file
      return [...prev, file];
    });

    // Track if file is generating
    if (file.isGenerating) {
      setGeneratingFiles(prev => new Set(prev).add(file.path));
    } else {
      setGeneratingFiles(prev => {
        const next = new Set(prev);
        next.delete(file.path);
        return next;
      });
    }

    // Set as active if it's the first file
    setActiveFileState(prev => {
      if (prev === null) {
        return file.path;
      }
      return prev;
    });
  }, []);

  const updateFile = useCallback((path: string, content: string, isComplete = false) => {
    setFiles(prev => {
      const existingIndex = prev.findIndex(f => f.path === path);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          content,
          isGenerating: !isComplete,
        };
        return updated;
      }
      // File doesn't exist, create it
      return [...prev, {
        path,
        content,
        language: inferLanguageFromPath(path),
        isGenerating: !isComplete,
      }];
    });

    // Update generating status
    if (isComplete) {
      setGeneratingFiles(prev => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
    } else {
      setGeneratingFiles(prev => new Set(prev).add(path));
    }
  }, []);

  const setActiveFile = useCallback((path: string | null) => {
    setActiveFileState(path);
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setActiveFileState(null);
    setGeneratingFiles(new Set());
  }, []);

  const markFileComplete = useCallback((path: string) => {
    setFiles(prev => 
      prev.map(file => 
        file.path === path 
          ? { ...file, isGenerating: false }
          : file
      )
    );
    setGeneratingFiles(prev => {
      const next = new Set(prev);
      next.delete(path);
      return next;
    });
  }, []);

  const markAllFilesComplete = useCallback(() => {
    setFiles(prev => prev.map(file => ({ ...file, isGenerating: false })));
    setGeneratingFiles(new Set());
  }, []);

  const getFile = useCallback((path: string) => {
    return files.find(f => f.path === path);
  }, [files]);

  const state: FileState = {
    files,
    activeFile,
    generatingFiles,
  };

  const actions: FileStateActions = {
    addFile,
    updateFile,
    setActiveFile,
    clearFiles,
    markFileComplete,
    markAllFilesComplete,
    getFile,
  };

  return [state, actions];
}

/**
 * Infer language from file path extension
 */
function inferLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  
  const languageMap: Record<string, string> = {
    html: 'html',
    css: 'css',
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    json: 'json',
    md: 'markdown',
  };
  
  return languageMap[ext] || 'text';
}

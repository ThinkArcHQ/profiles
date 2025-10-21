/**
 * Utility functions for parsing code blocks from AI responses
 */

import {
  parseSearchReplace,
  applySearchReplace,
  hasSearchReplaceBlocks,
  type SearchReplaceBlock,
} from './search-replace-parser';

export interface ParsedCodeBlock {
  path: string;
  content: string;
  language: string;
  isComplete: boolean;
  isSearchReplace?: boolean;
  searchReplaceBlocks?: SearchReplaceBlock[];
}

export interface ParsedFile {
  path: string;
  content: string;
  language: string;
}

/**
 * Extracts code blocks from markdown-formatted text
 * Supports multiple formats:
 * 1. FILE: path with SEARCH/REPLACE blocks (for modifications)
 * 2. FILE: path/to/file.tsx followed by ```language (for full files)
 * 3. ```language:path or ```language (fallback)
 */
export function parseCodeBlocks(text: string): ParsedCodeBlock[] {
  const blocks: ParsedCodeBlock[] = [];
  
  // Check if this response contains SEARCH/REPLACE blocks
  if (hasSearchReplaceBlocks(text)) {
    const edits = parseSearchReplace(text);
    
    edits.forEach(edit => {
      blocks.push({
        path: edit.file,
        content: '', // Will be applied to existing content
        language: getLanguageFromPath(edit.file),
        isComplete: true,
        isSearchReplace: true,
        searchReplaceBlocks: edit.blocks,
      });
    });
    
    return blocks;
  }
  
  // Otherwise, parse as full file blocks
  // Pattern: FILE: path\n```language\ncontent\n```
  const fileBlockRegex = /FILE:\s*([^\n]+)\n```(\w+)\n([\s\S]*?)(?:```|$)/g;
  
  let match;
  while ((match = fileBlockRegex.exec(text)) !== null) {
    const [fullMatch, path, language, content] = match;
    const isComplete = fullMatch.endsWith('```');
    
    blocks.push({
      path: path.trim(),
      content: content.trim(),
      language: language.toLowerCase(),
      isComplete,
      isSearchReplace: false,
    });
  }
  
  // If no FILE: format blocks found, fall back to standard format
  if (blocks.length === 0) {
    // Match code blocks with optional file path
    // Pattern: ```language:path or ```language
    const codeBlockRegex = /```(\w+)(?::([^\n]+))?\n([\s\S]*?)(?:```|$)/g;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const [fullMatch, language, path, content] = match;
      const isComplete = fullMatch.endsWith('```');
      
      blocks.push({
        path: path?.trim() || inferPathFromLanguage(language, blocks.length),
        content: content.trim(),
        language: language.toLowerCase(),
        isComplete,
        isSearchReplace: false,
      });
    }
  }
  
  return blocks;
}

/**
 * Infers a file path from the language if not explicitly provided
 */
function inferPathFromLanguage(language: string, index: number): string {
  const extensions: Record<string, string> = {
    html: 'index.html',
    css: 'styles.css',
    javascript: 'script.js',
    js: 'script.js',
    typescript: 'script.ts',
    ts: 'script.ts',
    tsx: 'component.tsx',
    jsx: 'component.jsx',
  };
  
  const baseFile = extensions[language.toLowerCase()] || `file${index}.txt`;
  
  // If we already have an index.html, use page.html, etc.
  if (index > 0 && baseFile === 'index.html') {
    return `page${index}.html`;
  }
  
  return baseFile;
}

/**
 * Determines the language from a file path
 */
export function getLanguageFromPath(path: string): string {
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

/**
 * Merges new code blocks with existing files
 * Handles both full file replacements and SEARCH/REPLACE modifications
 */
export function mergeCodeBlocks(
  existingFiles: ParsedFile[],
  newBlocks: ParsedCodeBlock[]
): ParsedFile[] {
  const fileMap = new Map<string, ParsedFile>();
  
  // Add existing files to map
  existingFiles.forEach(file => {
    fileMap.set(file.path, file);
  });
  
  // Update or add new blocks
  newBlocks.forEach(block => {
    // Handle SEARCH/REPLACE blocks
    if (block.isSearchReplace && block.searchReplaceBlocks) {
      const existing = fileMap.get(block.path);
      
      if (existing) {
        // Apply SEARCH/REPLACE to existing content
        const result = applySearchReplace(existing.content, block.searchReplaceBlocks);
        
        if (result.success) {
          fileMap.set(block.path, {
            ...existing,
            content: result.content,
          });
        } else {
          // Log errors but keep existing content
          console.warn(`Failed to apply SEARCH/REPLACE to ${block.path}:`, result.errors);
        }
      } else {
        console.warn(`Cannot apply SEARCH/REPLACE to non-existent file: ${block.path}`);
      }
    }
    // Handle full file blocks
    else if (block.isComplete) {
      fileMap.set(block.path, {
        path: block.path,
        content: block.content,
        language: block.language,
      });
    }
    // Handle incomplete streaming blocks
    else {
      const existing = fileMap.get(block.path);
      if (existing) {
        fileMap.set(block.path, {
          ...existing,
          content: block.content, // Replace with latest partial content
        });
      } else {
        fileMap.set(block.path, {
          path: block.path,
          content: block.content,
          language: block.language,
        });
      }
    }
  });
  
  return Array.from(fileMap.values());
}

/**
 * Extracts explanation text (non-code content) from AI response
 */
export function extractExplanation(text: string): string {
  // Remove code blocks and return remaining text
  const withoutCodeBlocks = text.replace(/```[\s\S]*?```/g, '');
  return withoutCodeBlocks.trim();
}

/**
 * Detects if a user message is requesting modifications to existing code
 * Returns true if the message contains modification keywords
 */
export function isModificationRequest(message: string): boolean {
  const modificationKeywords = [
    'change',
    'modify',
    'update',
    'edit',
    'fix',
    'adjust',
    'improve',
    'refactor',
    'add',
    'remove',
    'delete',
    'replace',
    'make it',
    'can you',
    'please',
    'instead',
    'different',
    'better',
    'more',
    'less',
  ];
  
  const lowerMessage = message.toLowerCase();
  return modificationKeywords.some(keyword => lowerMessage.includes(keyword));
}

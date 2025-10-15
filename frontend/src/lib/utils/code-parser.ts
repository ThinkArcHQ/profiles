/**
 * Utility functions for parsing code blocks from AI responses
 */

export interface ParsedCodeBlock {
  path: string;
  content: string;
  language: string;
  isComplete: boolean;
}

export interface ParsedFile {
  path: string;
  content: string;
  language: string;
}

/**
 * Extracts code blocks from markdown-formatted text
 * Supports multiple formats:
 * 1. FILE: path/to/file.tsx followed by ```language
 * 2. ```language:path
 * 3. Standard ```language
 */
export function parseCodeBlocks(text: string): ParsedCodeBlock[] {
  const blocks: ParsedCodeBlock[] = [];
  
  // First, try to match FILE: path format (our system prompt format)
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
 * Updates existing files or adds new ones
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
    if (block.isComplete) {
      fileMap.set(block.path, {
        path: block.path,
        content: block.content,
        language: block.language,
      });
    } else {
      // If incomplete, append to existing content
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

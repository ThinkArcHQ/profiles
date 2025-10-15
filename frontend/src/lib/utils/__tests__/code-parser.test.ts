import { describe, it, expect } from 'vitest';
import { parseCodeBlocks, getLanguageFromPath, mergeCodeBlocks } from '../code-parser';

describe('code-parser', () => {
  describe('parseCodeBlocks', () => {
    it('should parse a single code block with file path', () => {
      const text = '```html:index.html\n<h1>Hello</h1>\n```';
      const blocks = parseCodeBlocks(text);

      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toEqual({
        path: 'index.html',
        content: '<h1>Hello</h1>',
        language: 'html',
        isComplete: true,
      });
    });

    it('should parse multiple code blocks', () => {
      const text = `
\`\`\`html:index.html
<h1>Hello</h1>
\`\`\`

\`\`\`css:styles.css
body { margin: 0; }
\`\`\`
      `;
      const blocks = parseCodeBlocks(text);

      expect(blocks).toHaveLength(2);
      expect(blocks[0].path).toBe('index.html');
      expect(blocks[1].path).toBe('styles.css');
    });

    it('should handle incomplete code blocks', () => {
      const text = '```html:index.html\n<h1>Hello';
      const blocks = parseCodeBlocks(text);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].isComplete).toBe(false);
    });

    it('should infer file path from language', () => {
      const text = '```html\n<h1>Hello</h1>\n```';
      const blocks = parseCodeBlocks(text);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].path).toBe('index.html');
    });

    it('should handle code blocks without file paths', () => {
      const text = '```javascript\nconsole.log("test");\n```';
      const blocks = parseCodeBlocks(text);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].language).toBe('javascript');
      expect(blocks[0].path).toBe('script.js');
    });
  });

  describe('getLanguageFromPath', () => {
    it('should return correct language for HTML files', () => {
      expect(getLanguageFromPath('index.html')).toBe('html');
    });

    it('should return correct language for CSS files', () => {
      expect(getLanguageFromPath('styles.css')).toBe('css');
    });

    it('should return correct language for JavaScript files', () => {
      expect(getLanguageFromPath('script.js')).toBe('javascript');
    });

    it('should return correct language for TypeScript files', () => {
      expect(getLanguageFromPath('component.tsx')).toBe('tsx');
    });

    it('should return text for unknown extensions', () => {
      expect(getLanguageFromPath('unknown.xyz')).toBe('text');
    });
  });

  describe('mergeCodeBlocks', () => {
    it('should add new files', () => {
      const existing = [
        { path: 'index.html', content: '<h1>Old</h1>', language: 'html' },
      ];
      const newBlocks = [
        { path: 'styles.css', content: 'body {}', language: 'css', isComplete: true },
      ];

      const result = mergeCodeBlocks(existing, newBlocks);

      expect(result).toHaveLength(2);
      expect(result.find(f => f.path === 'styles.css')).toBeDefined();
    });

    it('should update existing files', () => {
      const existing = [
        { path: 'index.html', content: '<h1>Old</h1>', language: 'html' },
      ];
      const newBlocks = [
        { path: 'index.html', content: '<h1>New</h1>', language: 'html', isComplete: true },
      ];

      const result = mergeCodeBlocks(existing, newBlocks);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('<h1>New</h1>');
    });

    it('should handle incomplete blocks', () => {
      const existing = [
        { path: 'index.html', content: '<h1>Hello</h1>', language: 'html' },
      ];
      const newBlocks = [
        { path: 'index.html', content: '<h1>Hello</h1>\n<p>World', language: 'html', isComplete: false },
      ];

      const result = mergeCodeBlocks(existing, newBlocks);

      expect(result).toHaveLength(1);
      expect(result[0].content).toContain('World');
    });
  });
});

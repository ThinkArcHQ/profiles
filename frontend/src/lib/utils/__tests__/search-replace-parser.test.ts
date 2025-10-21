import { describe, it, expect } from '@jest/globals';
import {
  parseSearchReplace,
  applySearchReplace,
  hasSearchReplaceBlocks,
  isModificationRequest,
} from '../search-replace-parser';

describe('search-replace-parser', () => {
  describe('hasSearchReplaceBlocks', () => {
    it('should detect SEARCH/REPLACE blocks', () => {
      const content = `
FILE: index.html
<<<<<<< SEARCH
<h1>Old Title</h1>
=======
<h1>New Title</h1>
>>>>>>> REPLACE
`;
      expect(hasSearchReplaceBlocks(content)).toBe(true);
    });

    it('should return false for regular content', () => {
      const content = 'Just some regular text';
      expect(hasSearchReplaceBlocks(content)).toBe(false);
    });
  });

  describe('parseSearchReplace', () => {
    it('should parse single SEARCH/REPLACE block', () => {
      const content = `
FILE: index.html
<<<<<<< SEARCH
<h1>Old Title</h1>
=======
<h1>New Title</h1>
>>>>>>> REPLACE
`;
      const result = parseSearchReplace(content);
      
      expect(result).toHaveLength(1);
      expect(result[0].file).toBe('index.html');
      expect(result[0].blocks).toHaveLength(1);
      expect(result[0].blocks[0].search).toBe('<h1>Old Title</h1>');
      expect(result[0].blocks[0].replace).toBe('<h1>New Title</h1>');
    });

    it('should parse multiple SEARCH/REPLACE blocks in same file', () => {
      const content = `
FILE: index.html
<<<<<<< SEARCH
<h1>Old Title</h1>
=======
<h1>New Title</h1>
>>>>>>> REPLACE

<<<<<<< SEARCH
<p>Old text</p>
=======
<p>New text</p>
>>>>>>> REPLACE
`;
      const result = parseSearchReplace(content);
      
      expect(result).toHaveLength(1);
      expect(result[0].blocks).toHaveLength(2);
    });

    it('should parse multiple files', () => {
      const content = `
FILE: index.html
<<<<<<< SEARCH
<h1>Old</h1>
=======
<h1>New</h1>
>>>>>>> REPLACE

FILE: styles.css
<<<<<<< SEARCH
color: red;
=======
color: blue;
>>>>>>> REPLACE
`;
      const result = parseSearchReplace(content);
      
      expect(result).toHaveLength(2);
      expect(result[0].file).toBe('index.html');
      expect(result[1].file).toBe('styles.css');
    });
  });

  describe('applySearchReplace', () => {
    it('should apply exact match replacement', () => {
      const content = '<h1>Old Title</h1>\n<p>Some text</p>';
      const blocks = [
        {
          file: 'index.html',
          search: '<h1>Old Title</h1>',
          replace: '<h1>New Title</h1>',
        },
      ];

      const result = applySearchReplace(content, blocks);

      expect(result.success).toBe(true);
      expect(result.content).toContain('<h1>New Title</h1>');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle multiple replacements', () => {
      const content = '<h1>Title</h1>\n<p>Text</p>';
      const blocks = [
        {
          file: 'index.html',
          search: '<h1>Title</h1>',
          replace: '<h1>New Title</h1>',
        },
        {
          file: 'index.html',
          search: '<p>Text</p>',
          replace: '<p>New Text</p>',
        },
      ];

      const result = applySearchReplace(content, blocks);

      expect(result.success).toBe(true);
      expect(result.content).toContain('<h1>New Title</h1>');
      expect(result.content).toContain('<p>New Text</p>');
    });

    it('should report error when search block not found', () => {
      const content = '<h1>Title</h1>';
      const blocks = [
        {
          file: 'index.html',
          search: '<h1>Different Title</h1>',
          replace: '<h1>New Title</h1>',
        },
      ];

      const result = applySearchReplace(content, blocks);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('isModificationRequest', () => {
    it('should detect modification keywords', () => {
      expect(isModificationRequest('change the color', true)).toBe(true);
      expect(isModificationRequest('update the text', true)).toBe(true);
      expect(isModificationRequest('fix the button', true)).toBe(true);
      expect(isModificationRequest('make it blue', true)).toBe(true);
    });

    it('should return false when no existing files', () => {
      expect(isModificationRequest('change the color', false)).toBe(false);
    });

    it('should return false for creation requests', () => {
      expect(isModificationRequest('create a hero section', true)).toBe(false);
      expect(isModificationRequest('build a new page', true)).toBe(false);
    });
  });
});

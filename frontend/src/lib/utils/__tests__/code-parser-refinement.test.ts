import { describe, it, expect } from 'vitest';
import { parseCodeBlocks, isModificationRequest, mergeCodeBlocks } from '../code-parser';

describe('Code Parser - Iterative Refinement', () => {
  describe('parseCodeBlocks with FILE: format', () => {
    it('should parse FILE: format correctly', () => {
      const text = `
Here's the updated code:

FILE: components/Profile.tsx
\`\`\`tsx
export default function Profile() {
  return <div>Updated Profile</div>;
}
\`\`\`

FILE: styles/profile.css
\`\`\`css
.profile {
  color: blue;
}
\`\`\`
`;

      const blocks = parseCodeBlocks(text);
      
      expect(blocks).toHaveLength(2);
      expect(blocks[0].path).toBe('components/Profile.tsx');
      expect(blocks[0].language).toBe('tsx');
      expect(blocks[0].content).toContain('Updated Profile');
      expect(blocks[1].path).toBe('styles/profile.css');
      expect(blocks[1].language).toBe('css');
    });

    it('should handle incomplete code blocks', () => {
      const text = `
FILE: test.tsx
\`\`\`tsx
export default function Test() {
  return <div>Incomplete
`;

      const blocks = parseCodeBlocks(text);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].isComplete).toBe(false);
    });

    it('should fall back to standard format if no FILE: format found', () => {
      const text = `
\`\`\`tsx:component.tsx
export default function Component() {
  return <div>Standard Format</div>;
}
\`\`\`
`;

      const blocks = parseCodeBlocks(text);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].path).toBe('component.tsx');
    });
  });

  describe('isModificationRequest', () => {
    it('should detect modification keywords', () => {
      expect(isModificationRequest('Change the color to blue')).toBe(true);
      expect(isModificationRequest('Update the header section')).toBe(true);
      expect(isModificationRequest('Can you add a footer?')).toBe(true);
      expect(isModificationRequest('Remove the sidebar')).toBe(true);
      expect(isModificationRequest('Make it more responsive')).toBe(true);
      expect(isModificationRequest('Fix the layout issue')).toBe(true);
    });

    it('should not detect non-modification requests', () => {
      expect(isModificationRequest('Create a profile page')).toBe(false);
      expect(isModificationRequest('Generate a landing page')).toBe(false);
      expect(isModificationRequest('Build a portfolio site')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isModificationRequest('CHANGE THE COLOR')).toBe(true);
      expect(isModificationRequest('Change The Color')).toBe(true);
    });
  });

  describe('mergeCodeBlocks', () => {
    it('should update existing files', () => {
      const existingFiles = [
        { path: 'index.html', content: '<div>Old</div>', language: 'html' },
        { path: 'styles.css', content: '.old { }', language: 'css' },
      ];

      const newBlocks = [
        { path: 'index.html', content: '<div>New</div>', language: 'html', isComplete: true },
      ];

      const merged = mergeCodeBlocks(existingFiles, newBlocks);

      expect(merged).toHaveLength(2);
      const updatedFile = merged.find(f => f.path === 'index.html');
      expect(updatedFile?.content).toBe('<div>New</div>');
      
      const unchangedFile = merged.find(f => f.path === 'styles.css');
      expect(unchangedFile?.content).toBe('.old { }');
    });

    it('should add new files', () => {
      const existingFiles = [
        { path: 'index.html', content: '<div>Content</div>', language: 'html' },
      ];

      const newBlocks = [
        { path: 'script.js', content: 'console.log("new");', language: 'javascript', isComplete: true },
      ];

      const merged = mergeCodeBlocks(existingFiles, newBlocks);

      expect(merged).toHaveLength(2);
      expect(merged.find(f => f.path === 'script.js')).toBeDefined();
    });

    it('should preserve structure when updating multiple files', () => {
      const existingFiles = [
        { path: 'components/Header.tsx', content: 'Old Header', language: 'tsx' },
        { path: 'components/Footer.tsx', content: 'Old Footer', language: 'tsx' },
        { path: 'styles/main.css', content: 'Old Styles', language: 'css' },
      ];

      const newBlocks = [
        { path: 'components/Header.tsx', content: 'New Header', language: 'tsx', isComplete: true },
        { path: 'styles/main.css', content: 'New Styles', language: 'css', isComplete: true },
      ];

      const merged = mergeCodeBlocks(existingFiles, newBlocks);

      expect(merged).toHaveLength(3);
      expect(merged.find(f => f.path === 'components/Header.tsx')?.content).toBe('New Header');
      expect(merged.find(f => f.path === 'components/Footer.tsx')?.content).toBe('Old Footer');
      expect(merged.find(f => f.path === 'styles/main.css')?.content).toBe('New Styles');
    });
  });
});

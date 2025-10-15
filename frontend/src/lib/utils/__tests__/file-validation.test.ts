import { describe, it, expect } from 'vitest';
import {
  validateFile,
  validateFiles,
  isImageFile,
  isPDFFile,
  formatFileSize,
  MAX_FILE_SIZE,
  MAX_FILE_COUNT,
} from '../file-validation';

describe('file-validation', () => {
  describe('validateFile', () => {
    it('should accept valid PNG file', () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid JPEG file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid WEBP file', () => {
      const file = new File(['content'], 'test.webp', { type: 'image/webp' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid PDF file', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid file type', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('invalid_type');
    });

    it('should reject file larger than 10MB', () => {
      const largeContent = new Uint8Array(MAX_FILE_SIZE + 1);
      const file = new File([largeContent], 'large.png', { type: 'image/png' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('file_too_large');
    });
  });

  describe('validateFiles', () => {
    it('should accept valid files within count limit', () => {
      const files = [
        new File(['1'], 'test1.png', { type: 'image/png' }),
        new File(['2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];
      const result = validateFiles(files);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject when total count exceeds limit', () => {
      const files = Array.from({ length: 6 }, (_, i) =>
        new File([`${i}`], `test${i}.png`, { type: 'image/png' })
      );
      const result = validateFiles(files);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('too_many_files');
    });

    it('should consider existing file count', () => {
      const files = [
        new File(['1'], 'test1.png', { type: 'image/png' }),
        new File(['2'], 'test2.png', { type: 'image/png' }),
      ];
      const result = validateFiles(files, 4); // 4 existing + 2 new = 6 total
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('too_many_files');
    });

    it('should collect multiple errors', () => {
      const files = [
        new File(['valid'], 'valid.png', { type: 'image/png' }),
        new File(['invalid'], 'invalid.txt', { type: 'text/plain' }),
        new File([new Uint8Array(MAX_FILE_SIZE + 1)], 'large.png', { type: 'image/png' }),
      ];
      const result = validateFiles(files);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('isImageFile', () => {
    it('should return true for image files', () => {
      expect(isImageFile(new File([''], 'test.png', { type: 'image/png' }))).toBe(true);
      expect(isImageFile(new File([''], 'test.jpg', { type: 'image/jpeg' }))).toBe(true);
      expect(isImageFile(new File([''], 'test.webp', { type: 'image/webp' }))).toBe(true);
    });

    it('should return false for non-image files', () => {
      expect(isImageFile(new File([''], 'test.pdf', { type: 'application/pdf' }))).toBe(false);
      expect(isImageFile(new File([''], 'test.txt', { type: 'text/plain' }))).toBe(false);
    });
  });

  describe('isPDFFile', () => {
    it('should return true for PDF files', () => {
      expect(isPDFFile(new File([''], 'test.pdf', { type: 'application/pdf' }))).toBe(true);
    });

    it('should return false for non-PDF files', () => {
      expect(isPDFFile(new File([''], 'test.png', { type: 'image/png' }))).toBe(false);
      expect(isPDFFile(new File([''], 'test.txt', { type: 'text/plain' }))).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1536 * 1024)).toBe('1.5 MB');
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB');
    });
  });
});

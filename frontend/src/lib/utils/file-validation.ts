/**
 * File validation utilities for upload functionality
 * Validates file types, sizes, and counts according to requirements
 */

export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const;

export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'] as const;

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const MAX_FILE_COUNT = 5;

export type FileValidationError = {
  code: 'invalid_type' | 'file_too_large' | 'too_many_files';
  message: string;
  fileName?: string;
};

export type FileValidationResult = {
  valid: boolean;
  errors: FileValidationError[];
};

/**
 * Validates a single file against type and size constraints
 */
export function validateFile(file: File): FileValidationResult {
  const errors: FileValidationError[] = [];

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
    errors.push({
      code: 'invalid_type',
      message: `File type "${file.type}" is not supported. Allowed types: PNG, JPEG, WEBP, PDF`,
      fileName: file.name,
    });
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    errors.push({
      code: 'file_too_large',
      message: `File "${file.name}" is ${sizeMB}MB. Maximum size is 10MB`,
      fileName: file.name,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates multiple files against type, size, and count constraints
 */
export function validateFiles(
  files: File[],
  existingFileCount: number = 0
): FileValidationResult {
  const errors: FileValidationError[] = [];

  // Check total file count
  const totalCount = files.length + existingFileCount;
  if (totalCount > MAX_FILE_COUNT) {
    errors.push({
      code: 'too_many_files',
      message: `Cannot upload ${files.length} files. Maximum is ${MAX_FILE_COUNT} files total (${existingFileCount} already uploaded)`,
    });
    return { valid: false, errors };
  }

  // Validate each file
  for (const file of files) {
    const result = validateFile(file);
    errors.push(...result.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if a file is an image
 */
export function isImageFile(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type as any);
}

/**
 * Checks if a file is a PDF document
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

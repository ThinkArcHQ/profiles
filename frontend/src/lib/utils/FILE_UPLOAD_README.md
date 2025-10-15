# File Upload Functionality

This directory contains utilities for handling file uploads in the AI chat interface, including validation, processing, and preview components.

## Overview

The file upload system supports:
- **Image files**: PNG, JPEG, WEBP (converted to base64)
- **PDF documents**: Text extraction for AI context
- **Validation**: File type, size (max 10MB), and count (max 5 files)
- **Preview**: Thumbnails for images, file names for PDFs

## Components

### 1. File Validation (`file-validation.ts`)

Validates files against type, size, and count constraints.

**Key Functions:**
- `validateFile(file: File)` - Validates a single file
- `validateFiles(files: File[], existingCount)` - Validates multiple files
- `isImageFile(file: File)` - Checks if file is an image
- `isPDFFile(file: File)` - Checks if file is a PDF
- `formatFileSize(bytes: number)` - Formats file size for display

**Constants:**
- `MAX_FILE_SIZE` = 10MB
- `MAX_FILE_COUNT` = 5
- `ALLOWED_IMAGE_TYPES` = PNG, JPEG, WEBP
- `ALLOWED_DOCUMENT_TYPES` = PDF

**Example:**
```typescript
import { validateFiles } from '@/lib/utils/file-validation';

const result = validateFiles(selectedFiles, existingFiles.length);

if (!result.valid) {
  result.errors.forEach(error => {
    console.error(error.message);
  });
}
```

### 2. File Processing (`file-processing.ts`)

Processes files for AI consumption - converts images to base64 and extracts text from PDFs.

**Key Functions:**
- `imageToBase64(file: File)` - Converts image to base64 data URL
- `extractPDFText(file: File)` - Extracts text from PDF using pdf.js
- `processFile(file: File)` - Processes a single file
- `processFiles(files: File[])` - Processes multiple files in parallel
- `createImagePreview(file: File)` - Creates blob URL for preview
- `revokeImagePreview(url: string)` - Cleans up blob URL

**Example:**
```typescript
import { processFiles } from '@/lib/utils/file-processing';

const processedFiles = await processFiles(uploadedFiles.map(uf => uf.file));

// processedFiles contains:
// - name, type, size
// - data (base64 for images, text for PDFs)
// - isImage, isPDF flags
```

### 3. File Preview Component (`file-upload-preview.tsx`)

React component for displaying uploaded files with thumbnails and remove buttons.

**Props:**
- `files: UploadedFile[]` - Array of uploaded files
- `onRemove: (id: string) => void` - Callback when file is removed
- `className?: string` - Optional CSS classes

**UploadedFile Type:**
```typescript
type UploadedFile = {
  id: string;
  file: File;
  preview?: string; // blob URL for images
};
```

**Example:**
```tsx
import { FileUploadPreview } from '@/components/file-upload-preview';

<FileUploadPreview 
  files={uploadedFiles} 
  onRemove={handleRemoveFile} 
/>
```

## Integration Workflow

### Step 1: File Selection
```typescript
const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files) return;
  
  const filesArray = Array.from(e.target.files);
  
  // Validate
  const validation = validateFiles(filesArray, uploadedFiles.length);
  
  if (!validation.valid) {
    setErrors(validation.errors.map(e => e.message));
    return;
  }
  
  // Create preview URLs
  const newFiles: UploadedFile[] = filesArray.map(file => ({
    id: crypto.randomUUID(),
    file,
    preview: isImageFile(file) ? createImagePreview(file) : undefined,
  }));
  
  setUploadedFiles([...uploadedFiles, ...newFiles]);
};
```

### Step 2: Display Previews
```tsx
<FileUploadPreview 
  files={uploadedFiles} 
  onRemove={handleRemoveFile} 
/>
```

### Step 3: Process for API
```typescript
const handleSubmit = async () => {
  const files = uploadedFiles.map(uf => uf.file);
  const processedFiles = await processFiles(files);
  
  // Send to API
  await fetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      prompt: userPrompt,
      files: processedFiles,
    }),
  });
};
```

### Step 4: Cleanup
```typescript
const handleRemoveFile = (id: string) => {
  const fileToRemove = uploadedFiles.find(f => f.id === id);
  
  // Revoke blob URL to prevent memory leak
  if (fileToRemove?.preview) {
    revokeImagePreview(fileToRemove.preview);
  }
  
  setUploadedFiles(uploadedFiles.filter(f => f.id !== id));
};
```

## Error Handling

### Validation Errors
```typescript
type FileValidationError = {
  code: 'invalid_type' | 'file_too_large' | 'too_many_files';
  message: string;
  fileName?: string;
};
```

**Display errors to users:**
```tsx
{errors.length > 0 && (
  <div className="text-red-600 text-sm mt-2">
    {errors.map((error, i) => (
      <div key={i}>{error}</div>
    ))}
  </div>
)}
```

### Processing Errors
```typescript
try {
  const processed = await processFiles(files);
} catch (error) {
  console.error('Processing failed:', error);
  setErrors(['Failed to process files. Please try again.']);
}
```

## Requirements Mapping

This implementation satisfies the following requirements:

- **Requirement 2.1**: File picker for images (PNG, JPEG, WEBP) and PDFs ✓
- **Requirement 2.2**: Validate file types and sizes (max 10MB per file, max 5 files) ✓
- **Requirement 2.3**: Display thumbnails/previews ✓
- **Requirement 2.4**: Remove button per file ✓
- **Requirement 2.5**: Convert images to base64, extract text from PDFs ✓
- **Requirement 2.6**: Display error messages for invalid files ✓
- **Requirement 2.7**: File validation on client ✓

## Dependencies

- `pdfjs-dist` - PDF text extraction
- `lucide-react` - Icons (FileIcon, XIcon)
- `next/image` - Optimized image display

## Performance Considerations

1. **Parallel Processing**: Multiple files are processed in parallel using `Promise.all()`
2. **Memory Management**: Blob URLs are revoked when files are removed
3. **Lazy Loading**: pdf.js is dynamically imported to reduce initial bundle size
4. **CDN Worker**: pdf.js worker is loaded from CDN to avoid bundling issues

## Future Enhancements

- [ ] Progress indicators for large file uploads
- [ ] Image compression before upload
- [ ] Drag-and-drop support
- [ ] Paste from clipboard
- [ ] Multiple file format support (DOCX, TXT, etc.)

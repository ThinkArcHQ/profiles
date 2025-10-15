# File Upload Architecture

## Component Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    File Input / Drop Zone                        │
│  - <input type="file" multiple accept="..." />                  │
│  - Drag & drop support                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   File Validation Layer                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  file-validation.ts                                       │  │
│  │  - validateFiles(files, existingCount)                    │  │
│  │  - Check types: PNG, JPEG, WEBP, PDF                      │  │
│  │  - Check size: max 10MB per file                          │  │
│  │  - Check count: max 5 files total                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                 Valid?              Invalid
                    │                   │
                    ▼                   ▼
         ┌──────────────────┐   ┌──────────────┐
         │  Continue         │   │ Show Errors  │
         └──────────────────┘   └──────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Preview Generation                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  file-processing.ts                                       │  │
│  │  - createImagePreview(file) → blob URL                    │  │
│  │  - Create UploadedFile objects with preview URLs          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Display Previews                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  FileUploadPreview Component                              │  │
│  │  - Show image thumbnails                                  │  │
│  │  - Show PDF file names with icon                          │  │
│  │  - Remove button per file                                 │  │
│  │  - Hover tooltips with file info                          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    User Actions                                  │
│  - Add more files (repeat validation)                           │
│  - Remove files (cleanup blob URLs)                             │
│  - Submit (process files for API)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (on submit)
┌─────────────────────────────────────────────────────────────────┐
│                    File Processing                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  file-processing.ts                                       │  │
│  │  - processFiles(files)                                    │  │
│  │    ├─ Images → imageToBase64() → base64 data URL         │  │
│  │    └─ PDFs → extractPDFText() → text content             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Submission                                │
│  POST /api/generate                                              │
│  {                                                               │
│    prompt: "...",                                                │
│    files: [                                                      │
│      { name, type, size, data, isImage, isPDF },                │
│      ...                                                         │
│    ]                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. File Selection
```typescript
User selects files
    ↓
FileList → Array<File>
    ↓
validateFiles(files, existingCount)
    ↓
ValidationResult { valid, errors }
```

### 2. Preview Creation
```typescript
Valid files
    ↓
files.map(file => ({
  id: crypto.randomUUID(),
  file: file,
  preview: isImageFile(file) ? createImagePreview(file) : undefined
}))
    ↓
Array<UploadedFile>
    ↓
<FileUploadPreview files={uploadedFiles} />
```

### 3. File Processing
```typescript
On submit
    ↓
uploadedFiles.map(uf => uf.file)
    ↓
processFiles(files)
    ↓
Promise.all([
  imageToBase64(imageFile),
  extractPDFText(pdfFile),
  ...
])
    ↓
Array<ProcessedFile> {
  name, type, size,
  data: base64 | text,
  isImage, isPDF
}
```

## State Management

```typescript
// Component State
const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
const [errors, setErrors] = useState<string[]>([]);
const [isProcessing, setIsProcessing] = useState(false);

// UploadedFile Type
type UploadedFile = {
  id: string;           // Unique identifier
  file: File;           // Original File object
  preview?: string;     // Blob URL for images
};

// ProcessedFile Type (for API)
type ProcessedFile = {
  name: string;         // File name
  type: string;         // MIME type
  size: number;         // File size in bytes
  data: string;         // base64 (images) or text (PDFs)
  isImage: boolean;     // Type flag
  isPDF: boolean;       // Type flag
};
```

## Error Handling Flow

```
File Upload Attempt
    ↓
Validation
    ↓
    ├─ Invalid Type → Show "File type not supported" error
    ├─ Too Large → Show "File exceeds 10MB" error
    ├─ Too Many → Show "Maximum 5 files allowed" error
    └─ Valid → Continue
    ↓
Processing
    ↓
    ├─ Image Read Error → Show "Failed to read image" error
    ├─ PDF Parse Error → Show "Failed to extract PDF text" error
    └─ Success → Continue to API
    ↓
API Submission
    ↓
    ├─ Network Error → Show "Upload failed" error
    ├─ Server Error → Show error message from server
    └─ Success → Clear files and show success
```

## Memory Management

```
File Added
    ↓
createImagePreview(file)
    ↓
URL.createObjectURL(file) → blob:http://...
    ↓
Store in uploadedFiles[].preview
    ↓
Display in <img src={preview} />
    ↓
File Removed
    ↓
revokeImagePreview(preview)
    ↓
URL.revokeObjectURL(preview)
    ↓
Memory freed
```

## Integration with Existing Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    ChatInput Component                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Existing PromptInput                                     │  │
│  │  - Text input                                             │  │
│  │  - Send button                                            │  │
│  │  - Message history                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  NEW: File Upload Section                                │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ <input type="file" />                               │  │  │
│  │  │ + File validation                                   │  │  │
│  │  │ + FileUploadPreview component                       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  On Submit:                                                      │
│  1. Get text from PromptInput                                   │
│  2. Process uploaded files                                      │
│  3. Send both to API                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Optimization

1. **Parallel Processing**: Multiple files processed simultaneously
2. **Lazy Loading**: pdf.js loaded only when needed
3. **CDN Worker**: pdf.js worker from CDN (no bundle bloat)
4. **Memory Cleanup**: Blob URLs revoked when files removed
5. **Optimized Images**: Next.js Image component for previews

## Security Measures

1. **Type Validation**: MIME type checking
2. **Size Limits**: 10MB per file, 5 files max
3. **Client-side Only**: No server upload until submission
4. **Sandboxed Processing**: FileReader API (browser-native)
5. **No Eval**: No dynamic code execution

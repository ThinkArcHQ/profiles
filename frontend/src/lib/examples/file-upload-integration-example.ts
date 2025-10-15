/**
 * Example integration of file upload functionality
 * This demonstrates how to use the file validation, processing, and preview components together
 */

import { validateFiles } from '@/lib/utils/file-validation';
import { processFiles, createImagePreview, revokeImagePreview } from '@/lib/utils/file-processing';
import type { UploadedFile } from '@/components/file-upload-preview';

/**
 * Example: Handle file selection from input
 */
export async function handleFileSelection(
  selectedFiles: FileList,
  existingFiles: UploadedFile[]
): Promise<{ success: boolean; files?: UploadedFile[]; errors?: string[] }> {
  const filesArray = Array.from(selectedFiles);

  // Step 1: Validate files
  const validation = validateFiles(filesArray, existingFiles.length);

  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors.map((e) => e.message),
    };
  }

  // Step 2: Create preview URLs and prepare uploaded files
  const uploadedFiles: UploadedFile[] = filesArray.map((file) => ({
    id: crypto.randomUUID(),
    file,
    preview: file.type.startsWith('image/') ? createImagePreview(file) : undefined,
  }));

  return {
    success: true,
    files: uploadedFiles,
  };
}

/**
 * Example: Process files before sending to API
 */
export async function prepareFilesForAPI(uploadedFiles: UploadedFile[]) {
  try {
    const files = uploadedFiles.map((uf) => uf.file);
    const processedFiles = await processFiles(files);

    return {
      success: true,
      data: processedFiles,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process files',
    };
  }
}

/**
 * Example: Clean up file previews when removing files
 */
export function cleanupFilePreview(uploadedFile: UploadedFile) {
  if (uploadedFile.preview) {
    revokeImagePreview(uploadedFile.preview);
  }
}

/**
 * Example: Complete workflow in a React component
 * 
 * ```tsx
 * const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
 * const [errors, setErrors] = useState<string[]>([]);
 * 
 * const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *   if (!e.target.files) return;
 *   
 *   const result = await handleFileSelection(e.target.files, uploadedFiles);
 *   
 *   if (result.success && result.files) {
 *     setUploadedFiles([...uploadedFiles, ...result.files]);
 *     setErrors([]);
 *   } else if (result.errors) {
 *     setErrors(result.errors);
 *   }
 * };
 * 
 * const handleRemoveFile = (id: string) => {
 *   const fileToRemove = uploadedFiles.find(f => f.id === id);
 *   if (fileToRemove) {
 *     cleanupFilePreview(fileToRemove);
 *   }
 *   setUploadedFiles(uploadedFiles.filter(f => f.id !== id));
 * };
 * 
 * const handleSubmit = async () => {
 *   const result = await prepareFilesForAPI(uploadedFiles);
 *   
 *   if (result.success) {
 *     // Send result.data to your API
 *     console.log('Processed files:', result.data);
 *   } else {
 *     setErrors([result.error]);
 *   }
 * };
 * 
 * return (
 *   <div>
 *     <input type="file" multiple onChange={handleFileInput} />
 *     
 *     {errors.length > 0 && (
 *       <div className="text-red-600">
 *         {errors.map((error, i) => <div key={i}>{error}</div>)}
 *       </div>
 *     )}
 *     
 *     <FileUploadPreview 
 *       files={uploadedFiles} 
 *       onRemove={handleRemoveFile} 
 *     />
 *     
 *     <button onClick={handleSubmit}>Submit</button>
 *   </div>
 * );
 * ```
 */

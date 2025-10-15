/**
 * File processing utilities for converting files to formats suitable for AI
 * Handles image to base64 conversion and PDF text extraction
 */

import { isImageFile, isPDFFile } from './file-validation';

export type ProcessedFile = {
  name: string;
  type: string;
  size: number;
  data: string; // base64 for images, text for PDFs
  isImage: boolean;
  isPDF: boolean;
};

/**
 * Converts an image file to base64 data URL
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Extracts text content from a PDF file using pdf.js
 * Note: This requires the pdfjs-dist package to be installed
 */
export async function extractPDFText(file: File): Promise<string> {
  try {
    // Dynamically import pdf.js to avoid bundling issues
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Extract text from all pages
    const textPromises: Promise<string>[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      textPromises.push(
        pdf.getPage(i).then(async (page) => {
          const textContent = await page.getTextContent();
          return textContent.items
            .map((item: any) => item.str)
            .join(' ');
        })
      );
    }

    const pageTexts = await Promise.all(textPromises);
    return pageTexts.join('\n\n');
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error(`Failed to extract text from PDF: ${file.name}`);
  }
}

/**
 * Processes a single file - converts images to base64 or extracts PDF text
 */
export async function processFile(file: File): Promise<ProcessedFile> {
  const isImage = isImageFile(file);
  const isPDF = isPDFFile(file);

  let data: string;

  if (isImage) {
    data = await imageToBase64(file);
  } else if (isPDF) {
    data = await extractPDFText(file);
  } else {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  return {
    name: file.name,
    type: file.type,
    size: file.size,
    data,
    isImage,
    isPDF,
  };
}

/**
 * Processes multiple files in parallel
 */
export async function processFiles(files: File[]): Promise<ProcessedFile[]> {
  return Promise.all(files.map(processFile));
}

/**
 * Creates a preview URL for an image file (blob URL)
 * Remember to revoke this URL when done to prevent memory leaks
 */
export function createImagePreview(file: File): string {
  if (!isImageFile(file)) {
    throw new Error('File is not an image');
  }
  return URL.createObjectURL(file);
}

/**
 * Revokes a blob URL to free memory
 */
export function revokeImagePreview(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

import JSZip from 'jszip';

export interface FileToDownload {
  path: string;
  content: string;
}

/**
 * Downloads all generated files as a ZIP archive
 * @param files - Array of files with path and content
 * @param zipName - Name of the ZIP file (default: 'profile-page.zip')
 */
export async function downloadFilesAsZip(
  files: FileToDownload[],
  zipName: string = 'profile-page.zip'
): Promise<void> {
  if (files.length === 0) {
    throw new Error('No files to download');
  }

  const zip = new JSZip();

  // Add each file to the ZIP with proper folder structure
  files.forEach((file) => {
    zip.file(file.path, file.content);
  });

  // Generate the ZIP file
  const blob = await zip.generateAsync({ type: 'blob' });

  // Create download link and trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Downloads a single file
 * @param filename - Name of the file
 * @param content - Content of the file
 */
export function downloadSingleFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

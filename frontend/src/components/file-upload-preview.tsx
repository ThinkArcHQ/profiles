'use client';

import { Button } from '@/components/ui/button';
import { formatFileSize, isImageFile, isPDFFile } from '@/lib/utils/file-validation';
import { FileIcon, XIcon } from 'lucide-react';
import Image from 'next/image';

export type UploadedFile = {
  id: string;
  file: File;
  preview?: string; // base64 or blob URL for images
};

export type FileUploadPreviewProps = {
  files: UploadedFile[];
  onRemove: (id: string) => void;
  className?: string;
};

export function FileUploadPreview({
  files,
  onRemove,
  className = '',
}: FileUploadPreviewProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 p-3 ${className}`}>
      {files.map((uploadedFile) => (
        <FilePreviewItem
          key={uploadedFile.id}
          uploadedFile={uploadedFile}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

type FilePreviewItemProps = {
  uploadedFile: UploadedFile;
  onRemove: (id: string) => void;
};

function FilePreviewItem({ uploadedFile, onRemove }: FilePreviewItemProps) {
  const { id, file, preview } = uploadedFile;
  const isImage = isImageFile(file);
  const isPDF = isPDFFile(file);

  return (
    <div className="group relative flex h-20 w-20 flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-all hover:border-orange-300 hover:shadow-md">
      {/* Image thumbnail */}
      {isImage && preview && (
        <div className="relative h-full w-full overflow-hidden rounded">
          <Image
            src={preview}
            alt={file.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
      )}

      {/* PDF icon */}
      {isPDF && (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <FileIcon className="h-8 w-8 text-red-500" />
          <span className="mt-1 truncate text-xs text-gray-600" title={file.name}>
            {file.name.length > 10
              ? `${file.name.substring(0, 10)}...`
              : file.name}
          </span>
        </div>
      )}

      {/* File info tooltip on hover */}
      <div className="absolute -top-16 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
        <div className="font-medium">{file.name}</div>
        <div className="text-gray-300">{formatFileSize(file.size)}</div>
        {/* Arrow */}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>

      {/* Remove button */}
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white opacity-0 shadow-md transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
        onClick={() => onRemove(id)}
        aria-label={`Remove ${file.name}`}
      >
        <XIcon className="h-3 w-3" />
      </Button>
    </div>
  );
}

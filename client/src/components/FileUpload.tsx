import React from 'react';
import { cn } from "@/lib/utils";
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: Error) => void;
  accept?: string;
  className?: string;
  label?: string;
  maxSize?: number; // in MB
  uploading?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  accept = "image/*",
  className,
  label = "Upload File",
  maxSize = 4,
  uploading = false,
}) => {
  const { uploadImage, uploadDocument, isUploadingImage, isUploadingDoc } = useFileUpload();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      onUploadError?.(new Error(`File size should not exceed ${maxSize}MB`));
      return;
    }

    try {
      const upload = file.type.startsWith('image/') ? uploadImage : uploadDocument;
      const url = await upload(file);
      if (url) {
        onUploadComplete(url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error as Error);
    }
  };

  const isUploading = uploading || isUploadingImage || isUploadingDoc;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {label}
          </>
        )}
      </Button>
    </div>
  );
};
import { useCallback, useState } from 'react';
import type { OurFileRouter } from '@/lib/uploadthing';
import { useUploadThing } from '@/lib/uploadthing';

interface UseFileUploadProps {
  onClientUploadComplete?: (urls: string[]) => void;
  onUploadError?: (error: Error) => void;
  onUploadBegin?: () => void;
}

export function useFileUpload({
  onClientUploadComplete,
  onUploadError,
  onUploadBegin,
}: UseFileUploadProps = {}) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const { startUpload, isUploading: uploading, permittedFileInfo } = useUploadThingHook('imageUploader', {
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      setUploadProgress(100);
      
      // Extract URLs from response
      const urls = res ? res.map((file) => file.url) : [];
      
      console.log("Upload complete:", urls);
      
      if (onClientUploadComplete) {
        onClientUploadComplete(urls);
      }
      
      // Reset file state after successful upload
      setFiles([]);
    },
    onUploadError: (error) => {
      setIsUploading(false);
      setUploadProgress(0);
      
      if (onUploadError) {
        onUploadError(error);
      }
    },
    onUploadBegin: () => {
      setIsUploading(true);
      setUploadProgress(0);
      
      if (onUploadBegin) {
        onUploadBegin();
      }
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  // Calculate total permitted file size
  const maxFileSize = permittedFileInfo?.config?.maxFileSize
    ? parseInt(permittedFileInfo.config.maxFileSize, 10)
    : undefined;

  // Helper to format file size in human-readable format
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  // Add files to state
  const addFiles = useCallback((newFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  }, []);

  // Remove file from state
  const removeFile = useCallback((index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  // Start the upload process
  const upload = useCallback(async () => {
    if (files.length === 0) {
      return [];
    }

    try {
      setIsUploading(true);
      const result = await startUpload(files);
      return result ? result.map((file) => file.url) : [];
    } catch (error) {
      console.error('Upload failed:', error);
      return [];
    }
  }, [files, startUpload]);

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    upload,
    isUploading,
    uploadProgress,
    permittedFileInfo,
    maxFileSize,
    formatFileSize,
  };
}
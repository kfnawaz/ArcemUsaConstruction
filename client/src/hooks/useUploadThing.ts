import { useCallback, useState } from 'react';
import type { OurFileRouter } from '@/lib/uploadthing';
import { useUploadThing } from '@/lib/uploadthing';

interface UseFileUploadProps {
  onClientUploadComplete?: (urls: string[]) => void;
  onUploadError?: (error: Error) => void;
  onUploadBegin?: () => void;
  onUploadProgress?: (progress: number) => void;
}

export function useFileUpload({
  onClientUploadComplete,
  onUploadError,
  onUploadBegin,
  onUploadProgress,
}: UseFileUploadProps = {}) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const { startUpload, isUploading: uploading } = useUploadThing('imageUploader', {
    onClientUploadComplete: (res: any[]) => {
      setIsUploading(false);
      setUploadProgress(100);
      
      // Extract URLs from response, preferring ufsUrl over the deprecated url
      const urls = res ? res.map((file: any) => file.ufsUrl || file.url) : [];
      
      console.log("Upload complete:", urls);
      
      if (onClientUploadComplete) {
        onClientUploadComplete(urls);
      }
      
      // Reset file state after successful upload
      setFiles([]);
    },
    onUploadError: (error: Error) => {
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
    onUploadProgress: (progress: number) => {
      setUploadProgress(progress);
      
      if (onUploadProgress) {
        onUploadProgress(progress);
      }
    },
  });

  // Set default max file size (8MB)
  const maxFileSize = 8 * 1024 * 1024; // 8MB in bytes

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
      
      // Successfully uploaded
      setIsUploading(false);
      
      // Process result before returning
      const urls = result ? result.map((file) => file.ufsUrl || file.url) : [];
      
      // Call the onClientUploadComplete callback with the URLs
      if (urls.length > 0 && onClientUploadComplete) {
        console.log('Upload complete! URLs:', urls);
        onClientUploadComplete(urls);
      }
      
      return urls;
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
      
      // Call the error handler if provided
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
      
      return [];
    }
  }, [files, startUpload, onClientUploadComplete, onUploadError]);

  // Define file size limits and permitted information
  const permittedFileInfo = {
    config: {
      maxFileSize: "8MB",
      maxFileCount: 10
    }
  };
  
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
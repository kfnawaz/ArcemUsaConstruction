import React, { useState, useEffect } from 'react';
import { useUploadThing } from '@/lib/uploadthing';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, X, ImagePlus, File, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import fileUtils from '@/lib/fileUtils';

interface UploadThingFileUploadProps {
  onUploaded: (urls: string[]) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  allowedTypes?: string[];
  sessionId?: string;
  endpoint?: 'imageUploader' | string;
  buttonLabel?: string;
  className?: string;
}

interface UploadFile {
  file: File;
  previewUrl?: string;
  uploading: boolean;
  error?: string;
  uploaded: boolean;
}

const UploadThingFileUpload: React.FC<UploadThingFileUploadProps> = ({
  onUploaded,
  onUploadError,
  maxFiles = 5,
  allowedTypes = ['image/*'],
  sessionId,
  endpoint = 'imageUploader',
  buttonLabel = 'Upload File',
  className = '',
}) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { startUpload, isUploading: uploadThingIsUploading } = useUploadThing(endpoint as any);
  
  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, [files]);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    // Check if we would exceed max files
    if (files.length + e.target.files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }
    
    // Convert FileList to array and process each file
    const newFiles = Array.from(e.target.files).map(file => {
      // Create preview URL for images
      const isImage = file.type.startsWith('image/');
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
      
      return {
        file,
        previewUrl,
        uploading: false,
        uploaded: false,
      };
    });
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };
  
  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      
      // Clean up preview URL if it exists
      if (newFiles[index].previewUrl) {
        URL.revokeObjectURL(newFiles[index].previewUrl);
      }
      
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  
  // Upload all files
  const uploadFiles = async () => {
    if (!files.length || isUploading) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const filesToUpload = files.map(f => f.file);
      
      // Mark all files as uploading
      setFiles(prev => prev.map(file => ({ ...file, uploading: true })));
      
      // Upload files to uploadthing.com
      const uploadResults = await startUpload(filesToUpload);
      
      if (!uploadResults || uploadResults.length === 0) {
        throw new Error("Upload failed - no results returned");
      }
      
      // Extract URLs from results
      const uploadedUrls = uploadResults.map(result => {
        return result.ufsUrl || result.url;
      });
      
      // Mark all files as uploaded
      setFiles(prev => prev.map(file => ({ ...file, uploading: false, uploaded: true })));
      
      // Notify parent component
      onUploaded(uploadedUrls);
      
      toast({
        title: "Files uploaded successfully",
        description: `${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'file' : 'files'} uploaded`,
      });
      
      // Clear files after short delay to show success state
      setTimeout(() => {
        setFiles([]);
      }, 2000);
      
    } catch (error) {
      console.error("Error uploading files:", error);
      
      // Mark all files as having an error
      setFiles(prev => prev.map(file => ({ 
        ...file, 
        uploading: false, 
        error: "Upload failed" 
      })));
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive"
      });
      
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* File input button */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('uploadthing-input')?.click()}
          disabled={isUploading || files.length >= maxFiles}
          className="flex items-center gap-2"
        >
          <ImagePlus className="h-4 w-4" />
          {buttonLabel}
        </Button>
        <input
          id="uploadthing-input"
          type="file"
          multiple={maxFiles > 1}
          accept={allowedTypes.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
        
        {files.length > 0 && (
          <Button
            type="button"
            variant="default"
            onClick={uploadFiles}
            disabled={isUploading || files.length === 0 || files.every(f => f.uploaded)}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload {files.length} {files.length === 1 ? 'file' : 'files'}
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected files ({files.length}/{maxFiles})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map((file, index) => (
              <div 
                key={`${file.file.name}-${index}`}
                className="border rounded-md p-2 flex items-center gap-2 group relative"
              >
                {file.previewUrl ? (
                  <div className="h-10 w-10 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={file.previewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <File className="h-10 w-10 p-2 rounded-md bg-muted/50" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file.name}</p>
                  <p className="text-xs text-muted-foreground">{fileUtils.formatFileSize(file.file.size)}</p>
                </div>
                
                {file.uploaded ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : file.uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Upload progress */}
      {isUploading && uploadProgress !== null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm">Uploading...</span>
            <span className="text-sm">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}
    </div>
  );
};

export default UploadThingFileUpload;
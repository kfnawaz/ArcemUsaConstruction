import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { X, File, Image, Upload, Loader2, AlertTriangle } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { useAuth } from '@/hooks/useAuth';

interface FileInputProps {
  onFilesSelected?: (files: File[]) => void;
  onFileRemoved?: (index: number) => void;
  onUploadComplete?: (urls: string[]) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  accept?: Record<string, string[]>;
  uploadImmediately?: boolean;
  className?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  value?: File[];
  allowedTypes?: string;
}

export function FileInput({
  onFilesSelected,
  onFileRemoved,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
  },
  uploadImmediately = false,
  className,
  label = 'Upload files',
  description = 'Drag & drop files here, or click to select files',
  disabled = false,
  value,
  allowedTypes = 'PNG, JPG, GIF',
}: FileInputProps) {
  const [files, setFiles] = useState<File[]>(value || []);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Check if adding new files would exceed the limit
    if (files.length + acceptedFiles.length > maxFiles) {
      toast({
        title: 'Upload limit exceeded',
        description: `You can only upload up to ${maxFiles} files at a time.`,
        variant: 'destructive',
      });
      return;
    }
    
    const newFiles = [...files, ...acceptedFiles];
    setFiles(newFiles);
    onFilesSelected?.(newFiles);
    
    if (uploadImmediately) {
      // If we need to upload immediately, we'll use the FileUpload component's functionality
    }
  }, [files, maxFiles, onFilesSelected, toast, uploadImmediately]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    disabled,
    maxFiles: maxFiles - files.length,
  });
  
  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFileRemoved?.(index);
    onFilesSelected?.(newFiles);
  };
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg bg-destructive/5 text-destructive">
        <AlertTriangle className="h-6 w-6 mr-2" />
        <p>You need administrator privileges to upload files.</p>
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {label && <h4 className="font-medium">{label}</h4>}
      
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <>
              <p>{description}</p>
              <p className="text-sm text-muted-foreground">
                Supported formats: {allowedTypes} (max {maxFiles} files)
              </p>
            </>
          )}
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div className="flex items-center gap-2">
                {file.type.startsWith('image/') ? (
                  <Image className="h-4 w-4" />
                ) : (
                  <File className="h-4 w-4" />
                )}
                <span className="text-sm truncate max-w-[200px]">
                  {file.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
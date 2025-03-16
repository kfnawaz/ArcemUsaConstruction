import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useUploadThing } from '@/lib/uploadthing';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  value?: string;
  onChange: (url: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function FileUpload({
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  value,
  onChange,
  onError,
  className
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { startUpload } = useUploadThing("imageUploader");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxSize,
    multiple: false,
    disabled: isUploading,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      if (!file.type.startsWith('image/')) {
        onError?.('Please upload an image file.');
        return;
      }

      setIsUploading(true);
      try {
        const res = await startUpload([file]);
        if (res && res[0]?.url) {
          onChange(res[0].url);
        }
      } catch (error) {
        console.error('Upload error:', error);
        onError?.('Failed to upload file. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        onError?.(`File is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`);
      } else {
        onError?.('Invalid file. Please try again.');
      }
    },
  });

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className={cn("space-y-4", className)}>
      {!value ? (
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-border",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-10 h-10 mb-2 text-muted-foreground" />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              {isDragActive ? "Drop the file here" : "Drag & drop a file here"}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to select a file
            </p>
          </div>
          {isUploading && (
            <div className="mt-2 text-sm text-muted-foreground animate-pulse">
              Uploading...
            </div>
          )}
        </div>
      ) : (
        <div className="relative group">
          <img
            src={value}
            alt="Uploaded file"
            className="w-full h-40 object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
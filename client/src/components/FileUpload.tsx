import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadThing } from '@/lib/uploadthing';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { X, File, Image, Upload, Loader2, AlertTriangle } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete?: (urls: string[]) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
  maxFiles?: number;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  className,
  maxFiles = 10,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { startUpload } = useUploadThing('imageUploader');

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
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, [files.length, maxFiles, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      const uploadedFiles = await startUpload(files);
      
      if (!uploadedFiles) {
        throw new Error('Upload failed');
      }

      const urls = uploadedFiles.map(f => f.url);
      onUploadComplete?.(urls);
      
      // Clear files and show success message
      setFiles([]);
      toast({
        title: 'Upload complete',
        description: `Successfully uploaded ${urls.length} file${urls.length === 1 ? '' : 's'}.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error as Error);
      toast({
        title: 'Upload failed',
        description: (error as Error)?.message || 'Something went wrong during upload.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {!isAdmin ? (
        <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg bg-destructive/5 text-destructive">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <p>You need administrator privileges to upload files.</p>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-primary bg-primary/5' : 'border-border',
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            {isDragActive ? (
              <p>Drop the files here...</p>
            ) : (
              <p>
                Drag &apos;n&apos; drop files here, or click to select files
                <br />
                <span className="text-sm text-muted-foreground">
                  Supported formats: PNG, JPG, GIF (max {maxFiles} files)
                </span>
              </p>
            )}
          </div>
        </div>
      )}

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
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button 
            onClick={handleUpload} 
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>Upload {files.length} file{files.length === 1 ? '' : 's'}</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
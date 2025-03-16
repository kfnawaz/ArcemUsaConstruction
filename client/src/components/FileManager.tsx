import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Check, X } from 'lucide-react';
import { FileInput } from './FileInput';
import { useAuth } from '@/hooks/useAuth';
import { useUploadThing } from '@/lib/uploadthing';
import { cn } from '@/lib/utils';

interface FileManagerProps {
  onFilesUploaded?: (fileUrls: string[]) => void;
  maxFiles?: number;
  className?: string;
  existingFiles?: string[];
  onRemoveExistingFile?: (fileUrl: string) => void;
  acceptedTypes?: Record<string, string[]>;
  allowedTypes?: string;
  showPreview?: boolean;
}

export function FileManager({
  onFilesUploaded,
  maxFiles = 5,
  className,
  existingFiles = [],
  onRemoveExistingFile,
  acceptedTypes = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
  },
  allowedTypes = 'PNG, JPG, GIF',
  showPreview = true,
}: FileManagerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { startUpload } = useUploadThing('imageUploader');
  
  // Reset files if maxFiles changes
  useEffect(() => {
    if (files.length > maxFiles) {
      setFiles(files.slice(0, maxFiles));
    }
  }, [maxFiles, files]);
  
  const handleFileSelection = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
  };
  
  const handleRemoveExisting = (fileUrl: string) => {
    onRemoveExistingFile?.(fileUrl);
  };
  
  const handleUpload = async () => {
    if (!files.length) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one file to upload.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setUploading(true);
      const uploadedFiles = await startUpload(files);
      
      if (!uploadedFiles) {
        throw new Error('Upload failed');
      }
      
      const urls = uploadedFiles.map(f => f.url);
      
      toast({
        title: 'Upload complete',
        description: `Successfully uploaded ${urls.length} file${urls.length === 1 ? '' : 's'}.`,
      });
      
      onFilesUploaded?.(urls);
      setFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: (error as Error)?.message || 'Something went wrong during upload.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };
  
  const filePreview = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
    
    return (
      <div className="relative w-24 h-24 border rounded overflow-hidden group">
        {isImage ? (
          <img src={url} alt="File preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-xs text-center px-2 truncate w-full">
              {url.split('/').pop()}
            </span>
          </div>
        )}
        
        <Button
          variant="destructive"
          size="icon"
          className="w-6 h-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleRemoveExisting(url)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  };
  
  if (!isAdmin) {
    return null;
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {showPreview && existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Existing Files</h4>
          <div className="flex flex-wrap gap-2">
            {existingFiles.map((url) => filePreview(url))}
          </div>
        </div>
      )}
      
      <FileInput
        onFilesSelected={handleFileSelection}
        maxFiles={maxFiles}
        accept={acceptedTypes}
        allowedTypes={allowedTypes}
        value={files}
      />
      
      {files.length > 0 && (
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
      )}
    </div>
  );
}
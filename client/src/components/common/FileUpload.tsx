import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, X, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  onUploadComplete: (fileUrl: string | string[]) => void;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
}

const FileUpload = ({ 
  onUploadComplete, 
  accept = "image/*", 
  maxSizeMB = 5,
  multiple = false
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, url: string}[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (multiple) {
        handleMultipleFiles(Array.from(e.dataTransfer.files));
      } else {
        handleFile(e.dataTransfer.files[0]);
      }
    }
  };
  
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (multiple) {
        handleMultipleFiles(Array.from(e.target.files));
      } else {
        handleFile(e.target.files[0]);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: `"${file.name}" is not a valid image file.`,
        variant: "destructive"
      });
      return false;
    }
    
    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: `"${file.name}" exceeds the maximum size of ${maxSizeMB}MB.`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleMultipleFiles = async (files: File[]) => {
    // Filter out invalid files
    const validFiles = files.filter(validateFile);
    
    if (validFiles.length === 0) return;
    
    setIsUploading(true);
    const urls: string[] = [];
    const newUploadedFiles: {name: string, url: string}[] = [...uploadedFiles];
    
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setCurrentFileName(file.name);
      setUploadProgress(Math.round((i / validFiles.length) * 100));
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }
        
        const data = await response.json();
        urls.push(data.url);
        newUploadedFiles.push({ name: file.name, url: data.url });
        
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}. Please try again.`,
          variant: "destructive"
        });
      }
    }
    
    setUploadedFiles(newUploadedFiles);
    setUploadProgress(100);
    
    // Only call onUploadComplete if files were successfully uploaded
    if (urls.length > 0) {
      onUploadComplete(multiple ? urls : urls[0]);
      
      toast({
        title: "Upload successful",
        description: `${urls.length} file${urls.length !== 1 ? 's' : ''} uploaded successfully.`,
        variant: "default"
      });
    }
    
    setTimeout(() => {
      setIsUploading(false);
      setCurrentFileName(null);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 800); // Short delay to show 100% completion
  };
  
  const handleFile = async (file: File) => {
    if (!validateFile(file)) return;
    
    // Start upload
    setIsUploading(true);
    setCurrentFileName(file.name);
    setUploadProgress(10); // Start with 10% to show activity
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const next = prev + Math.floor(Math.random() * 15);
          return next > 90 ? 90 : next; // Cap at 90% until complete
        });
      }, 300);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      setUploadProgress(100);
      
      const data = await response.json();
      const newFile = { name: file.name, url: data.url };
      setUploadedFiles([...uploadedFiles, newFile]);
      onUploadComplete(data.url);
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded.`,
        variant: "default"
      });
      
      // Short delay to show 100% completion
      setTimeout(() => {
        setIsUploading(false);
        setCurrentFileName(null);
        setUploadProgress(0);
      }, 800);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
      setCurrentFileName(null);
      setUploadProgress(0);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const cancelUpload = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsUploading(false);
    setCurrentFileName(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
    
    // If we're in multiple mode, update the parent component with the new list of URLs
    if (multiple) {
      onUploadComplete(newFiles.map(f => f.url));
    }
  };
  
  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          accept={accept}
          multiple={multiple}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Uploading {currentFileName}{multiple ? ` (${uploadProgress}%)` : ''}...
            </p>
            <Progress value={uploadProgress} className="w-full max-w-xs h-2 mb-3" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={cancelUpload}
              className="mt-1"
            >
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              {multiple ? 'Drag and drop multiple files or click to upload' : 'Drag and drop or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Support for images up to {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>
      
      {/* Display recently uploaded files */}
      {multiple && uploadedFiles.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Uploaded files:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="relative aspect-square rounded overflow-hidden border bg-muted">
                  <img 
                    src={file.url} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/400x400?text=Error";
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs truncate mt-1">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
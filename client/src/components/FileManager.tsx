import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import FileUpload from '@/components/common/FileUpload';
import { useToast } from '@/hooks/use-toast';
import { fileUtils } from '@/lib/fileUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

/**
 * Props for the FileManager component
 */
interface FileManagerProps {
  /**
   * Array of file URLs to display
   */
  value?: string[];
  /**
   * Function called when files are added or removed
   */
  onChange?: (fileUrls: string[]) => void;
  /**
   * Maximum number of files allowed
   */
  maxFiles?: number;
  /**
   * Whether to only allow image files
   */
  imagesOnly?: boolean;
  /**
   * Dialog title
   */
  title?: string;
  /**
   * Description text to show in the dialog
   */
  description?: string;
  /**
   * Label for the add button
   */
  addLabel?: string;
  /**
   * Whether the component is disabled
   */
  disabled?: boolean;
  /**
   * CSS class for the button
   */
  className?: string;
  /**
   * Whether the file manager is in a loading state
   */
  isLoading?: boolean;
  /**
   * Whether to show file preview thumbnails
   */
  showThumbnails?: boolean;
}

/**
 * A component for managing file uploads and displaying uploaded files
 */
export default function FileManager({
  value = [],
  onChange,
  maxFiles = 10,
  imagesOnly = false,
  title = 'Manage Files',
  description = 'Upload, view, and manage your files.',
  addLabel = 'Add Files',
  disabled = false,
  className = '',
  isLoading = false,
  showThumbnails = true,
}: FileManagerProps) {
  const [files, setFiles] = useState<string[]>(value);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState<string>(fileUtils.generateSessionId());
  const { toast } = useToast();
  
  // Update internal state when value prop changes
  useEffect(() => {
    setFiles(value);
  }, [value]);
  
  // Synchronize changes back to parent component
  useEffect(() => {
    onChange?.(files);
  }, [files, onChange]);
  
  // Handle files being added
  const handleFilesAdded = (newFiles: string | string[], sessionId?: string) => {
    const filesArray = Array.isArray(newFiles) ? newFiles : [newFiles];
    const updatedFiles = [...files, ...filesArray];
    
    // Ensure we don't exceed the maximum
    if (updatedFiles.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `You can only upload up to ${maxFiles} files.`,
        variant: 'destructive',
      });
      return;
    }
    
    setFiles(updatedFiles);
    
    // Commit the files to mark them as permanent
    fileUtils.commitFiles(sessionId || fileUtils.generateSessionId(), filesArray);
  };
  
  // Handle a file being removed
  const handleFileRemoved = (fileUrl: string) => {
    setFiles(files.filter(file => file !== fileUrl));
  };
  
  // Handle all files being removed
  const handleAllFilesRemoved = () => {
    setFiles([]);
  };
  
  // Handle dialog closed without saving
  const handleDialogClose = () => {
    // No need to perform any cleanup
  };
  
  // Handle upload error
  const handleUploadError = (error: Error) => {
    toast({
      title: 'Upload error',
      description: error.message || 'An error occurred during file upload',
      variant: 'destructive',
    });
  };
  
  // Render file thumbnails for preview
  const renderThumbnails = () => {
    if (!showThumbnails || files.length === 0) return null;
    
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-2">
        {files.map((file, index) => (
          <div 
            key={index} 
            className="relative group aspect-square border rounded-md overflow-hidden bg-gray-50"
          >
            {fileUtils.isImageFile(file) ? (
              <img 
                src={file} 
                alt={`File ${index + 1}`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                {fileUtils.getFileExtension(file).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="destructive"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileRemoved(file);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className={className}>
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <div className="text-sm mb-1">
            Files ({files.length}/{maxFiles})
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={disabled || isLoading || files.length >= maxFiles}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    {addLabel}
                  </>
                )}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                  {description}
                </DialogDescription>
              </DialogHeader>
              
              <FileUpload
                onUploadComplete={handleFilesAdded}
                sessionId={sessionId}
                multiple={true}
                accept={imagesOnly ? "image/*" : undefined}
                maxSizeMB={5}
                buttonText="Upload Files"
                helpText="Drag and drop files here or click to browse"
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button 
                    variant="outline" 
                    onClick={handleDialogClose}
                  >
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {renderThumbnails()}
        
        {files.length === 0 && !isLoading && (
          <div className="text-sm text-gray-500 mt-2 border rounded-md p-4 text-center">
            No files added yet
          </div>
        )}
      </div>
    </div>
  );
}
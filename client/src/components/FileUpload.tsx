import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUploadComplete: (urls: string[]) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  maxFiles = 1,
  className,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const { startUpload } = useUploadThing("imageUploader");
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles,
    disabled: disabled || uploading,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles?.length) {
        setFiles(prev => [...prev, ...acceptedFiles].slice(0, maxFiles));
      }
    },
  });

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!files.length) return;
    
    try {
      setUploading(true);
      const uploadedFiles = await startUpload(files);
      
      if (!uploadedFiles) {
        throw new Error("Upload failed");
      }
      
      const urls = uploadedFiles.map(f => f.url);
      onUploadComplete(urls);
      setFiles([]);
    } catch (error) {
      console.error("Upload error:", error);
      onUploadError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed p-4 rounded-md cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Accepts images (PNG, JPG, GIF, WebP)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max {maxFiles} file{maxFiles !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Selected Files ({files.length})</div>
          <div className="grid gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-muted p-2 rounded-md"
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                  {file.type.startsWith("image/") && (
                    <div className="h-10 w-10 bg-muted rounded overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleRemoveFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <Button
          type="button"
          onClick={handleUpload}
          disabled={uploading || disabled}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>Upload {files.length} file{files.length !== 1 && "s"}</>
          )}
        </Button>
      )}
    </div>
  );
}
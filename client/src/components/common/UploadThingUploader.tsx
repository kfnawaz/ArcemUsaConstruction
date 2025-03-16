import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, XCircle, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Define interface for UploadThing file response
interface UploadFileResponse {
  url: string;
  ufsUrl?: string; // New URL format from UploadThing
  key: string;
  name: string;
  size: number;
}

interface UploadThingUploaderProps {
  onComplete?: (urls: string[]) => void;
  buttonText?: string;
  helpText?: string;
  multiple?: boolean;
}

export default function UploadThingUploader({
  onComplete,
  buttonText = "Upload images",
  helpText = "Upload project images (JPG, PNG, WebP) up to 8MB each",
  multiple = true
}: UploadThingUploaderProps) {
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (files: UploadFileResponse[] | undefined) => {
      if (!files || files.length === 0) return;
      
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${files.length} file${files.length !== 1 ? "s" : ""}.`,
      });
      
      // Extract URLs and pass them to the parent component
      // Prefer the new ufsUrl format if available, fall back to url if not
      const urls = files.map(file => file.ufsUrl || file.url);
      
      console.log('Extracted uploaded file URLs:', urls);
      
      if (onComplete) {
        onComplete(urls);
      }
    },
    onUploadError: (error: Error) => {
      setErrorMessage(error.message);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload.",
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const files = Array.from(fileList);
    startUpload(files);
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <UploadCloud className="h-12 w-12 mx-auto text-primary/60" />
            <div>
              <h3 className="text-lg font-medium">Upload Gallery Images</h3>
              <p className="text-sm text-muted-foreground">{helpText}</p>
            </div>
            
            <label className="cursor-pointer">
              <Button 
                type="button" 
                variant="outline"
                disabled={isUploading}
                className="relative w-full"
              >
                {isUploading ? "Uploading..." : buttonText}
                <input
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  multiple={multiple}
                  disabled={isUploading}
                />
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center">
            <Loader2 className="animate-spin h-4 w-4 mr-2 text-primary" />
            <span className="text-sm font-medium">Uploading...</span>
          </div>
          <Progress value={45} className="h-2" />
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="p-3 rounded bg-destructive/10 text-destructive flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Upload Error</p>
            <p className="text-xs">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
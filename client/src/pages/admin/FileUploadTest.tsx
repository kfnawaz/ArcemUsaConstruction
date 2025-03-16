import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { FileManager } from '@/components/FileManager';
import { FileInput } from '@/components/FileInput';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, FileType } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FileUploadTest() {
  const { toast } = useToast();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleUploadComplete = (urls: string[]) => {
    console.log('Uploaded files:', urls);
    setUploadedFiles(prev => [...prev, ...urls]);
    toast({
      title: 'Upload successful',
      description: `${urls.length} files were uploaded successfully.`,
    });
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    toast({
      title: 'Upload failed',
      description: error.message || 'An error occurred during upload.',
      variant: 'destructive',
    });
  };

  const handleRemoveExistingFile = (fileUrl: string) => {
    setUploadedFiles(prev => prev.filter(url => url !== fileUrl));
    toast({
      title: 'File removed',
      description: 'The file has been removed from your uploaded files list.',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            You need to be logged in to access this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardHeader>
          <CardTitle>Admin Access Required</CardTitle>
          <CardDescription>
            You need administrator privileges to access this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container py-10 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>File Upload Test</CardTitle>
          <CardDescription>
            This page tests the file upload functionality with UploadThing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="file-manager">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file-manager">File Manager</TabsTrigger>
              <TabsTrigger value="file-input">File Input</TabsTrigger>
              <TabsTrigger value="file-upload">File Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="file-manager" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">File Manager Component</h3>
                <p className="text-muted-foreground text-sm">
                  Complete file management with upload, preview and deletion capabilities.
                </p>
                <FileManager
                  onFilesUploaded={handleUploadComplete}
                  maxFiles={5}
                  existingFiles={uploadedFiles}
                  onRemoveExistingFile={handleRemoveExistingFile}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="file-input" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">File Input Component</h3>
                <p className="text-muted-foreground text-sm">
                  File selection without immediate upload functionality.
                </p>
                <FileInput
                  onFilesSelected={(files) => console.log('Files selected:', files)}
                  maxFiles={5}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="file-upload" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Legacy File Upload Component</h3>
                <p className="text-muted-foreground text-sm">
                  Direct upload component with immediate upload functionality.
                </p>
                <FileUpload
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  maxFiles={5}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          {uploadedFiles.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-medium mb-4">Upload History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadedFiles.map((url, index) => (
                  <div key={index} className="border rounded p-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <FileType className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {url.split('/').pop()}
                      </a>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveExistingFile(url)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
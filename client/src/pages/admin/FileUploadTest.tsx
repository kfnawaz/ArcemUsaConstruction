import { FileUpload } from '@/components/FileUpload';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function FileUploadTest() {
  const { toast } = useToast();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  const handleUploadComplete = (urls: string[]) => {
    console.log('Uploaded files:', urls);
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
          <FileUpload
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            maxFiles={5}
          />
        </CardContent>
      </Card>
    </div>
  );
}
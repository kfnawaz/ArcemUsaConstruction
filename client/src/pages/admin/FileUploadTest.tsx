import { useEffect } from 'react';
import UploadThingFileManager from '@/components/UploadThingFileManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import AdminNav from '@/components/admin/AdminNav';
import { scrollToTop } from '@/lib/utils';

export default function FileUploadTest() {
  useEffect(() => {
    scrollToTop();
    document.title = 'File Upload Test - ARCEM';
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Admin Navigation */}
          <AdminNav activePage="file-upload-test" />
          
          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-montserrat font-bold">File Upload Test</h1>
                <div className="text-sm text-gray-500">Admin / File Upload</div>
              </div>
              
              <Alert className="mb-6">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription>
                  This page demonstrates the integrated file management system using UploadThing.
                  You can view and manage all uploaded files in a single interface.
                </AlertDescription>
              </Alert>
            </div>
            
            <Tabs defaultValue="uploadthing" className="mb-6">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="uploadthing">UploadThing Manager</TabsTrigger>
              </TabsList>
              
              <TabsContent value="uploadthing">
                <Card>
                  <CardHeader>
                    <CardTitle>UploadThing File Manager</CardTitle>
                    <CardDescription>
                      Directly manage all files in your UploadThing account, including deletion capabilities.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UploadThingFileManager />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
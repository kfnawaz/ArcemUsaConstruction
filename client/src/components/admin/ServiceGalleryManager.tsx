import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useService } from '@/hooks/useService';
import { ServiceGallery, InsertServiceGallery } from '@shared/schema';
import { Trash2, Upload, Image, Loader2, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import FileUpload from '@/components/common/FileUpload';

interface ServiceGalleryManagerProps {
  serviceId: number;
  isNewService?: boolean;
}

const ServiceGalleryManager: React.FC<ServiceGalleryManagerProps> = ({ 
  serviceId,
  isNewService = false
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);

  const {
    serviceGallery,
    isLoadingGallery,
    uploadFile,
    addGalleryImage,
    deleteGalleryImage,
    isAddingGalleryImage,
    isDeletingGalleryImage
  } = useService(serviceId);

  // Save pending images to localStorage on change
  useEffect(() => {
    if (pendingImages.length > 0) {
      localStorage.setItem(`pendingImages_service_${serviceId}`, JSON.stringify(pendingImages));
    } else {
      localStorage.removeItem(`pendingImages_service_${serviceId}`);
    }
  }, [pendingImages, serviceId]);

  // Load pending images from localStorage on mount
  useEffect(() => {
    const savedPendingImages = localStorage.getItem(`pendingImages_service_${serviceId}`);
    if (savedPendingImages) {
      try {
        setPendingImages(JSON.parse(savedPendingImages));
      } catch (e) {
        console.error("Error parsing saved pending images:", e);
        localStorage.removeItem(`pendingImages_service_${serviceId}`);
      }
    }
  }, [serviceId]);
  
  // This function handles the file upload but doesn't save to database
  const handleFileUpload = async (urls: string | string[]) => {
    if (!Array.isArray(urls)) {
      urls = [urls];
    }
    
    // Store the uploaded image URLs in the pending state
    setPendingImages(prev => [...prev, ...urls]);
    
    toast({
      title: 'Images prepared',
      description: `${urls.length} image${urls.length > 1 ? 's' : ''} ready to be saved when you click "Save Service".`,
    });
  };
  
  // This function will be called by the ServiceManager when the service is saved
  const saveGalleryImages = async () => {
    if (pendingImages.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Calculate next display order
      const nextOrder = serviceGallery && serviceGallery.length > 0 
        ? Math.max(...serviceGallery.map(img => img.order !== null ? img.order : 0)) + 1 
        : 1;
      
      // Add each image to the gallery with sequential display order
      for (let i = 0; i < pendingImages.length; i++) {
        const galleryImage: InsertServiceGallery = {
          serviceId,
          imageUrl: pendingImages[i],
          alt: `Gallery image ${i + 1}`,
          order: nextOrder + i,
        };
        
        await addGalleryImage(serviceId, galleryImage);
      }
      
      toast({
        title: 'Gallery updated',
        description: `${pendingImages.length} image${pendingImages.length > 1 ? 's' : ''} added to the gallery successfully.`,
      });
      
      // Clear pending images after successful save
      setPendingImages([]);
      localStorage.removeItem(`pendingImages_service_${serviceId}`);
    } catch (error) {
      console.error("Error adding gallery images:", error);
      toast({
        title: "Save failed",
        description: "Failed to add some images to the gallery. The images will remain pending for the next save attempt.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setSelectedImageId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedImageId !== null) {
      try {
        await deleteGalleryImage(selectedImageId);
        toast({
          title: 'Image deleted',
          description: 'The image has been removed from the gallery.',
        });
      } catch (error) {
        console.error('Error deleting image:', error);
        toast({
          title: 'Deletion failed',
          description: 'Failed to delete the image. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsDeleteDialogOpen(false);
        setSelectedImageId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Service Gallery Images</h3>
      </div>
      
      {pendingImages.length > 0 && (
        <Alert className="bg-amber-50 border-amber-300">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-medium text-amber-800">Pending Images</h4>
          </div>
          <AlertDescription className="text-sm text-amber-700">
            You have {pendingImages.length} image{pendingImages.length !== 1 ? 's' : ''} pending to be saved. Click the "Save Service" button at the bottom of the form to save these images to the gallery.
          </AlertDescription>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            {pendingImages.map((imageUrl, index) => (
              <div key={`pending-${index}`} className="relative border rounded overflow-hidden">
                <div className="aspect-video bg-muted/30">
                  <img 
                    src={imageUrl} 
                    alt={`Pending image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs px-2 py-1">
                  Pending
                </div>
              </div>
            ))}
          </div>
        </Alert>
      )}
      
      <div className="p-4 border rounded-md bg-muted/20">
        <h4 className="font-medium mb-3">Upload Images</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop multiple images or click to select files. Images will be saved when you click "Save Service" button.
        </p>
        <FileUpload 
          onUploadComplete={handleFileUpload}
          multiple={true}
          accept="image/*"
          maxSizeMB={5}
        />
      </div>

      {isLoadingGallery ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : serviceGallery && serviceGallery.length > 0 ? (
        <div>
          <h4 className="font-medium mb-3 text-muted-foreground">Current Gallery Images</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {serviceGallery.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-video relative group">
                  <img
                    src={image.imageUrl}
                    alt={image.alt || `Gallery image ${image.id}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/600x400/e2e8f0/1e293b?text=Image+Error";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(image.id)}
                      disabled={isDeletingGalleryImage}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm truncate">{image.alt || `Image ${image.id}`}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : pendingImages.length === 0 && (
        <div className="border rounded-md p-8 text-center bg-muted/30">
          <Image className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No gallery images</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload images above and click "Save Service" to add them to the gallery.
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Gallery Image</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this image? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeletingGalleryImage}
            >
              {isDeletingGalleryImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceGalleryManager;
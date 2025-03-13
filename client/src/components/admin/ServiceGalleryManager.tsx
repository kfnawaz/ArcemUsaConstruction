import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useService } from '@/hooks/useService';
import { ServiceGallery, InsertServiceGallery } from '@shared/schema';
import { Trash2, Upload, Image, Loader2 } from 'lucide-react';
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
import FileUpload from '@/components/common/FileUpload';

interface ServiceGalleryManagerProps {
  serviceId: number;
}

const ServiceGalleryManager: React.FC<ServiceGalleryManagerProps> = ({ serviceId }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    serviceGallery,
    isLoadingGallery,
    uploadFile,
    addGalleryImage,
    deleteGalleryImage,
    isAddingGalleryImage,
    isDeletingGalleryImage
  } = useService(serviceId);

  // Legacy single image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const file = files[0];
      const imageUrl = await uploadFile(file);
      
      // Create gallery image entry
      const galleryImage: InsertServiceGallery = {
        serviceId,
        imageUrl,
        alt: file.name,
        order: serviceGallery ? serviceGallery.length + 1 : 1,
      };
      
      await addGalleryImage(serviceId, galleryImage);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: 'Image uploaded',
        description: 'The image has been added to the gallery.',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // New multiple images upload handler
  const handleMultipleImagesUpload = async (urls: string | string[]) => {
    if (!Array.isArray(urls)) {
      urls = [urls];
    }
    
    setIsUploading(true);
    
    try {
      // Calculate next display order
      const nextOrder = serviceGallery && serviceGallery.length > 0 
        ? Math.max(...serviceGallery.map(img => img.order !== null ? img.order : 0)) + 1 
        : 1;
      
      // Add each image to the gallery with sequential display order
      for (let i = 0; i < urls.length; i++) {
        const galleryImage: InsertServiceGallery = {
          serviceId,
          imageUrl: urls[i],
          alt: `Gallery image ${i + 1}`,
          order: nextOrder + i,
        };
        
        await addGalleryImage(serviceId, galleryImage);
      }
      
      toast({
        title: 'Images uploaded',
        description: `${urls.length} image${urls.length > 1 ? 's' : ''} added to the gallery successfully.`,
      });
    } catch (error) {
      console.error("Error adding multiple gallery images:", error);
      toast({
        title: "Upload failed",
        description: "Failed to add some images to the gallery. Please try again.",
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
      
      <div className="p-4 border rounded-md bg-muted/20">
        <h4 className="font-medium mb-3">Upload Multiple Images</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop multiple images or click to select files. You can upload up to 10 images at once.
        </p>
        <FileUpload 
          onUploadComplete={handleMultipleImagesUpload}
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
      ) : (
        <div className="border rounded-md p-8 text-center bg-muted/30">
          <Image className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No gallery images</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the upload panel above to add images to showcase this service.
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
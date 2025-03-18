import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useService } from '@/hooks/useService';
import { ServiceGallery, InsertServiceGallery } from '@shared/schema';
import { Trash2, Image, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import UploadThingDropzone from '@/components/common/UploadThingDropzone';
import fileUtils from '@/lib/fileUtils';

interface ServiceGalleryManagerProps {
  serviceId: number;
  isNewService?: boolean;
}

export interface ServiceGalleryManagerHandle {
  saveGalleryImages: () => Promise<void>;
  hasUnsavedChanges: () => boolean;
  hasPendingImages: () => boolean;
  getUnsavedChangesCount: () => number;
}

const MAX_GALLERY_IMAGES = 3;

const ServiceGalleryManager = forwardRef<ServiceGalleryManagerHandle, ServiceGalleryManagerProps>(
  function ServiceGalleryManager({ serviceId, isNewService = false }, ref) {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [pendingImages, setPendingImages] = useState<string[]>([]);
    const [showMaxImagesWarning, setShowMaxImagesWarning] = useState(false);
    const [uploadSession, setUploadSession] = useState<string>(fileUtils.generateSessionId());
    const [isCommitted, setIsCommitted] = useState(false);
    const [hasTrackedSession, setHasTrackedSession] = useState(false);
    const [lastModifiedTimestamp, setLastModifiedTimestamp] = useState<number>(0);

    const {
      serviceGallery,
      isLoadingGallery,
      addGalleryImage,
      deleteGalleryImage,
      isDeletingGalleryImage,
      trackUploadSession,
      commitUploads,
      cleanupUploads
    } = useService(serviceId);

    // Check if we've reached the maximum image limit
    const currentImageCount = (serviceGallery?.length || 0) + pendingImages.length;
    const canAddMoreImages = currentImageCount < MAX_GALLERY_IMAGES;

    // Flag an edit has occurred in the last 3 seconds
    const hasRecentEdit = () => {
      return Date.now() - lastModifiedTimestamp < 3000; // 3 seconds
    };
    
    // Mark an edit as happening now
    const markEdited = () => {
      setLastModifiedTimestamp(Date.now());
    };

    // Expose the saveGalleryImages method and hasUnsavedChanges via ref
    useImperativeHandle(ref, () => ({
      saveGalleryImages: async () => {
        return saveGalleryImages();
      },
      hasUnsavedChanges: () => {
        return pendingImages.length > 0;
      },
      hasPendingImages: () => {
        return pendingImages.length > 0;
      },
      getUnsavedChangesCount: () => {
        return pendingImages.length;
      }
    }));

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
    
    // Track upload session only once to prevent infinite loops
    useEffect(() => {
      // Only track the session if it exists, we're not creating a new service, 
      // and we haven't tracked it yet
      if (uploadSession && !isNewService && !hasTrackedSession) {
        console.log('ServiceGalleryManager: Tracking upload session:', uploadSession);
        trackUploadSession(uploadSession);
        setHasTrackedSession(true);
      }
    }, [uploadSession, isNewService, trackUploadSession, hasTrackedSession]);
    
    // Handle component unmount - clean up any uncommitted files
    useEffect(() => {
      return () => {
        // Check if we need to clean up (only if we have an uploadSession and files weren't committed)
        if (uploadSession && !isCommitted && pendingImages.length > 0) {
          console.log("Cleaning up uncommitted gallery uploads on unmount");
          cleanupUploads(uploadSession).catch(err => {
            console.error(`Error cleaning up gallery upload session ${uploadSession}:`, err);
          });
        }
      };
    }, [cleanupUploads, uploadSession, isCommitted, pendingImages]);
    
    // This function handles the file upload but doesn't save to database
    const handleFileUpload = async (urls: string | string[], sessionId?: string) => {
      if (!Array.isArray(urls)) {
        urls = [urls];
      }
      
      // If we received a session ID, track it for cleanup
      if (sessionId && sessionId !== uploadSession) {
        setUploadSession(sessionId);
        setIsCommitted(false);
        
        // Only track if not a new service and if we haven't tracked it yet
        if (!isNewService && !hasTrackedSession) {
          trackUploadSession(sessionId);
          setHasTrackedSession(true);
        }
      }
      
      // Check if adding these images would exceed the limit
      const totalAfterAdd = (serviceGallery?.length || 0) + pendingImages.length + urls.length;
      
      if (totalAfterAdd > MAX_GALLERY_IMAGES) {
        // Calculate how many we can actually add
        const allowedToAdd = Math.max(0, MAX_GALLERY_IMAGES - (serviceGallery?.length || 0) - pendingImages.length);
        
        if (allowedToAdd > 0) {
          // Only add the allowed number of images
          const limitedUrls = urls.slice(0, allowedToAdd);
          setPendingImages(prev => [...prev, ...limitedUrls]);
          markEdited();
          
          toast({
            title: 'Maximum images reached',
            description: `Added ${allowedToAdd} image(s). Services can have a maximum of ${MAX_GALLERY_IMAGES} images.`,
            variant: 'default'
          });
        } else {
          // Can't add any more images
          setShowMaxImagesWarning(true);
          
          toast({
            title: 'Maximum images reached',
            description: `Services can have a maximum of ${MAX_GALLERY_IMAGES} images. Delete some images to add more.`,
            variant: 'destructive'
          });
        }
      } else {
        // We can add all the images
        setPendingImages(prev => [...prev, ...urls]);
        markEdited();
        
        toast({
          title: 'Images added',
          description: `${urls.length} image${urls.length > 1 ? 's' : ''} ready to be saved.`,
        });
      }
    };
    
    // This function will be called by the ServiceManager when the service is saved
    const saveGalleryImages = async () => {
      if (pendingImages.length === 0) return;
      
      setIsUploading(true);
      
      try {
        // For new services, we don't save the gallery images yet - we'll do it after service creation
        if (isNewService) {
          // Just commit the uploads to prevent cleanup of saved files
          if (uploadSession) {
            // Get all file URLs to commit - ensure we're tracking these files
            try {
              await commitUploads(uploadSession, pendingImages);
              console.log(`Committed gallery upload session for new service: ${uploadSession}`);
              setIsCommitted(true);
            } catch (err) {
              console.error('Error committing files:', err);
            }
          }
          
          toast({
            title: 'Images saved',
            description: `${pendingImages.length} image${pendingImages.length > 1 ? 's' : ''} will be added after service creation.`,
          });
          
          return;
        }
        
        // Calculate next display order
        const nextOrder = serviceGallery && serviceGallery.length > 0 
          ? Math.max(...serviceGallery.map(img => img.order !== null ? img.order : 0)) + 1 
          : 1;
        
        // Add each image to the gallery with sequential display order
        console.log(`Adding ${pendingImages.length} gallery images to service ${serviceId}`);
        
        for (let i = 0; i < pendingImages.length; i++) {
          const galleryImage: InsertServiceGallery = {
            serviceId,
            imageUrl: pendingImages[i],
            alt: `Gallery image ${i + 1}`,
            order: nextOrder + i,
          };
          
          console.log("Saving gallery image to database:", galleryImage);
          await addGalleryImage(serviceId, galleryImage);
        }
        
        // Commit the uploads to prevent cleanup of saved files
        if (uploadSession) {
          try {
            await commitUploads(uploadSession, pendingImages);
            console.log(`Committed gallery upload session: ${uploadSession}`);
            setIsCommitted(true);
          } catch (err) {
            console.error('Error committing files:', err);
          }
        }
        
        toast({
          title: 'Gallery updated',
          description: `${pendingImages.length} image${pendingImages.length > 1 ? 's' : ''} added to the gallery successfully.`,
        });
        
        // Clear pending images after successful save
        setPendingImages([]);
        localStorage.removeItem(`pendingImages_service_${serviceId}`);
        setShowMaxImagesWarning(false);
      } catch (error) {
        console.error("Error adding gallery images:", error);
        toast({
          title: "Save failed",
          description: "Failed to add some images to the gallery. Please try again.",
          variant: "destructive"
        });
        throw error;
      } finally {
        setIsUploading(false);
      }
    };

    const handleDeleteClick = (id: number) => {
      setSelectedImageId(id);
      setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
      if (selectedImageId === null) {
        return;
      }
      
      try {
        // Important: Wait for the API call to complete before closing the dialog
        await deleteGalleryImage(selectedImageId);
        setShowMaxImagesWarning(false);
        
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
        // Close dialog and clear selection after operation completes (success or failure)
        setIsDeleteDialogOpen(false);
        setSelectedImageId(null);
      }
    };
    
    // Delete a pending image (not yet saved to database)
    const handleDeletePendingImage = async (index: number) => {
      // Get the URL of the image to delete
      const imageUrl = pendingImages[index];
      
      // Update state first for responsive UI
      setPendingImages(prev => {
        const newPendingImages = [...prev];
        newPendingImages.splice(index, 1);
        return newPendingImages;
      });
      setShowMaxImagesWarning(false);
      markEdited();
      
      // If there's a valid URL, try to delete the file from the server
      if (imageUrl) {
        try {
          console.log('Deleting file:', imageUrl);
          
          // Make direct API call to cleanup the specific file
          const response = await fetch('/api/files/cleanup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileUrl: imageUrl }),
            credentials: 'include'
          });
          
          if (response.ok) {
            console.log(`Successfully removed unused file: ${imageUrl}`);
          }
        } catch (err) {
          console.error('Error cleaning up deleted pending image:', err);
        }
      }
    };

    return (
      <div className="space-y-4">
        {showMaxImagesWarning && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Maximum of {MAX_GALLERY_IMAGES} images allowed per service. Please delete some images to add more.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="p-4 border rounded-md bg-muted/20">
          <h4 className="font-medium mb-3">Service Images ({currentImageCount}/{MAX_GALLERY_IMAGES})</h4>
          
          {canAddMoreImages ? (
            <div className="mb-4">
              <UploadThingDropzone 
                onUploadComplete={handleFileUpload}
                multiple={true}
                endpoint="imageUploader"
                maxFiles={MAX_GALLERY_IMAGES - currentImageCount}
                sessionId={uploadSession}
                onSessionIdCreated={(newSessionId: string) => {
                  if (newSessionId !== uploadSession) {
                    setUploadSession(newSessionId);
                    setHasTrackedSession(false);
                  }
                }}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Add up to {MAX_GALLERY_IMAGES - currentImageCount} more image{MAX_GALLERY_IMAGES - currentImageCount !== 1 ? 's' : ''}.
                Each image can be up to 4MB.
              </p>
            </div>
          ) : null}

          {isLoadingGallery ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Existing saved images */}
              {serviceGallery && serviceGallery.map((image) => (
                <Card key={`saved-${image.id}`} className="overflow-hidden">
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
                </Card>
              ))}
              
              {/* Newly added (pending) images */}
              {pendingImages.map((imageUrl, index) => (
                <Card key={`pending-${index}`} className="overflow-hidden border-dashed border-2">
                  <div className="aspect-video relative group">
                    <img 
                      src={imageUrl} 
                      alt={`New image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePendingImage(index)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3 bg-muted/20">
                    <p className="text-sm truncate text-muted-foreground">New image (not saved yet)</p>
                  </CardContent>
                </Card>
              ))}
              
              {/* Empty state */}
              {currentImageCount === 0 && (
                <div className="col-span-full border rounded-md p-6 text-center bg-muted/30">
                  <Image className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add images to showcase this service. Images will appear in your service details.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      
        {/* Confirmation dialog for deleting saved images */}
        <Dialog 
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            // Only allow closing via the buttons we provide when not actively deleting
            if (!open && !isDeletingGalleryImage) {
              setIsDeleteDialogOpen(false);
              setSelectedImageId(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Gallery Image</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this image? This action cannot be undone.</p>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (!isDeletingGalleryImage) {
                    setIsDeleteDialogOpen(false);
                    setSelectedImageId(null);
                  }
                }}
                disabled={isDeletingGalleryImage}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeletingGalleryImage || selectedImageId === null}
              >
                {isDeletingGalleryImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

export default ServiceGalleryManager;
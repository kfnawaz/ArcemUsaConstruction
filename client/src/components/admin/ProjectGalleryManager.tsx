import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useProject } from '@/hooks/useProject';
import { ProjectGallery, InsertProjectGallery } from '@shared/schema';
import { Trash2, Image, Loader2, AlertCircle, MoveVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";
import FileUpload from '@/components/common/FileUpload';

interface ProjectGalleryManagerProps {
  projectId: number;
  isNewProject?: boolean;
}

export interface ProjectGalleryManagerHandle {
  saveGalleryImages: () => Promise<void>;
}

const MAX_GALLERY_IMAGES = 10;

type PendingImage = {
  url: string;
  caption: string;
  displayOrder: number;
};

const ProjectGalleryManager = forwardRef<ProjectGalleryManagerHandle, ProjectGalleryManagerProps>(
  function ProjectGalleryManager(props, ref) {
    const { projectId, isNewProject = false } = props;
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const [showMaxImagesWarning, setShowMaxImagesWarning] = useState(false);

    const {
      projectGallery,
      isLoadingGallery,
      uploadFile,
      addProjectGalleryImage,
      deleteProjectGalleryImage,
      isDeletingGalleryImage
    } = useProject(projectId);

    // Get the current number of images (both saved and pending)
    const currentImageCount = (projectGallery?.length || 0) + pendingImages.length;
    const canAddMoreImages = currentImageCount < MAX_GALLERY_IMAGES;

    // Expose the saveGalleryImages method via ref
    useImperativeHandle(ref, () => ({
      saveGalleryImages: async () => {
        return saveGalleryImages();
      }
    }));

    // Save pending images to localStorage on change
    useEffect(() => {
      if (pendingImages.length > 0) {
        localStorage.setItem(`pendingImages_project_${projectId}`, JSON.stringify(pendingImages));
      } else {
        localStorage.removeItem(`pendingImages_project_${projectId}`);
      }
    }, [pendingImages, projectId]);

    // Load pending images from localStorage on mount
    useEffect(() => {
      const savedPendingImages = localStorage.getItem(`pendingImages_project_${projectId}`);
      if (savedPendingImages) {
        try {
          setPendingImages(JSON.parse(savedPendingImages));
        } catch (e) {
          console.error("Error parsing saved pending images:", e);
          localStorage.removeItem(`pendingImages_project_${projectId}`);
        }
      }
    }, [projectId]);
    
    // Get the next available display order
    const getNextDisplayOrder = (): number => {
      if (!projectGallery || projectGallery.length === 0) {
        return pendingImages.length > 0 
          ? Math.max(...pendingImages.map(img => img.displayOrder)) + 1 
          : 1;
      }
      
      const maxExistingOrder = Math.max(...projectGallery.map(img => 
        img.displayOrder !== null ? img.displayOrder : 0
      ));
      
      const maxPendingOrder = pendingImages.length > 0 
        ? Math.max(...pendingImages.map(img => img.displayOrder)) 
        : 0;
      
      return Math.max(maxExistingOrder, maxPendingOrder) + 1;
    };
    
    // This function handles the file upload but doesn't save to database
    const handleFileUpload = async (urls: string | string[]) => {
      if (!Array.isArray(urls)) {
        urls = [urls];
      }
      
      // Check if adding these images would exceed the limit
      const totalAfterAdd = (projectGallery?.length || 0) + pendingImages.length + urls.length;
      
      if (totalAfterAdd > MAX_GALLERY_IMAGES) {
        // Calculate how many we can actually add
        const allowedToAdd = Math.max(0, MAX_GALLERY_IMAGES - (projectGallery?.length || 0) - pendingImages.length);
        
        if (allowedToAdd > 0) {
          // Only add the allowed number of images
          const limitedUrls = urls.slice(0, allowedToAdd);
          const nextOrder = getNextDisplayOrder();
          
          const newPendingImages = limitedUrls.map((url, index) => ({
            url,
            caption: `Image ${pendingImages.length + index + 1}`,
            displayOrder: nextOrder + index
          }));
          
          setPendingImages(prev => [...prev, ...newPendingImages]);
          
          toast({
            title: 'Maximum images reached',
            description: `Added ${allowedToAdd} image(s). Projects can have a maximum of ${MAX_GALLERY_IMAGES} images.`,
            variant: 'default'
          });
        } else {
          // Can't add any more images
          setShowMaxImagesWarning(true);
          
          toast({
            title: 'Maximum images reached',
            description: `Projects can have a maximum of ${MAX_GALLERY_IMAGES} images. Delete some images to add more.`,
            variant: 'destructive'
          });
        }
      } else {
        // We can add all the images
        const nextOrder = getNextDisplayOrder();
        
        const newPendingImages = urls.map((url, index) => ({
          url,
          caption: `Image ${pendingImages.length + index + 1}`,
          displayOrder: nextOrder + index
        }));
        
        setPendingImages(prev => [...prev, ...newPendingImages]);
        
        toast({
          title: 'Images added',
          description: `${urls.length} image${urls.length > 1 ? 's' : ''} ready to be saved.`,
        });
      }
    };
    
    // Update caption for a pending image
    const updatePendingImageCaption = (index: number, caption: string) => {
      setPendingImages(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], caption };
        return updated;
      });
    };
    
    // Update display order for a pending image
    const updatePendingImageOrder = (index: number, displayOrder: number) => {
      setPendingImages(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], displayOrder };
        return updated;
      });
    };
    
    // This function will be called by the ProjectManager when the project is saved
    const saveGalleryImages = async () => {
      if (pendingImages.length === 0) return;
      
      setIsUploading(true);
      
      try {
        // Add each image to the gallery with caption and display order
        for (const image of pendingImages) {
          const galleryImage: InsertProjectGallery = {
            projectId,
            imageUrl: image.url,
            caption: image.caption,
            displayOrder: image.displayOrder,
          };
          
          await addProjectGalleryImage(galleryImage);
        }
        
        toast({
          title: 'Gallery updated',
          description: `${pendingImages.length} image${pendingImages.length > 1 ? 's' : ''} added to the gallery successfully.`,
        });
        
        // Clear pending images after successful save
        setPendingImages([]);
        localStorage.removeItem(`pendingImages_project_${projectId}`);
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
      if (selectedImageId !== null) {
        try {
          await deleteProjectGalleryImage(selectedImageId);
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
          setIsDeleteDialogOpen(false);
          setSelectedImageId(null);
        }
      }
    };
    
    // Delete a pending image (not yet saved to database)
    const handleDeletePendingImage = (index: number) => {
      setPendingImages(prev => {
        const newPendingImages = [...prev];
        newPendingImages.splice(index, 1);
        return newPendingImages;
      });
      setShowMaxImagesWarning(false);
    };

    return (
      <div className="space-y-4">
        {showMaxImagesWarning && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Maximum of {MAX_GALLERY_IMAGES} images allowed per project. Please delete some images to add more.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="p-4 border rounded-md bg-muted/20">
          <h4 className="font-medium mb-3">Project Images ({currentImageCount}/{MAX_GALLERY_IMAGES})</h4>
          
          {canAddMoreImages ? (
            <div className="mb-4">
              <FileUpload 
                onUploadComplete={handleFileUpload}
                multiple={true}
                accept="image/*"
                maxSizeMB={5}
                buttonText="Add Project Images"
                helpText={`Add up to ${MAX_GALLERY_IMAGES - currentImageCount} more image${MAX_GALLERY_IMAGES - currentImageCount !== 1 ? 's' : ''}`}
              />
            </div>
          ) : null}

          {isLoadingGallery ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Existing saved images */}
              {projectGallery && projectGallery.map((image) => (
                <Card key={`saved-${image.id}`} className="overflow-hidden">
                  <div className="aspect-video relative group">
                    <img
                      src={image.imageUrl}
                      alt={image.caption || `Project image ${image.id}`}
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
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MoveVertical className="h-4 w-4" />
                          <span className="text-sm">Order: {image.displayOrder}</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium truncate">{image.caption || 'No caption'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Newly added (pending) images */}
              {pendingImages.map((image, index) => (
                <Card key={`pending-${index}`} className="overflow-hidden border-dashed border-2">
                  <div className="aspect-video relative group">
                    <img 
                      src={image.url} 
                      alt={image.caption || `New image ${index + 1}`}
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
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between gap-4">
                      <div className="flex-grow">
                        <Label htmlFor={`caption-${index}`} className="text-xs">Caption</Label>
                        <Input 
                          id={`caption-${index}`}
                          value={image.caption}
                          onChange={(e) => updatePendingImageCaption(index, e.target.value)}
                          className="h-8 mt-1"
                        />
                      </div>
                      <div className="w-24">
                        <Label htmlFor={`order-${index}`} className="text-xs">Display Order</Label>
                        <Input 
                          id={`order-${index}`}
                          type="number"
                          value={image.displayOrder}
                          onChange={(e) => updatePendingImageOrder(index, parseInt(e.target.value) || 0)}
                          className="h-8 mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="px-4 py-2 bg-muted/20 border-t">
                    <p className="text-xs text-muted-foreground">New image (not saved yet)</p>
                  </CardFooter>
                </Card>
              ))}
              
              {/* Empty state */}
              {currentImageCount === 0 && (
                <div className="col-span-full border rounded-md p-6 text-center bg-muted/30">
                  <Image className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add up to {MAX_GALLERY_IMAGES} images to showcase this project.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

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
  }
);

export default ProjectGalleryManager;
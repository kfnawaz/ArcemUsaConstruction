import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useProject } from '@/hooks/useProject';
import { ProjectGallery, InsertProjectGallery } from '@shared/schema';
import { Trash2, Image, Loader2, AlertCircle, ArrowUp, ArrowDown, GripVertical, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from '@/components/ui/label';
import FileUpload from '@/components/common/FileUpload';

interface ProjectGalleryManagerProps {
  projectId: number;
  isNewProject?: boolean;
}

export interface ProjectGalleryManagerHandle {
  saveGalleryImages: () => Promise<void>;
  hasPendingImages: () => boolean;
  hasUnsavedChanges: () => boolean;
  hasRecentlyModified: () => boolean;
  getUnsavedChangesCount: () => number;
}

const MAX_GALLERY_IMAGES = 10;

// Type that matches our pending image structure
type PendingImage = {
  url: string;
  caption: string;
  displayOrder: number;
}

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
      updateProjectGalleryImage,
      isDeletingGalleryImage
    } = useProject(projectId);

    // Check if we've reached the maximum image limit
    const currentImageCount = (projectGallery?.length || 0) + pendingImages.length;
    const canAddMoreImages = currentImageCount < MAX_GALLERY_IMAGES;

    // Track if captions or orders have been modified
    const [modifiedCaptions, setModifiedCaptions] = useState<Set<number>>(new Set());
    const [modifiedOrders, setModifiedOrders] = useState<Set<number>>(new Set());
    const [lastModifiedTimestamp, setLastModifiedTimestamp] = useState<number>(0);
    
    // Flag an edit has occurred in the last 3 seconds
    const hasRecentEdit = () => {
      return Date.now() - lastModifiedTimestamp < 3000; // 3 seconds
    };
    
    // Mark an edit as happening now
    const markEdited = () => {
      setLastModifiedTimestamp(Date.now());
    };
    
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      saveGalleryImages: async () => {
        return saveGalleryImages();
      },
      hasPendingImages: () => {
        return pendingImages.length > 0;
      },
      hasUnsavedChanges: () => {
        return pendingImages.length > 0 || modifiedCaptions.size > 0 || modifiedOrders.size > 0;
      },
      hasRecentlyModified: () => {
        return hasRecentEdit();
      },
      getUnsavedChangesCount: () => {
        return pendingImages.length + modifiedCaptions.size + modifiedOrders.size;
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

    // Calculate the next order value for new images
    const getNextOrderValue = () => {
      if (projectGallery && projectGallery.length > 0) {
        const existingOrders = projectGallery.map(image => image.displayOrder !== null ? image.displayOrder : 0);
        return Math.max(...existingOrders) + 1;
      } else if (pendingImages.length > 0) {
        const pendingOrders = pendingImages.map(image => image.displayOrder);
        return Math.max(...pendingOrders) + 1;
      }
      return 1;
    };
    
    // This function handles the file upload but doesn't save to database
    const handleFileUpload = async (urls: string | string[]) => {
      if (!Array.isArray(urls)) {
        urls = [urls];
      }
      
      // Check if adding these images would exceed the limit
      const totalAfterAdd = currentImageCount + urls.length;
      
      if (totalAfterAdd > MAX_GALLERY_IMAGES) {
        // Calculate how many we can actually add
        const allowedToAdd = Math.max(0, MAX_GALLERY_IMAGES - currentImageCount);
        
        if (allowedToAdd > 0) {
          // Only add the allowed number of images
          const limitedUrls = urls.slice(0, allowedToAdd);
          
          // Create pending images with next order value
          const nextOrder = getNextOrderValue();
          const newPendingImages = limitedUrls.map((url, idx) => ({
            url,
            caption: `Project image ${idx + 1}`,
            displayOrder: nextOrder + idx
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
        const nextOrder = getNextOrderValue();
        const newPendingImages = urls.map((url, idx) => ({
          url,
          caption: `Project image ${idx + 1}`,
          displayOrder: nextOrder + idx
        }));
        
        setPendingImages(prev => [...prev, ...newPendingImages]);
        
        toast({
          title: 'Images added',
          description: `${urls.length} image${urls.length > 1 ? 's' : ''} ready to be saved.`,
        });
      }
    };
    
    // This function will be called by the ProjectManager when the project is saved
    const saveGalleryImages = async () => {
      if (pendingImages.length === 0) return;
      
      setIsUploading(true);
      
      try {
        // Add each image to the gallery with caption and display order
        for (const pendingImage of pendingImages) {
          const galleryImage: InsertProjectGallery = {
            projectId,
            imageUrl: pendingImage.url,
            caption: pendingImage.caption,
            displayOrder: pendingImage.displayOrder,
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

    // Update caption for a saved image
    const handleUpdateImageCaption = async (id: number, caption: string) => {
      try {
        // Track this caption as being modified
        setModifiedCaptions(prev => {
          const updated = new Set(prev);
          updated.add(id);
          return updated;
        });
        markEdited();
        
        await updateProjectGalleryImage(id, { caption });
        
        // Caption was successfully saved, remove from modified set
        setModifiedCaptions(prev => {
          const updated = new Set(prev);
          updated.delete(id);
          return updated;
        });
        
        toast({
          title: 'Caption updated',
          description: 'Image caption has been updated successfully.',
        });
      } catch (error) {
        console.error('Error updating image caption:', error);
        toast({
          title: 'Update failed',
          description: 'Failed to update the image caption. Please try again.',
          variant: 'destructive',
        });
      }
    };

    // Update order for a saved image
    const handleUpdateImageOrder = async (id: number, displayOrder: number) => {
      try {
        // Track this order as being modified
        setModifiedOrders(prev => {
          const updated = new Set(prev);
          updated.add(id);
          return updated;
        });
        markEdited();
        
        await updateProjectGalleryImage(id, { displayOrder });
        
        // Order was successfully saved, remove from modified set
        setModifiedOrders(prev => {
          const updated = new Set(prev);
          updated.delete(id);
          return updated;
        });
        
        toast({
          title: 'Display order updated',
          description: 'Image display order has been updated successfully.',
        });
      } catch (error) {
        console.error('Error updating image order:', error);
        toast({
          title: 'Update failed',
          description: 'Failed to update the image display order. Please try again.',
          variant: 'destructive',
        });
      }
    };

    // Update caption for a pending image
    const handleUpdatePendingImageCaption = (index: number, caption: string) => {
      setPendingImages(prev => {
        const newPendingImages = [...prev];
        newPendingImages[index].caption = caption;
        return newPendingImages;
      });
      markEdited();
    };

    // Update order for a pending image
    const handleUpdatePendingImageOrder = (index: number, order: string) => {
      const orderValue = parseInt(order, 10);
      if (isNaN(orderValue)) return;
      
      setPendingImages(prev => {
        const newPendingImages = [...prev];
        newPendingImages[index].displayOrder = orderValue;
        return newPendingImages;
      });
      markEdited();
    };

    // Move image display order up
    const moveImageOrderUp = (id: number, currentOrder: number | null) => {
      if (!projectGallery || currentOrder === null) return;
      
      // Find if there's an image with order less than current
      const higherImages = projectGallery
        .filter(img => img.displayOrder !== null && img.displayOrder < currentOrder)
        .sort((a, b) => (b.displayOrder || 0) - (a.displayOrder || 0)); // Sort in descending order
        
      if (higherImages.length > 0) {
        const targetImage = higherImages[0];
        handleUpdateImageOrder(id, targetImage.displayOrder || 0);
        handleUpdateImageOrder(targetImage.id, currentOrder);
      }
    };

    // Move image display order down
    const moveImageOrderDown = (id: number, currentOrder: number | null) => {
      if (!projectGallery || currentOrder === null) return;
      
      // Find if there's an image with order more than current
      const lowerImages = projectGallery
        .filter(img => img.displayOrder !== null && img.displayOrder > currentOrder)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)); // Sort in ascending order
        
      if (lowerImages.length > 0) {
        const targetImage = lowerImages[0];
        handleUpdateImageOrder(id, targetImage.displayOrder || 0);
        handleUpdateImageOrder(targetImage.id, currentOrder);
      }
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
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Project Images ({currentImageCount}/{MAX_GALLERY_IMAGES})</h4>
            {(pendingImages.length > 0 || modifiedCaptions.size > 0 || modifiedOrders.size > 0) && (
              <div className="flex items-center text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Unsaved gallery changes</span>
              </div>
            )}
          </div>
          
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
            <div className="space-y-6">
              {/* Existing saved images */}
              {projectGallery && projectGallery.length > 0 && (
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-muted-foreground">Saved Images</h5>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {projectGallery
                      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                      .map((image) => (
                      <Card 
                        key={`saved-${image.id}`} 
                        className={`overflow-hidden ${modifiedCaptions.has(image.id) || modifiedOrders.has(image.id) ? 'border-amber-400 border-2 shadow-md' : ''}`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                          <div className="aspect-video relative group">
                            <img
                              src={image.imageUrl}
                              alt={image.caption || `Project image ${image.id}`}
                              className="w-full h-full object-cover rounded-md cursor-pointer"
                              data-preview-url={image.imageUrl}
                              data-preview-action="true"
                              title="Click to set as preview image"
                              onError={(e) => {
                                e.currentTarget.src = "https://placehold.co/600x400/e2e8f0/1e293b?text=Image+Error";
                              }}
                            />
                            <div className="absolute top-2 right-2 z-10">
                              <Button
                                variant="destructive"
                                size="icon"
                                type="button"
                                className="rounded-full h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeleteClick(image.id);
                                }}
                                disabled={isDeletingGalleryImage}
                                title="Delete image"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-white/90 rounded-md px-3 py-2 flex items-center gap-1 shadow-sm cursor-pointer" data-preview-action="true" data-preview-url={image.imageUrl}>
                                <Star className="h-4 w-4 text-primary fill-primary" />
                                <span className="text-sm font-medium">Set as preview image</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`caption-${image.id}`}>Image Caption</Label>
                                {modifiedCaptions.has(image.id) && (
                                  <span className="text-xs text-amber-600 flex items-center">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Saving...
                                  </span>
                                )}
                              </div>
                              <Input 
                                id={`caption-${image.id}`}
                                defaultValue={image.caption || ''}
                                placeholder="Enter image caption"
                                onBlur={(e) => handleUpdateImageCaption(image.id, e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`order-${image.id}`}>Display Order</Label>
                                {modifiedOrders.has(image.id) && (
                                  <span className="text-xs text-amber-600 flex items-center">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Saving...
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Input 
                                  id={`order-${image.id}`}
                                  type="number"
                                  defaultValue={image.displayOrder || 0}
                                  className="w-20"
                                  onBlur={(e) => {
                                    const value = parseInt(e.target.value, 10);
                                    if (!isNaN(value)) {
                                      handleUpdateImageOrder(image.id, value);
                                    }
                                  }}
                                />
                                <div className="flex flex-col">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      moveImageOrderUp(image.id, image.displayOrder);
                                    }}
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 mt-1"
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      moveImageOrderDown(image.id, image.displayOrder);
                                    }}
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                </div>
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Newly added (pending) images */}
              {pendingImages.length > 0 && (
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-muted-foreground">New Images (Not Saved Yet)</h5>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {pendingImages.map((image, index) => (
                      <Card key={`pending-${index}`} className="overflow-hidden border-dashed border-2 border-amber-400 shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                          <div className="aspect-video relative group">
                            <img 
                              src={image.url} 
                              alt={image.caption || `New image ${index + 1}`}
                              className="w-full h-full object-cover rounded-md"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                variant="destructive"
                                size="sm"
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeletePendingImage(index);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`pending-caption-${index}`}>Image Caption</Label>
                              <Input 
                                id={`pending-caption-${index}`}
                                value={image.caption || ''}
                                placeholder="Enter image caption"
                                onChange={(e) => handleUpdatePendingImageCaption(index, e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`pending-order-${index}`}>Display Order</Label>
                              <Input 
                                id={`pending-order-${index}`}
                                type="number"
                                value={image.displayOrder}
                                className="w-20"
                                onChange={(e) => handleUpdatePendingImageOrder(index, e.target.value)}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">Will be saved with project</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Empty state */}
              {currentImageCount === 0 && (
                <div className="border rounded-md p-6 text-center bg-muted/30">
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
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useProject } from "@/hooks/useProject";
import { ImageIcon, Loader2, CheckCircle2, Trash2, Star, ArrowUp, ArrowDown, X } from "lucide-react";
import FileUpload from '@/components/common/FileUpload';
import { InsertProjectGallery, ProjectGallery } from '@shared/schema';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ProjectGalleryManagerProps {
  projectId: number;
  isNewProject?: boolean;
  onSetMainImage?: (imageUrl: string) => void;
  mainImageUrl?: string;
}

export interface ProjectGalleryManagerHandle {
  saveGalleryImages: () => Promise<void>;
}

// Store pending images that haven't been saved to DB yet
interface PendingImage {
  file: File;
  id: string;
  displayOrder: number;
  caption: string;
  preview: string;
}

const MAX_GALLERY_IMAGES = 10;

const ProjectGalleryManager = forwardRef<ProjectGalleryManagerHandle, ProjectGalleryManagerProps>(
  function ProjectGalleryManager(props, ref) {
    const { projectId, isNewProject = false, onSetMainImage, mainImageUrl } = props;
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const [showMaxImagesWarning, setShowMaxImagesWarning] = useState(false);
    const [editCaption, setEditCaption] = useState('');
    const [editOrder, setEditOrder] = useState<number>(0);

    const {
      projectGallery,
      isLoadingGallery,
      uploadFile,
      addProjectGalleryImage,
      deleteProjectGalleryImage,
      updateGalleryImage,
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
      setIsUploading(true);
      
      if (!Array.isArray(urls)) {
        urls = [urls];
      }
      
      // Check if adding these images would exceed the limit
      const totalAfterAdd = (projectGallery?.length || 0) + pendingImages.length + urls.length;
      if (totalAfterAdd > MAX_GALLERY_IMAGES) {
        setShowMaxImagesWarning(true);
        setIsUploading(false);
        return;
      }

      try {
        let startOrder = getNextDisplayOrder();
        const newPendingImages: PendingImage[] = [];
        
        for (let i = 0; i < urls.length; i++) {
          // Generate a unique ID for this pending image
          const uniqueId = `temp-${Date.now()}-${i}`;
          
          newPendingImages.push({
            file: new File([], "placeholder"), // We don't need the actual File object when using direct URLs
            id: uniqueId,
            displayOrder: startOrder + i,
            caption: `Project image ${startOrder + i}`,
            preview: urls[i]
          });
        }
        
        // Update the pending images state
        const updatedPendingImages = [...pendingImages, ...newPendingImages];
        setPendingImages(updatedPendingImages);
        
        // Save to localStorage
        localStorage.setItem(
          `pendingImages_project_${projectId}`, 
          JSON.stringify(updatedPendingImages)
        );
        
        toast({
          title: "Images added to gallery",
          description: "Save the project to store these images permanently.",
        });
      } catch (error) {
        console.error("Error uploading files:", error);
        toast({
          title: "Upload failed",
          description: "There was an error uploading your files. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
      }
    };
    
    // Save all pending images to the database
    const saveGalleryImages = async (): Promise<void> => {
      if (pendingImages.length === 0) {
        return; // Nothing to save
      }
      
      setIsUploading(true);
      const savedImages: ProjectGallery[] = [];
      
      try {
        for (const pendingImage of pendingImages) {
          const newImage = await addProjectGalleryImage({
            projectId,
            imageUrl: pendingImage.preview,
            caption: pendingImage.caption,
            displayOrder: pendingImage.displayOrder
          });
          
          savedImages.push(newImage);
        }
        
        // Clear the pending images
        setPendingImages([]);
        localStorage.removeItem(`pendingImages_project_${projectId}`);
        
        toast({
          title: "Gallery images saved",
          description: `Successfully saved ${savedImages.length} new images to the gallery.`,
        });
      } catch (error) {
        console.error("Error saving gallery images:", error);
        toast({
          title: "Save failed",
          description: "There was an error saving your gallery images. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
      }
    };
    
    // Removes a pending image from the local state
    const removePendingImage = (idToRemove: string) => {
      const updatedPendingImages = pendingImages.filter(img => img.id !== idToRemove);
      setPendingImages(updatedPendingImages);
      
      if (updatedPendingImages.length > 0) {
        localStorage.setItem(`pendingImages_project_${projectId}`, JSON.stringify(updatedPendingImages));
      } else {
        localStorage.removeItem(`pendingImages_project_${projectId}`);
      }
    };
    
    // Set up image editing
    const openEditDialog = (image: ProjectGallery) => {
      setSelectedImageId(image.id);
      setEditCaption(image.caption || '');
      setEditOrder(image.displayOrder !== null ? image.displayOrder : 0);
      setIsEditDialogOpen(true);
    };
    
    // Update image caption and order
    const handleUpdateImage = async () => {
      if (!selectedImageId) return;
      
      try {
        await updateGalleryImage(selectedImageId, {
          caption: editCaption,
          displayOrder: editOrder
        });
        
        setIsEditDialogOpen(false);
        toast({
          title: "Image updated",
          description: "The gallery image has been updated successfully.",
        });
      } catch (error) {
        console.error("Error updating gallery image:", error);
        toast({
          title: "Update failed",
          description: "There was an error updating the gallery image. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    // Prepare to delete an image
    const confirmDeleteImage = (id: number) => {
      setSelectedImageId(id);
      setIsDeleteDialogOpen(true);
    };
    
    // Delete the image after confirmation
    const handleDeleteImage = async () => {
      if (!selectedImageId) return;
      
      try {
        await deleteProjectGalleryImage(selectedImageId);
        setIsDeleteDialogOpen(false);
        toast({
          title: "Image deleted",
          description: "The gallery image has been deleted successfully.",
        });
      } catch (error) {
        console.error("Error deleting gallery image:", error);
        toast({
          title: "Delete failed",
          description: "There was an error deleting the gallery image. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    // Set an image as the main preview image
    const handleSetMainImage = (imageUrl: string) => {
      if (onSetMainImage) {
        onSetMainImage(imageUrl);
        toast({
          title: "Main image set",
          description: "This image will be used as the main project preview.",
        });
      }
    };
    
    // Sort images by display order for rendering
    const sortedGalleryImages = projectGallery
      ? [...projectGallery].sort((a, b) => {
          const orderA = a.displayOrder !== null ? a.displayOrder : 0;
          const orderB = b.displayOrder !== null ? b.displayOrder : 0;
          return orderA - orderB;
        })
      : [];
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Project Gallery Images</h3>
            <p className="text-sm text-muted-foreground">
              Maximum {MAX_GALLERY_IMAGES} images allowed. Currently using {currentImageCount} of {MAX_GALLERY_IMAGES}.
            </p>
          </div>
          
          {pendingImages.length > 0 && !isNewProject && (
            <Button 
              onClick={saveGalleryImages}
              disabled={isUploading}
              variant="outline"
              className="flex items-center"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Gallery Changes
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* File Upload Section */}
        <div className="p-4 border rounded-md bg-muted/20">
          <h4 className="font-medium mb-2">Upload Images</h4>
          <FileUpload 
            onUploadComplete={handleFileUpload} 
            disabled={!canAddMoreImages || isUploading}
            multiple={true}
          />
          {!canAddMoreImages && (
            <p className="text-sm text-amber-600 mt-2">
              Maximum number of images reached ({MAX_GALLERY_IMAGES}). Please delete some images before uploading more.
            </p>
          )}
        </div>
        
        {/* Gallery Display */}
        {isLoadingGallery ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sortedGalleryImages.length === 0 && pendingImages.length === 0 ? (
          <div className="text-center py-8 border rounded-md bg-muted/20">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No gallery images added yet. Upload images above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending Images (Not saved yet) */}
            {pendingImages.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center">
                  <Badge variant="outline" className="mr-2">Pending</Badge>
                  New Images (Not Saved)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingImages.map((image) => (
                    <Card key={image.id} className="overflow-hidden relative group">
                      <div className="relative aspect-video bg-muted">
                        <img 
                          src={image.preview} 
                          alt={image.caption} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/600x400?text=Image+Not+Found";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-2">
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleSetMainImage(image.preview)}
                              className="text-xs"
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Set as Main
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => removePendingImage(image.id)}
                              className="text-xs"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                        {mainImageUrl === image.preview && (
                          <Badge className="absolute top-2 left-2 bg-primary text-white">Main Image</Badge>
                        )}
                      </div>
                      <div className="p-2 text-xs text-muted-foreground">
                        <p className="truncate">{image.caption}</p>
                        <p>Order: {image.displayOrder}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Saved Images */}
            {sortedGalleryImages.length > 0 && (
              <div className="space-y-2">
                {pendingImages.length > 0 && (
                  <h4 className="text-sm font-medium">Saved Images</h4>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedGalleryImages.map((image) => (
                    <Card 
                      key={image.id} 
                      className={`overflow-hidden relative group 
                        ${mainImageUrl === image.imageUrl ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className="relative aspect-video bg-muted">
                        <img 
                          src={image.imageUrl} 
                          alt={image.caption || "Gallery image"} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/600x400?text=Image+Not+Found";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-2 mb-2">
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleSetMainImage(image.imageUrl)}
                              className="text-xs"
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Set as Main
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => confirmDeleteImage(image.id)}
                              className="text-xs"
                              disabled={isDeletingGalleryImage}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(image)}
                            className="text-xs bg-white"
                          >
                            Edit Details
                          </Button>
                        </div>
                        
                        {mainImageUrl === image.imageUrl && (
                          <Badge className="absolute top-2 left-2 bg-primary text-white">Main Image</Badge>
                        )}
                      </div>
                      <div className="p-3 text-sm">
                        <p className="font-medium truncate">{image.caption || "No caption"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Display Order: {image.displayOrder}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Edit Image Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Gallery Image</DialogTitle>
              <DialogDescription>
                Update the caption and display order for this image.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Enter image caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={editOrder}
                  onChange={(e) => setEditOrder(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers will be displayed first.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateImage}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Image Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Gallery Image</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this image from the project gallery.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteImage}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingGalleryImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Image"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Max Images Warning Dialog */}
        <AlertDialog open={showMaxImagesWarning} onOpenChange={setShowMaxImagesWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Maximum Images Limit</AlertDialogTitle>
              <AlertDialogDescription>
                You can only add up to {MAX_GALLERY_IMAGES} images per project.
                Please remove some existing images before adding more.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowMaxImagesWarning(false)}>
                Understand
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
);

export default ProjectGalleryManager;
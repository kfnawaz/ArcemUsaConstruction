import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBlog } from '@/hooks/useBlog';
import { BlogGallery } from '@shared/schema';
import { Trash2, Upload, Image, Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import FileUpload from '@/components/common/FileUpload';

interface BlogGalleryManagerProps {
  postId: number;
}

const BlogGalleryManager: React.FC<BlogGalleryManagerProps> = ({ postId }) => {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [captionInput, setCaptionInput] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const {
    galleryImages,
    isLoadingGallery,
    addGalleryImage,
    deleteGalleryImage,
    isAddingGalleryImage,
    isDeletingGalleryImage,
    uploadFile,
  } = useBlog(postId);

  const handleFileUploadComplete = async (fileUrl: string | string[]) => {
    // If multiple files were uploaded, we take the first one for now
    const url = typeof fileUrl === 'string' ? fileUrl : fileUrl[0];
    
    if (url) {
      try {
        await addGalleryImage(url, captionInput || null);
        setCaptionInput('');
        setIsAddDialogOpen(false);
      } catch (error) {
        console.error('Error adding gallery image:', error);
      }
    }
  };

  const handleDeleteImage = async () => {
    if (selectedImageId !== null) {
      try {
        await deleteGalleryImage(selectedImageId);
        setIsDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deleting gallery image:', error);
      }
    }
  };

  const confirmDelete = (imageId: number) => {
    setSelectedImageId(imageId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Gallery Images</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Image
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Gallery Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Image caption (optional)"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
              />
              <FileUpload onUploadComplete={handleFileUploadComplete} />
            </div>
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button variant="secondary" type="button">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingGallery ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !galleryImages || galleryImages.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-md">
          <Image className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No gallery images yet</p>
          <Button 
            variant="link" 
            className="mt-2"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add your first image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {galleryImages.map((image: BlogGallery) => (
            <Card key={image.id} className="overflow-hidden group relative">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img 
                    src={image.imageUrl} 
                    alt={image.caption || `Gallery image ${image.id}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => confirmDelete(image.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                {image.caption && (
                  <div className="p-2 text-sm truncate">{image.caption}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Gallery Image</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this gallery image? This action cannot be undone.</p>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeletingGalleryImage}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteImage}
              disabled={isDeletingGalleryImage}
            >
              {isDeletingGalleryImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogGalleryManager;
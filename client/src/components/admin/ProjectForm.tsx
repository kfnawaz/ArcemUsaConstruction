import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProject } from '@/hooks/useProject';
import { InsertProject, insertProjectSchema, InsertProjectGallery, ProjectGallery } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ImageIcon, 
  Loader2, 
  Star, 
  Trash2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import FileUpload from '@/components/common/FileUpload';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ProjectFormProps {
  projectId?: number;
  onClose: () => void;
}

const ProjectForm = ({ projectId, onClose }: ProjectFormProps) => {
  const { 
    project, 
    galleryImages,
    isLoading, 
    saveProject, 
    isSubmitting,
    addGalleryImage,
    updateGalleryImage,
    deleteGalleryImage,
    uploadFile
  } = useProject(projectId);
  
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isUpdatingGallery, setIsUpdatingGallery] = useState(false);
  
  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      title: '',
      category: '',
      description: '',
      image: '',
      featured: false,
    },
  });

  // Set form values when project data is loaded
  useEffect(() => {
    if (project) {
      console.log("Setting form values for project:", project);
      form.reset({
        title: project.title,
        category: project.category,
        description: project.description,
        image: project.image,
        featured: project.featured === null ? false : project.featured,
      });
    }
  }, [form, project]);

  const onSubmit = async (data: InsertProject) => {
    await saveProject(data);
    if (!isSubmitting) {
      onClose();
    }
  };
  
  const handleMultipleImagesUpload = async (urls: string | string[]) => {
    if (!Array.isArray(urls)) {
      urls = [urls];
    }
    
    setIsAddingImage(true);
    
    try {
      // Calculate next display order
      const nextOrder = galleryImages.length > 0 
        ? Math.max(...galleryImages.map(img => img.displayOrder !== null ? img.displayOrder : 0)) + 1 
        : 0;
      
      // Add each image to the gallery with sequential display order
      for (let i = 0; i < urls.length; i++) {
        await addGalleryImage({
          imageUrl: urls[i],
          caption: `Gallery image ${i + 1}`,
          displayOrder: nextOrder + i
        });
      }
      
      // Success notification will be shown by the hook
    } catch (error) {
      console.error("Error adding multiple gallery images:", error);
    } finally {
      setIsAddingImage(false);
    }
  };
  
  const handleDeleteGalleryImage = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      await deleteGalleryImage(id);
    }
  };
  
  const handleUpdateGalleryImage = async (id: number, updates: Partial<InsertProjectGallery>) => {
    setIsUpdatingGallery(true);
    try {
      await updateGalleryImage(id, updates);
    } catch (error) {
      console.error(`Error updating gallery image ${id}:`, error);
    } finally {
      setIsUpdatingGallery(false);
    }
  };
  
  const handleSetAsPreview = (imageUrl: string) => {
    form.setValue('image', imageUrl);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onClose} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-montserrat font-bold">
          {projectId ? 'Edit Project' : 'Add New Project'}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-pulse space-y-4 w-full max-w-xl">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter project title" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="E.g., Commercial, Residential, Industrial" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Specify the project category or type
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a detailed description of the project" 
                            rows={5}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Featured Project
                          </FormLabel>
                          <FormDescription>
                            Featured projects are displayed prominently on the homepage
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preview Image</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Selected preview image URL" 
                            {...field} 
                            disabled
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormDescription>
                          Select a preview image from the gallery below or upload a new one
                        </FormDescription>
                        <FormMessage />
                        {field.value && (
                          <div className="mt-2 border rounded p-2">
                            <div className="relative">
                              <Badge className="absolute top-2 left-2 bg-primary text-white">Preview Image</Badge>
                              <img 
                                src={field.value} 
                                alt="Project preview image" 
                                className="w-full h-64 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src = "https://placehold.co/600x400?text=Image+Not+Found";
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Project Gallery Images</h3>
                    <p className="text-sm text-muted-foreground">
                      Add, edit, or remove gallery images for this project. Select one image as the preview.
                    </p>
                    
                    <div className="p-4 border rounded-md bg-muted/20">
                      <h4 className="font-medium mb-2">Upload Images</h4>
                      <FileUpload 
                        onUploadComplete={handleMultipleImagesUpload}
                        multiple={true}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gallery images list */}
              <div>
                <Separator className="my-6" />
                <h3 className="text-lg font-semibold mb-4">Project Gallery</h3>
                {galleryImages.length === 0 ? (
                  <div className="text-center py-8 border rounded-md bg-muted/20">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No gallery images added yet. Upload images above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {galleryImages
                      .sort((a, b) => {
                        // Sort by display order, default to 0 if null
                        const orderA = a.displayOrder !== null ? a.displayOrder : 0;
                        const orderB = b.displayOrder !== null ? b.displayOrder : 0;
                        return orderA - orderB;
                      })
                      .map((image) => (
                        <Card key={image.id} className={`overflow-hidden transition-all ${form.getValues('image') === image.imageUrl ? 'ring-2 ring-primary' : ''}`}>
                          <div className="relative aspect-video bg-muted">
                            <img 
                              src={image.imageUrl} 
                              alt={image.caption || "Gallery image"} 
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                e.currentTarget.src = "https://placehold.co/600x400?text=Image+Not+Found";
                              }}
                            />
                            <div className="absolute top-2 right-2 flex space-x-1">
                              <Button
                                variant={form.getValues('image') === image.imageUrl ? "default" : "outline"}
                                size="icon"
                                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                                onClick={() => handleSetAsPreview(image.imageUrl)}
                                title="Set as preview image"
                              >
                                <Star className={`h-4 w-4 ${form.getValues('image') === image.imageUrl ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'}`} />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full opacity-90 hover:opacity-100"
                                onClick={() => handleDeleteGalleryImage(image.id)}
                                title="Delete image"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Input
                                  value={image.caption || ""}
                                  onChange={(e) => handleUpdateGalleryImage(image.id, { caption: e.target.value })}
                                  placeholder="Enter image caption"
                                  className="text-sm"
                                  disabled={isUpdatingGallery}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="text-xs text-muted-foreground mr-2">Display Order:</label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={image.displayOrder !== null ? image.displayOrder : 0}
                                  onChange={(e) => handleUpdateGalleryImage(image.id, { displayOrder: parseInt(e.target.value) || 0 })}
                                  className="w-20 h-7 text-xs"
                                  disabled={isUpdatingGallery}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {projectId ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {projectId ? 'Update Project' : 'Create Project'}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
};

export default ProjectForm;
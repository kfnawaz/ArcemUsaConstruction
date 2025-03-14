import { useEffect, useState, useRef } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import ProjectGalleryManager from './ProjectGalleryManager';

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
  
  const { toast } = useToast(); // Provides the toast notification function
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isUpdatingGallery, setIsUpdatingGallery] = useState(false);
  
  // Reference to the gallery manager component for controlling image saving
  const galleryManagerRef = useRef<{saveGalleryImages: () => Promise<void>}>(null);
  
  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      title: '',
      category: '',
      description: '',
      image: '',
      featured: false,
      // Project details
      overview: '',
      challenges: '',
      results: '',
      // Project specifications
      client: '',
      location: '',
      size: '',
      completionDate: '',
      servicesProvided: '',
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
        // Project details
        overview: project.overview ?? '',
        challenges: project.challenges ?? '',
        results: project.results ?? '',
        // Project specifications
        client: project.client ?? '',
        location: project.location ?? '',
        size: project.size ?? '',
        completionDate: project.completionDate ?? '',
        servicesProvided: project.servicesProvided ?? '',
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
  
  // This function only updates the form state without submitting
  const handleSetAsPreview = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, imageUrl: string) => {
    // Prevent the event from bubbling up to any parent elements
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Setting preview image to:", imageUrl);
    
    // Only set the value in the form without triggering a save
    form.setValue('image', imageUrl, { 
      shouldDirty: true,      // Mark the form as dirty since we changed a value
      shouldTouch: true,      // Mark the field as touched
      shouldValidate: false   // Don't trigger validation
    });
    
    // Explicitly log the form state to verify it's not submitting
    console.log("Form state after setting preview:", {
      isDirty: form.formState.isDirty,
      isSubmitting: form.formState.isSubmitting,
      isSubmitted: form.formState.isSubmitted
    });
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
                          Select a preview image from the gallery below or upload a new one.
                          {form.formState.isDirty && <span className="text-blue-600 font-medium ml-1">Click "Update Project" to save changes</span>}
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

              {/* Project Details Fields */}
              <div className="mt-8">
                <Separator className="my-6" />
                <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="overview"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Overview</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide an overview of the project" 
                            rows={4}
                            {...field}
                            value={field.value ?? ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="challenges"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Challenges and Solutions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe challenges faced during the project and solutions implemented" 
                            rows={6}
                            {...field}
                            value={field.value ?? ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="results"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Results</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the project results and outcomes" 
                            rows={4}
                            {...field}
                            value={field.value ?? ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Project Specifications Fields */}
              <div className="mt-8">
                <Separator className="my-6" />
                <h3 className="text-lg font-semibold mb-4">Project Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="client"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Client name" 
                            {...field}
                            value={field.value ?? ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Project location" 
                            {...field}
                            value={field.value ?? ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Size</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="E.g., 10,000 sq ft" 
                            {...field}
                            value={field.value ?? ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="completionDate"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Completion Date</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="E.g., June 2023" 
                            {...fieldProps}
                            value={value ?? ''} 
                            onChange={onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="servicesProvided"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Services Provided</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List services provided for this project" 
                            rows={3}
                            {...fieldProps}
                            value={value ?? ''} 
                            onChange={onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                                onClick={(e) => handleSetAsPreview(e, image.imageUrl)}
                                title={form.getValues('image') === image.imageUrl ? "Selected as preview (click Update Project to save)" : "Set as preview image"}
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
                  className={form.formState.isDirty ? "animate-pulse" : ""}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {projectId ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {form.formState.isDirty && projectId ? 'Save Changes' : projectId ? 'Update Project' : 'Create Project'}
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
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
  AlertCircle,
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
import ProjectGalleryManager, { ProjectGalleryManagerHandle } from './ProjectGalleryManager';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProjectFormProps {
  projectId?: number;
  onClose: () => void;
}

const ProjectForm = ({ projectId, onClose }: ProjectFormProps) => {
  const { 
    project, 
    projectGallery,
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
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<InsertProject | null>(null);
  
  // Create a ref to the ProjectGalleryManager component
  const galleryManagerRef = useRef<ProjectGalleryManagerHandle>(null);
  
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

  // Check if there are unsaved gallery changes
  const checkUnsavedGalleryChanges = (): boolean => {
    if (projectId && galleryManagerRef.current) {
      return galleryManagerRef.current.hasUnsavedChanges();
    }
    return false;
  };

  // Handle form pre-submit to check for unsaved gallery changes
  const handleFormSubmit = (data: InsertProject) => {
    if (checkUnsavedGalleryChanges()) {
      // Store form data and show confirmation dialog
      setPendingFormData(data);
      setShowUnsavedDialog(true);
    } else {
      // No unsaved gallery changes, proceed with form submission
      submitForm(data);
    }
  };

  // Actual form submission logic
  const submitForm = async (data: InsertProject) => {
    try {
      await saveProject(data);
      
      // If we have a gallery manager and a project ID, save the gallery images
      if (projectId && galleryManagerRef.current) {
        try {
          await galleryManagerRef.current.saveGalleryImages();
        } catch (error) {
          console.error("Error saving gallery images:", error);
          toast({
            title: "Warning",
            description: "Project was saved but there was an error saving some gallery images.",
            variant: "destructive"
          });
        }
      }
      
      toast({
        title: "Success",
        description: projectId ? "Project updated successfully" : "Project created successfully",
      });
      
      if (!isSubmitting) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Continue with form submission and save gallery changes
  const confirmSubmitWithChanges = () => {
    if (pendingFormData) {
      submitForm(pendingFormData);
      setShowUnsavedDialog(false);
    }
  };
  
  // Original form onSubmit handler
  const onSubmit = handleFormSubmit;
  
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
          projectId: projectId as number,
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
  const handleSetAsPreview = (e: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, imageUrl: string) => {
    // Prevent the event from bubbling up to any parent elements if event is provided
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("Setting preview image to:", imageUrl);
    
    // Only set the value in the form without triggering a save
    form.setValue('image', imageUrl, { 
      shouldDirty: true,      // Mark the form as dirty since we changed a value
      shouldTouch: true,      // Mark the field as touched
      shouldValidate: false   // Don't trigger validation
    });
    
    // Show toast to confirm the action
    toast({
      title: "Preview image updated",
      description: "This image will be used as the project thumbnail"
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

              {/* Project Gallery Images Section */}
              <div className="mt-8">
                <Separator className="my-6" />
                <h3 className="text-lg font-semibold mb-4">Project Gallery Images</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add, edit, or remove gallery images for this project. You can add up to 10 images per project.
                  {projectId && projectGallery && projectGallery.length > 0 && 
                    " Simply click on any image to set it as the project preview image."}
                </p>
                
                {projectId && (
                  <div
                    onClick={(e) => {
                      // Find if the clicked element is our image with data-preview-action
                      const targetElem = e.target as HTMLElement;
                      const previewImage = targetElem.closest('[data-preview-action="true"]');
                      
                      if (previewImage) {
                        // Get the image URL from the data attribute
                        const imageUrl = previewImage.getAttribute('data-preview-url');
                        if (imageUrl) {
                          handleSetAsPreview(null, imageUrl);
                        }
                      }
                    }}
                  >
                    <ProjectGalleryManager 
                      ref={galleryManagerRef}
                      projectId={projectId} 
                      previewImageUrl={form.getValues('image')}
                    />
                  </div>
                )}
                
                {!projectId && (
                  <div className="text-center py-8 border rounded-md bg-muted/20">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Save the project first to add gallery images.</p>
                  </div>
                )}
                
                {/* Current preview image indicator */}
                {projectId && form.getValues('image') && (
                  <div className="mt-4 p-4 border rounded-md bg-muted/10">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                        <img 
                          src={form.getValues('image')} 
                          alt="Current preview image" 
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/400x400?text=Error";
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Star className="h-4 w-4 text-primary fill-primary" /> 
                          Current Preview Image
                        </p>
                        <p className="text-xs text-muted-foreground">
                          This image will be shown in project listings
                        </p>
                      </div>
                    </div>
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
      {/* Unsaved Gallery Changes Confirmation Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Gallery Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes in the project gallery. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center border rounded-md p-3 bg-amber-50 text-amber-800 mt-2">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm">
              If you continue without saving, your gallery changes (new images, updated captions or display orders) will be lost.
            </p>
          </div>
          
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowUnsavedDialog(false)}>
              Go Back and Save Gallery Changes
            </Button>
            <Button 
              variant="default" 
              onClick={confirmSubmitWithChanges}
            >
              Continue and Save Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectForm;
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { fileUtils } from '@/lib/fileUtils';
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
    uploadFile,
    commitUploads,
    cleanupUploads,
    uploadSessions
  } = useProject(projectId);
  
  const { toast } = useToast(); // Provides the toast notification function
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isUpdatingGallery, setIsUpdatingGallery] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<InsertProject | null>(null);
  const [currentUploadSession, setCurrentUploadSession] = useState<string>(`session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const [featureImageSession, setFeatureImageSession] = useState<string | null>(null);
  
  // Helper function to generate a random session ID for uploads
  const generateSessionId = () => {
    return `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };
  
  // Helper function to add a session ID to the tracked sessions
  const addUploadSession = (sessionId: string) => {
    // Add to uploadSessions for tracking
    uploadSessions.add(sessionId);
    console.log(`Added session ${sessionId} to tracked sessions`);
  };
  
  // List of construction industry project categories
  const projectCategories = [
    "Commercial Construction",
    "Residential Construction",
    "Industrial Construction",
    "Infrastructure",
    "Healthcare Facilities",
    "Educational Facilities",
    "Hospitality",
    "Retail Construction",
    "Office Buildings",
    "Mixed-Use Development",
    "Tenant Improvements",
    "Renovation/Remodeling",
    "Historic Restoration",
    "Green Building/Sustainable",
    "High-Rise Construction",
    "Multi-Family Housing",
    "Government/Public Works",
    "Warehouse/Distribution",
    "Religious Facilities",
    "Sports & Recreation"
  ];
  
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
      
      // If we have a gallery manager (either new or existing project), save the gallery images
      if (galleryManagerRef.current) {
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
        // If the form was successfully saved, commit the uploads instead of cleaning them up
        if (currentUploadSession) {
          await commitUploads(currentUploadSession);
        }
        if (featureImageSession) {
          await commitUploads(featureImageSession);
        }
        
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
  
  // Custom close handler that cleans up pending uploads
  const handleClose = async () => {
    console.log("Handling form close with cleanup");
    
    // Clean up any pending uploads
    if (uploadSessions.size > 0) {
      console.log("Cleaning up upload sessions:", uploadSessions);
      
      const promises: Promise<boolean>[] = [];
      
      // Clean up the current upload session if it exists
      if (currentUploadSession) {
        console.log("Cleaning up current upload session:", currentUploadSession);
        promises.push(cleanupUploads(currentUploadSession));
      }
      
      // Clean up the feature image session if it exists
      if (featureImageSession) {
        console.log("Cleaning up feature image session:", featureImageSession);
        promises.push(cleanupUploads(featureImageSession));
      }
      
      // Clean up any other tracked sessions
      uploadSessions.forEach(session => {
        if (session !== currentUploadSession && session !== featureImageSession) {
          console.log("Cleaning up additional session:", session);
          promises.push(cleanupUploads(session));
        }
      });
      
      // Wait for all cleanup operations to complete
      await Promise.allSettled(promises);
    }
    
    // Call the original onClose function provided by the parent
    onClose();
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
    
    console.log("Setting feature image to:", imageUrl);
    
    // Only set the value in the form without triggering a save
    form.setValue('image', imageUrl, { 
      shouldDirty: true,      // Mark the form as dirty since we changed a value
      shouldTouch: true,      // Mark the field as touched
      shouldValidate: false   // Don't trigger validation
    });
    
    // Show toast to confirm the action
    toast({
      title: "Feature image updated",
      description: "This image will be used as the project thumbnail and hero image"
    });
    
    // Explicitly log the form state to verify it's not submitting
    console.log("Form state after setting feature image:", {
      isDirty: form.formState.isDirty,
      isSubmitting: form.formState.isSubmitting,
      isSubmitted: form.formState.isSubmitted
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleClose} className="mr-4">
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
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projectCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the construction industry category that best fits this project
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
                        <FormLabel>Feature Image</FormLabel>
                        <FormDescription>
                          This image will be used as the project thumbnail on listings and cards.
                          {form.formState.isDirty && <span className="text-blue-600 font-medium ml-1">Click "Update Project" to save changes</span>}
                        </FormDescription>
                        <FormControl>
                          <div className="space-y-4">
                            {/* Direct file upload for feature image */}
                            {!field.value && (
                              <FileUpload
                                onUploadComplete={(url, sessionId) => {
                                  if (typeof url === 'string') {
                                    field.onChange(url);
                                    
                                    // Store the session ID for this feature image
                                    if (sessionId) {
                                      setFeatureImageSession(sessionId);
                                      addUploadSession(sessionId);
                                      console.log("Tracking feature image session:", sessionId);
                                    }
                                  }
                                }}
                                sessionId={featureImageSession || generateSessionId()}
                                accept="image/*"
                                maxSizeMB={5}
                                buttonText="Upload Feature Image"
                                helpText="This will be the main project image"
                              />
                            )}
                            
                            {/* Preview of selected feature image */}
                            {field.value && (
                              <div className="mt-2 border rounded p-2">
                                <div className="relative">
                                  <Badge className="absolute top-2 left-2 bg-primary text-white">Feature Image</Badge>
                                  <img 
                                    src={field.value} 
                                    alt="Project feature image" 
                                    className="w-full h-64 object-cover rounded"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://placehold.co/600x400?text=Image+Not+Found";
                                    }}
                                  />
                                  <div className="absolute bottom-2 right-2 flex space-x-2">
                                    <Button 
                                      type="button"
                                      size="sm" 
                                      variant="destructive"
                                      onClick={() => field.onChange('')}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Project Gallery Section - shown for both new and existing projects */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Project Gallery</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {projectId 
                        ? "Upload additional images to showcase this project." 
                        : "Upload images to showcase this project. Images will be saved after project creation."}
                    </p>
                    
                    {/* Display gallery manager for both new and existing projects */}
                    <ProjectGalleryManager
                      ref={galleryManagerRef}
                      projectId={projectId || 0}
                      isNewProject={!projectId}
                      commitUploads={fileUtils.commitFiles}
                      trackUploadSession={addUploadSession}
                    />
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

              {/* Not needed - we already have the gallery manager above */}

              <div className="flex justify-end space-x-4 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
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
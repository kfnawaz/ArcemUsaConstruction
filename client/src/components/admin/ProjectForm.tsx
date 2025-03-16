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
  Trash2,
  Images,
  LayoutDashboard
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import FileUpload from '@/components/common/FileUpload';
import UploadThingUploader from '@/components/common/UploadThingUploader';
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
  
  const { toast } = useToast();
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isUpdatingGallery, setIsUpdatingGallery] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<InsertProject | null>(null);
  const [currentUploadSession, setCurrentUploadSession] = useState<string>(`session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const [featureImageSession, setFeatureImageSession] = useState<string | null>(null);
  
  // State for tracking the project creation process
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);
  
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
  
  // Create a ref to the ProjectGalleryManager component
  const galleryManagerRef = useRef<ProjectGalleryManagerHandle>(null);
  
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

  // Original form onSubmit handler for existing projects
  const onSubmit = async (data: InsertProject) => {
    if (checkUnsavedGalleryChanges()) {
      // Store form data and show confirmation dialog
      setPendingFormData(data);
      setShowUnsavedDialog(true);
    } else {
      // No unsaved gallery changes, proceed with form submission
      try {
        await saveProject(data);
        
        // If we have a gallery manager (for existing project), save the gallery images
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
          description: "Project updated successfully",
        });
        
        if (!isSubmitting) {
          // If the form was successfully saved, commit the uploads instead of cleaning them up
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
    }
  };
  
  // Form submission for creating new projects - unified approach
  const handleNewProjectSubmit = async (data: InsertProject) => {
    try {
      console.log("Creating new project with data:", data);
      
      // Create the project
      const result = await saveProject(data);
      
      console.log("Project creation result:", result);
      
      // Save the ID of the newly created project
      if (result && typeof result === 'object' && 'id' in result) {
        console.log("Project created successfully with ID:", result.id);
        setCreatedProjectId(result.id);
        
        // Handle gallery images if any have been uploaded
        if (galleryManagerRef.current) {
          try {
            await galleryManagerRef.current.saveGalleryImages();
          } catch (error) {
            console.error("Error saving gallery images:", error);
          }
        }
        
        toast({
          title: "Success",
          description: "Project created successfully",
        });
        
        // Commit uploads instead of cleaning them up
        if (featureImageSession) {
          await commitUploads(featureImageSession);
        }
        
        // Close the form after successful creation
        onClose();
      } else {
        console.error("Project was created but couldn't extract ID:", result);
        toast({
          title: "Warning",
          description: "Project was created but there was an issue with the response. Please check if it was saved correctly.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Continue with form submission and save gallery changes
  const confirmSubmitWithChanges = () => {
    if (pendingFormData) {
      onSubmit(pendingFormData);
      setShowUnsavedDialog(false);
    }
  };
  
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
  
  // Save feature image change for a newly created project
  const saveFeatureImage = async (imageUrl: string) => {
    if (!createdProjectId) return;
    
    try {
      await saveProject({
        ...form.getValues(),
        image: imageUrl
      });
      
      toast({
        title: "Success",
        description: "Feature image updated",
      });
    } catch (error) {
      console.error("Error updating feature image:", error);
      toast({
        title: "Error",
        description: "Failed to update feature image",
        variant: "destructive"
      });
    }
  };

  // This function only updates the form state without submitting (for existing projects)
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
  };

  // Render gallery section for project creation/editing
  const renderGallerySection = () => {
    return (
      <div className="mt-8">
        <Separator className="my-6" />
        <h3 className="text-lg font-semibold mb-4">Project Images</h3>
      
        <div className="space-y-6">
          {/* Feature Image Upload */}
          <div className="bg-muted/30 rounded-lg p-5 border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-base font-medium">Feature Image</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Set the main image that will be used as the project thumbnail and hero image
                </p>
              </div>
            </div>
              
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <div className="space-y-4">
                      {/* Feature Image Upload */}
                      {!field.value && (
                        <div className="space-y-3">
                          <UploadThingUploader
                            endpoint="imageUploader"
                            onClientUploadComplete={(res: any) => {
                              if (res && res.length > 0) {
                                const uploadedFileUrl = res[0].url;
                                const fallbackUrl = res[0].ufsUrl || uploadedFileUrl;
                                
                                console.log("Feature image uploaded successfully:", fallbackUrl);
                                
                                // Create a new session ID for the feature image
                                const sessionId = generateSessionId();
                                setFeatureImageSession(sessionId);
                                addUploadSession(sessionId);
                                
                                // Track the file with the session ID
                                fileUtils.trackFile(fallbackUrl, sessionId);
                                
                                // Set the feature image URL in the form
                                field.onChange(fallbackUrl);
                              }
                            }}
                            onUploadError={(error: Error) => {
                              toast({
                                title: "Upload failed",
                                description: error.message,
                                variant: "destructive"
                              });
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Display feature image if selected */}
                      {field.value && (
                        <div className="relative">
                          <div className="relative aspect-video rounded-md overflow-hidden border">
                            <img
                              src={field.value}
                              alt="Feature Image"
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="absolute top-2 right-2 flex space-x-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              onClick={() => field.onChange('')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Gallery Images Section */}
          <div className="bg-muted/30 rounded-lg p-5 border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-base font-medium">Project Gallery</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Add additional images to showcase the project (up to 10 images)
                </p>
              </div>
            </div>
            
            {/* Use the gallery manager for both new and existing projects */}
            <ProjectGalleryManager
              ref={galleryManagerRef}
              projectId={projectId || 0}
              onSetAsPreview={handleSetAsPreview}
              allowReordering={true}
            />
          </div>
        </div>
      </div>
    );
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
        
        {/* Project type indicator */}
        {!projectId && (
          <div className="ml-auto flex items-center gap-3">
            <Badge 
              variant="default"
              className="flex items-center gap-1"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <Images className="h-3.5 w-3.5 ml-1" />
              New Project
            </Badge>
          </div>
        )}
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
          {projectId ? (
            // Form for existing projects (all in one view)
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form fields for existing projects */}
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
                            value={field.value || undefined}
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
                            Select the category that best fits this project
                          </FormDescription>
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
                  </div>
                </div>

                {/* Project details section */}
                <div className="mt-8">
                  <Separator className="my-6" />
                  <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Project details fields */}
                    {/* Add fields for overview, challenges, results */}
                  </div>
                </div>

                {/* Project specifications section */}
                <div className="mt-8">
                  <Separator className="my-6" />
                  <h3 className="text-lg font-semibold mb-4">Project Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Project specification fields */}
                    {/* Add fields for client, location, size, etc */}
                  </div>
                </div>

                {/* Rendering the gallery section for existing projects */}
                {renderGallerySection()}

                {/* Action buttons */}
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
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save Changes
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            // Form for new projects (unified approach)
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleNewProjectSubmit)} className="space-y-6">
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
                              Select the category that best fits this project
                            </FormDescription>
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

                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm">
                            <span className="font-semibold block mb-1">About the image upload:</span>
                            <p className="text-muted-foreground">
                              After creating the project, you'll be able to upload a feature image and gallery images in step 2.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
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

                  {/* Action buttons */}
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
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Create Project
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-100 rounded-md p-4 mb-6">
                      <div className="flex">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-green-800">Project created successfully!</h3>
                          <p className="text-sm text-green-700 mt-1">
                            Now add images to showcase your project. You must add a feature image to display on listings.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Project Images Section for newly created projects */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Project Images</h3>
                      
                      <div className="space-y-6">
                        <div className="bg-muted/30 rounded-lg p-5 border">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-base font-medium">Feature Image</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Set the main image that will be used as the project thumbnail
                              </p>
                            </div>
                          </div>
                          
                          <Form {...form}>
                            <form>
                              <FormField
                                control={form.control}
                                name="image"
                                render={({ field }) => (
                                  <FormItem className="space-y-3">
                                    <FormControl>
                                      <div className="space-y-4">
                                        {/* Direct file upload for feature image */}
                                        {!field.value && (
                                          <div className="space-y-3">
                                            {/* Traditional upload for backward compatibility */}
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
                                                  
                                                  // Auto-save the feature image when it's uploaded
                                                  if (createdProjectId) {
                                                    saveFeatureImage(url);
                                                  }
                                                }
                                              }}
                                              sessionId={featureImageSession || generateSessionId()}
                                              accept="image/*"
                                              maxSizeMB={5}
                                              buttonText="Upload Feature Image"
                                              helpText="This will be the main project image"
                                            />

                                            {/* New UploadThing uploader */}
                                            <div className="mt-6">
                                              <Separator className="my-4" />
                                              <p className="text-sm text-muted-foreground mb-4">
                                                <span className="font-semibold">Enhanced upload:</span> Use our new high-speed uploader with progress tracking
                                              </p>
                                              <UploadThingUploader 
                                                onComplete={(urls) => {
                                                  if (urls && urls.length > 0) {
                                                    // Use the first image as the feature image
                                                    field.onChange(urls[0]);
                                                    
                                                    // Auto-save the feature image when it's uploaded
                                                    if (createdProjectId) {
                                                      saveFeatureImage(urls[0]);
                                                    }
                                                  }
                                                }}
                                                multiple={false}
                                                buttonText="Upload Feature Image"
                                                helpText="Max 8MB. JPEG, PNG, WebP formats supported."
                                              />
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Preview of selected feature image */}
                                        {field.value && (
                                          <div className="mt-2 border rounded bg-background p-2">
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
                                                  onClick={() => {
                                                    field.onChange('');
                                                    if (createdProjectId) {
                                                      saveFeatureImage('');
                                                    }
                                                  }}
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
                            </form>
                          </Form>
                        </div>
                        
                        <div className="bg-muted/30 rounded-lg p-5 border">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <div>
                              <h4 className="text-base font-medium">Project Gallery</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Upload additional images to showcase this project
                              </p>
                            </div>
                          </div>
                          
                          {/* Display gallery manager for the newly created project */}
                          <ProjectGalleryManager
                            ref={galleryManagerRef}
                            projectId={createdProjectId}
                            isNewProject={false}
                            commitUploads={fileUtils.commitFiles}
                            trackUploadSession={addUploadSession}
                            previewImageUrl={form.getValues('image')}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons for the images step */}
                    <div className="flex justify-end space-x-4 mt-8">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep('details')}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Details
                      </Button>
                      <Button
                        type="button"
                        variant="gold"
                        onClick={handleClose}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-md">
                    <div className="text-center">
                      <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-sm font-medium text-gray-900">Save project details first</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Complete step 1 to create your project before adding images
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => setCurrentStep('details')}
                      >
                        Go to Step 1
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            // Form for existing projects (all in one view)
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
                    {/* Form fields moved to this column */}
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

                {/* Project Images Section - Combined Feature Image and Gallery */}
                <div className="mt-8">
                  <Separator className="my-6" />
                  <h3 className="text-lg font-semibold mb-4">Project Images</h3>
                  
                  <div className="space-y-6">
                    <div className="bg-muted/30 rounded-lg p-5 border">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-base font-medium">Feature Image</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            This image will be used as the project thumbnail on listings and cards.
                            {form.formState.isDirty && <span className="text-blue-600 font-medium ml-1">Click "Update Project" to save changes</span>}
                          </p>
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
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
                                  <div className="mt-2 border rounded bg-background p-2">
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
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-5 border">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <div>
                          <h4 className="text-base font-medium">Project Gallery</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Upload additional images to showcase this project
                          </p>
                        </div>
                      </div>
                      
                      {/* Display gallery manager for both new and existing projects */}
                      <ProjectGalleryManager
                        ref={galleryManagerRef}
                        projectId={projectId as number}
                        isNewProject={false}
                        commitUploads={fileUtils.commitFiles}
                        trackUploadSession={addUploadSession}
                        previewImageUrl={form.getValues('image')}
                      />
                    </div>
                  </div>
                </div>

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
          )}
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
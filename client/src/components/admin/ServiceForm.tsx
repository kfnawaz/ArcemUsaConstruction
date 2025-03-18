import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useService } from '@/hooks/useService';
import { Service, InsertService, ServiceGallery, InsertServiceGallery, insertServiceSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/select';
import { 
  AlertCircle,
  ArrowLeft, 
  Building, 
  Home, 
  Wrench, 
  Clipboard, 
  Factory, 
  Settings, 
  PencilRuler, 
  BarChart, 
  HardHat,
  Loader2, 
  Trash2,
  Save,
  UploadCloud,
  ImagePlus,
  X,
  FileImage
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import ServiceGalleryManager from './ServiceGalleryManager';
import fileUtils from '@/lib/fileUtils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUploadThing } from '@/lib/uploadthing';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Component props
interface ServiceFormProps {
  serviceId?: number;
  onClose: () => void;
}

// Types for pending gallery images
interface PendingGalleryImage {
  id: string; // Local ID for tracking
  file: File;
  previewUrl: string;
  alt: string;
  order: number;
  uploaded: boolean;
}

// Constants
const MAX_GALLERY_IMAGES = 10;
const SERVICE_ICONS = [
  { value: "building", label: "Building", icon: Building },
  { value: "home", label: "Home", icon: Home },
  { value: "tool", label: "Tool", icon: Wrench },
  { value: "clipboard", label: "Clipboard", icon: Clipboard },
  { value: "factory", label: "Factory", icon: Factory },
  { value: "settings", label: "Settings", icon: Settings },
  { value: "pencil-ruler", label: "Architectural Design", icon: PencilRuler },
  { value: "bar-chart", label: "Project Management", icon: BarChart },
  { value: "hard-hat", label: "Construction Consultation", icon: HardHat }
];

// Using fileUtils.generateSessionId() directly in the component

const ServiceForm: React.FC<ServiceFormProps> = ({ serviceId, onClose }) => {
  const { toast } = useToast();
  const { 
    service, 
    serviceGallery, 
    isLoadingService, 
    createService, 
    updateService, 
    addGalleryImage,
    trackUploadSession,
    commitUploads,
    cleanupUploads
  } = useService(serviceId);
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingGalleryImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSessionId] = useState<string>(fileUtils.generateSessionId());
  const [isDragging, setIsDragging] = useState(false);
  const [showImageLimitWarning, setShowImageLimitWarning] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<InsertService | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  // Reference to gallery manager for existing services
  const galleryManagerRef = useRef<{saveGalleryImages: () => Promise<void>, hasUnsavedChanges: () => boolean}>(null);
  
  // Initialize UploadThing
  const { startUpload } = useUploadThing("imageUploader");

  // Track upload session
  useEffect(() => {
    if (uploadSessionId) {
      trackUploadSession(uploadSessionId);
    }
    
    // Clean up any pending images when component unmounts
    return () => {
      if (uploadSessionId && pendingImages.length > 0) {
        cleanupUploads(uploadSessionId);
        
        // Also cleanup object URLs to avoid memory leaks
        pendingImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
      }
    };
  }, [uploadSessionId, trackUploadSession, pendingImages, cleanupUploads]);
  
  // Initialize form
  const form = useForm<InsertService>({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      title: '',
      description: '',
      icon: 'building',
      features: [],
    }
  });
  
  // Load service data if editing
  useEffect(() => {
    if (service) {
      form.reset({
        title: service.title,
        description: service.description,
        icon: service.icon,
        features: service.features || [],
      });
      
      setFeaturesList(service.features || []);
    }
  }, [form, service]);
  
  // Set combined submission state
  const isProcessing = isSubmitting || isUploading;
  
  // Add feature to the list
  const addFeature = () => {
    if (featureInput.trim()) {
      const updatedFeatures = [...featuresList, featureInput.trim()];
      setFeaturesList(updatedFeatures);
      setFeatureInput('');
      form.setValue('features', updatedFeatures);
    }
  };

  // Remove feature from the list
  const removeFeature = (index: number) => {
    const updatedFeatures = featuresList.filter((_, i) => i !== index);
    setFeaturesList(updatedFeatures);
    form.setValue('features', updatedFeatures);
  };
  
  // Handle drag events for image uploads
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFiles(e.dataTransfer.files);
    }
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageFiles(e.target.files);
    }
  };
  
  // Process selected image files
  const handleImageFiles = (fileList: FileList) => {
    // Check if we've exceeded maximum files
    if (pendingImages.length + fileList.length > MAX_GALLERY_IMAGES) {
      setShowImageLimitWarning(true);
      toast({
        title: "Too many images",
        description: `Maximum ${MAX_GALLERY_IMAGES} images allowed per service`,
        variant: "destructive",
      });
      
      // Only take up to the max allowed
      const remainingSlots = MAX_GALLERY_IMAGES - pendingImages.length;
      if (remainingSlots <= 0) return;
      
      const newFiles = Array.from(fileList).slice(0, remainingSlots);
      addImageFiles(newFiles);
    } else {
      setShowImageLimitWarning(false);
      addImageFiles(Array.from(fileList));
    }
  };
  
  // Add image files to pending list
  const addImageFiles = (files: File[]) => {
    // Only allow image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Only image files are allowed",
        variant: "destructive",
      });
    }
    
    if (imageFiles.length === 0) return;
    
    // Create preview URLs and add to pending images
    const currentOrder = pendingImages.length;
    const newPendingImages = imageFiles.map((file, index) => ({
      id: `local-${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      alt: `Service image ${currentOrder + index + 1}`,
      order: currentOrder + index + 1,
      uploaded: false
    }));
    
    setPendingImages(prev => [...prev, ...newPendingImages]);
    
    toast({
      title: `${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} added`,
      description: "Images will be uploaded when you save the service",
    });
  };
  
  // Remove a pending image
  const removePendingImage = (id: string) => {
    setPendingImages(prev => {
      const index = prev.findIndex(img => img.id === id);
      
      if (index === -1) return prev;
      
      // Release object URL to prevent memory leaks
      URL.revokeObjectURL(prev[index].previewUrl);
      
      const newList = [...prev];
      newList.splice(index, 1);
      
      // Reset warning if we're now under the limit
      if (newList.length < MAX_GALLERY_IMAGES) {
        setShowImageLimitWarning(false);
      }
      
      // Re-order remaining images
      return newList.map((img, idx) => ({
        ...img,
        order: idx + 1
      }));
    });
  };
  
  // Upload images to uploadthing.com
  const uploadImagesToUploadThing = async (): Promise<string[]> => {
    if (pendingImages.length === 0) return [];
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload files using uploadthing
      const files = pendingImages.map(img => img.file);
      
      // Start the upload
      const uploadResults = await startUpload(files);
      
      if (!uploadResults || uploadResults.length === 0) {
        throw new Error("Upload failed - no results returned");
      }
      
      // Simulate progress (since we don't have real-time progress)
      // In a real application, you would use a callback for progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Extract the URLs from the upload results
      const uploadedUrls = uploadResults.map(result => {
        // Always use ufsUrl when available to avoid deprecation warnings
        console.log("UploadThing result:", result);
        
        // Use our utility function to get the best URL to use
        const finalUrl = fileUtils.getUploadThingUrl(result);
        if (finalUrl) {
          return finalUrl;
        } else {
          console.error("No valid URL found in upload result:", result);
          throw new Error("Failed to extract URL from upload result");
        }
      });
      
      // Clear the pending images
      pendingImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
      setPendingImages([]);
      
      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your images. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };
  
  // Create gallery images from uploaded URLs
  const createGalleryImages = async (serviceId: number, imageUrls: string[]): Promise<void> => {
    if (imageUrls.length === 0) return;
    
    try {
      // Mark files as committed in the upload system
      await commitUploads(uploadSessionId, imageUrls);
      
      // Add each image to the database
      for (let i = 0; i < imageUrls.length; i++) {
        const galleryImage: InsertServiceGallery = {
          serviceId,
          imageUrl: imageUrls[i],
          alt: `Service image ${i + 1}`,
          order: i + 1,
        };
        
        await addGalleryImage(serviceId, galleryImage);
      }
      
      toast({
        title: "Images added",
        description: `${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''} added to the gallery`,
      });
    } catch (error) {
      console.error("Error creating gallery images:", error);
      toast({
        title: "Error adding images",
        description: "There was an error adding the images to the service gallery",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  // Check if there are unsaved gallery changes
  const checkUnsavedGalleryChanges = (): boolean => {
    if (serviceId && galleryManagerRef.current) {
      return galleryManagerRef.current.hasUnsavedChanges();
    }
    return false;
  };
  
  // Form submit handler for existing services
  const onUpdateSubmit = async (data: InsertService) => {
    if (checkUnsavedGalleryChanges()) {
      // Store form data and show confirmation dialog
      setPendingFormData(data);
      setShowUnsavedDialog(true);
    } else {
      // No unsaved gallery changes, proceed with form submission
      try {
        setIsSubmitting(true);
        await updateService(serviceId!, data);
        
        // If we have a gallery manager (for existing service), save the gallery images
        if (galleryManagerRef.current) {
          try {
            await galleryManagerRef.current.saveGalleryImages();
          } catch (error) {
            console.error("Error saving gallery images:", error);
            toast({
              title: "Warning",
              description: "Service was saved but there was an error saving some gallery images.",
              variant: "destructive"
            });
          }
        }
        
        toast({
          title: "Success",
          description: "Service updated successfully",
        });
        
        onClose();
      } catch (error) {
        console.error("Error saving service:", error);
        toast({
          title: "Error",
          description: "Failed to save service. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handler for new service submission
  const onCreateSubmit = async (data: InsertService) => {
    try {
      setIsSubmitting(true);
      
      // Create the service first
      const newService = await createService(data);
      
      if (!newService || !newService.id) {
        throw new Error("Failed to create service - no ID returned");
      }
      
      // If we have pending images, upload them and create gallery entries
      if (pendingImages.length > 0) {
        const uploadedUrls = await uploadImagesToUploadThing();
        await createGalleryImages(newService.id, uploadedUrls);
      }
      
      toast({
        title: "Success!",
        description: "Service created successfully",
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating service:", error);
      toast({
        title: "Error",
        description: "There was a problem creating your service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle dialog confirmation for unsaved gallery changes
  const confirmSubmitWithChanges = async () => {
    setShowUnsavedDialog(false);
    
    if (!pendingFormData) return;
    
    try {
      setIsSubmitting(true);
      await updateService(serviceId!, pendingFormData);
      
      // Save the gallery changes
      if (galleryManagerRef.current) {
        await galleryManagerRef.current.saveGalleryImages();
      }
      
      toast({
        title: "Success",
        description: "Service and gallery changes saved successfully",
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving service with gallery changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle service close
  const handleClose = () => {
    // Check for unsaved changes
    if (form.formState.isDirty || checkUnsavedGalleryChanges() || pendingImages.length > 0) {
      if (confirm("You have unsaved changes. Are you sure you want to leave without saving?")) {
        // Clean up any tracked files
        cleanupUploads(uploadSessionId);
        
        // Cleanup object URLs to avoid memory leaks
        pendingImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
        
        onClose();
      }
    } else {
      onClose();
    }
  };
  
  // Render the image upload section for new services
  const renderImageUploadSection = () => {
    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Service Images</h3>
        {showImageLimitWarning && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Maximum of {MAX_GALLERY_IMAGES} images allowed per service. Please remove some images to add more.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Drag and drop area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary/50'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('service-images-input')?.click()}
        >
          <input
            id="service-images-input"
            type="file"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileChange}
          />
          
          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadCloud className="h-10 w-10 text-gray-500" />
            <p className="text-lg font-semibold">
              Drag and drop images here
            </p>
            <p className="text-sm text-gray-500">
              or click to browse for images
            </p>
            <p className="text-xs text-gray-500">
              Maximum {MAX_GALLERY_IMAGES} images, up to 5MB each
            </p>
            <p className="text-xs text-gray-500">
              {pendingImages.length}/{MAX_GALLERY_IMAGES} images
            </p>
          </div>
        </div>
        
        {/* Pending images preview */}
        {pendingImages.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Pending Images ({pendingImages.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pendingImages.map((img) => (
                <Card key={img.id} className="overflow-hidden">
                  <div className="aspect-video relative group">
                    <img
                      src={img.previewUrl}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePendingImage(img.id);
                        }}
                        className="flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-2 bg-muted/20">
                    <p className="text-xs truncate">{img.file.name}</p>
                    <p className="text-xs text-muted-foreground">{fileUtils.formatFileSize(img.file.size)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Upload progress indicator */}
        {isUploading && uploadProgress !== null && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Uploading images...</span>
              <span className="text-sm">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mt-4">
          Images will be uploaded to the service gallery when you save the service. 
          They will be displayed on the service pages and marketing materials.
        </p>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h2 className="text-2xl font-montserrat font-bold">
            {serviceId ? 'Edit Service' : 'Add New Service'}
          </h2>
        </div>
      </div>
      
      {/* Loading state */}
      {isLoadingService ? (
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
          <div className="service-details-section">
            <h3 className="text-xl font-semibold mb-4">Service Details</h3>
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit(serviceId ? onUpdateSubmit : onCreateSubmit)} 
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Commercial Construction" {...field} />
                      </FormControl>
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
                          placeholder="Describe the service..."
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an icon" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SERVICE_ICONS.map(({ value, label, icon: Icon }) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center">
                                <Icon className="w-4 h-4 mr-2" />
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <FormLabel>Features</FormLabel>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a feature..."
                            value={featureInput}
                            onChange={(e) => setFeatureInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addFeature();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={addFeature}
                            variant="outline"
                          >
                            Add
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {featuresList.map((feature, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 border rounded-md"
                            >
                              <span>{feature}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFeature(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          {featuresList.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              No features added yet. Add features to highlight this service.
                            </p>
                          )}
                        </div>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Gallery Images Section - conditionally render based on create/edit */}
                {!serviceId ? (
                  // For new services - show drag/drop uploader 
                  renderImageUploadSection()
                ) : (
                  // For existing services - show gallery manager
                  <div className="pt-6 border-t mt-8">
                    <ServiceGalleryManager 
                      serviceId={serviceId} 
                      ref={galleryManagerRef}
                    />
                  </div>
                )}
                
                {/* Form actions */}
                <div className="pt-6 border-t mt-8">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      className="flex items-center gap-2"
                      disabled={isProcessing}
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {serviceId ? 'Saving...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          {serviceId ? 'Save Changes' : 'Create Service'}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
      
      {/* Unsaved changes confirmation dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Gallery Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes in the service gallery. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowUnsavedDialog(false)}
            >
              Cancel
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  setShowUnsavedDialog(false);
                  if (pendingFormData) {
                    // Save only the form data, discard gallery changes
                    updateService(serviceId!, pendingFormData)
                      .then(() => {
                        toast({
                          title: "Service updated",
                          description: "Service was updated but gallery changes were discarded.",
                        });
                        onClose();
                      })
                      .catch(error => {
                        console.error("Error updating service:", error);
                        toast({
                          title: "Error",
                          description: "Failed to update service.",
                          variant: "destructive"
                        });
                      });
                  }
                }}
              >
                Save Service Only
              </Button>
              <Button onClick={confirmSubmitWithChanges}>
                Save All Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceForm;
import React, { useState, useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Service, InsertService, InsertServiceGallery } from '@shared/schema';
import { useService } from '@/hooks/useService';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import ServiceGalleryManager from './ServiceGalleryManager';
import { 
  Loader2, Save, ArrowLeft, Building, Home, Wrench, Clipboard, 
  Factory, Settings, PencilRuler, BarChart, HardHat, UploadCloud, ImagePlus, X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import * as fileUtils from '@/lib/fileUtils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import UploadThingFileUpload from '@/components/common/UploadThingFileUpload';
import { useUploadThing } from '@/lib/uploadthing';

// Extend the base schema with client-side validation
const serviceFormSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  icon: z.string(),
  features: z.array(z.string()).min(1, {
    message: 'At least one feature is required',
  }),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceManagerProps {
  service?: Service;
  onSuccess?: () => void;
}

// Define a type for pending gallery images
interface PendingGalleryImage {
  file: File;
  previewUrl: string;
}

const MAX_GALLERY_IMAGES = 3;

const ServiceManager: React.FC<ServiceManagerProps> = ({ service, onSuccess }) => {
  const { toast } = useToast();
  const [featureInput, setFeatureInput] = useState('');
  const [featuresList, setFeaturesList] = useState<string[]>(
    service?.features || []
  );
  const galleryManagerRef = useRef<{saveGalleryImages: () => Promise<void>}>(null);
  
  // State for image uploads
  const [pendingImages, setPendingImages] = useState<PendingGalleryImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSessionId, setUploadSessionId] = useState<string>(fileUtils.generateSessionId());
  const [isDragging, setIsDragging] = useState(false);
  const [showImageLimitWarning, setShowImageLimitWarning] = useState(false);
  
  const {
    createService,
    updateService,
    addGalleryImage,
    isCreatingService,
    isUpdatingService,
    trackUploadSession,
    commitUploads,
    cleanupUploads
  } = useService(service?.id);

  // Track upload session
  useEffect(() => {
    // Only track session for existing services, not for new ones
    if (uploadSessionId && service?.id) {
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
  }, [uploadSessionId, service?.id, trackUploadSession, pendingImages, cleanupUploads]);

  // Define form with default values
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: service?.title || '',
      description: service?.description || '',
      icon: service?.icon || 'building',
      features: service?.features || [],
    },
  });

  const isSubmitting = isCreatingService || isUpdatingService || isUploading;

  // Add feature to the list
  const addFeature = () => {
    if (featureInput.trim()) {
      setFeaturesList([...featuresList, featureInput.trim()]);
      setFeatureInput('');
      form.setValue('features', [...featuresList, featureInput.trim()]);
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
    const newPendingImages = imageFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    
    setPendingImages(prev => [...prev, ...newPendingImages]);
    
    toast({
      title: `${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} added`,
      description: "Images will be uploaded when you save the service",
    });
  };
  
  // Remove a pending image
  const removePendingImage = (index: number) => {
    setPendingImages(prev => {
      // Release object URL to prevent memory leaks
      URL.revokeObjectURL(prev[index].previewUrl);
      
      const newList = [...prev];
      newList.splice(index, 1);
      
      // Reset warning if we're now under the limit
      if (newList.length < MAX_GALLERY_IMAGES) {
        setShowImageLimitWarning(false);
      }
      
      return newList;
    });
  };
  
  // Initialize UploadThing outside the function
  const { startUpload } = useUploadThing("imageUploader");
  
  // Upload images to uploadthing.com
  const uploadImagesToUploadThing = async (): Promise<string[]> => {
    if (pendingImages.length === 0) return [];
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload files using uploadthing
      const files = pendingImages.map(img => img.file);
      
      const uploadResults = await startUpload(files);
      
      if (!uploadResults || uploadResults.length === 0) {
        throw new Error("Upload failed - no results returned");
      }
      
      // Extract the URLs from the upload results
      const uploadedUrls = uploadResults.map(result => {
        // Always use ufsUrl when available to avoid deprecation warnings
        return result.ufsUrl || result.url;
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

  // Handle form submission
  const onSubmit = async (data: ServiceFormValues) => {
    const serviceData: InsertService = {
      title: data.title,
      description: data.description,
      icon: data.icon,
      features: data.features,
    };

    try {
      let savedServiceId: number;
      
      if (service) {
        // Update existing service
        await updateService(service.id, serviceData);
        savedServiceId = service.id;
        
        // Save gallery images if there are any pending via the gallery manager
        if (galleryManagerRef.current) {
          await galleryManagerRef.current.saveGalleryImages();
        }
      } else {
        // Create new service
        const newService = await createService(serviceData);
        savedServiceId = newService?.id || 0;
        
        // Upload and save pending images
        if (pendingImages.length > 0 && savedServiceId) {
          const uploadedUrls = await uploadImagesToUploadThing();
          await createGalleryImages(savedServiceId, uploadedUrls);
        }
      }
      
      toast({
        title: `Service ${service ? 'updated' : 'created'} successfully`,
        description: "All changes have been saved.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: 'Error saving service',
        description: 'An error occurred while saving the service. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onSuccess}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h2 className="text-2xl font-montserrat font-bold">
            {service ? 'Edit Service' : 'Add New Service'}
          </h2>
        </div>
      </div>
      
      <div className="space-y-8">
        <div className="service-details-section">
          <h3 className="text-xl font-semibold mb-4">Service Details</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <SelectItem value="building" className="flex items-center">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2" />
                            Building
                          </div>
                        </SelectItem>
                        <SelectItem value="home">
                          <div className="flex items-center">
                            <Home className="w-4 h-4 mr-2" />
                            Home
                          </div>
                        </SelectItem>
                        <SelectItem value="tool">
                          <div className="flex items-center">
                            <Wrench className="w-4 h-4 mr-2" />
                            Tool
                          </div>
                        </SelectItem>
                        <SelectItem value="clipboard">
                          <div className="flex items-center">
                            <Clipboard className="w-4 h-4 mr-2" />
                            Clipboard
                          </div>
                        </SelectItem>
                        <SelectItem value="factory">
                          <div className="flex items-center">
                            <Factory className="w-4 h-4 mr-2" />
                            Factory
                          </div>
                        </SelectItem>
                        <SelectItem value="settings">
                          <div className="flex items-center">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </div>
                        </SelectItem>
                        <SelectItem value="pencil-ruler">
                          <div className="flex items-center">
                            <PencilRuler className="w-4 h-4 mr-2" />
                            Architectural Design
                          </div>
                        </SelectItem>
                        <SelectItem value="bar-chart">
                          <div className="flex items-center">
                            <BarChart className="w-4 h-4 mr-2" />
                            Project Management
                          </div>
                        </SelectItem>
                        <SelectItem value="hard-hat">
                          <div className="flex items-center">
                            <HardHat className="w-4 h-4 mr-2" />
                            Construction Consultation
                          </div>
                        </SelectItem>
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

              {/* Gallery Images Section - Only show for new services */}
              {!service && (
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
                        {pendingImages.map((img, index) => (
                          <Card key={index} className="overflow-hidden">
                            <div className="aspect-video relative group">
                              <img
                                src={img.previewUrl}
                                alt={`Pending image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePendingImage(index);
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
                    Images will be uploaded to the service gallery when you click "Create Service". They will be displayed on the service pages and marketing materials.
                  </p>
                </div>
              )}
            </form>
          </Form>
        </div>

        {service && (
          <div className="pt-6 border-t mt-8">
            <ServiceGalleryManager 
              serviceId={service.id} 
              ref={galleryManagerRef}
            />
          </div>
        )}
        
        <div className="pt-6 border-t mt-8">
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            className="flex items-center gap-2 w-full md:w-auto"
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {service ? 'Saving Service...' : 'Creating Service...'}
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                {service ? 'Save Service' : 'Create Service'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceManager;
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
import { ArrowLeft, ImageIcon, Loader2, Plus, Trash2, UploadCloud, UploadIcon, XIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import FileUpload from '@/components/common/FileUpload';

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
  
  const [selectedTab, setSelectedTab] = useState("details");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");
  const [newImageOrder, setNewImageOrder] = useState<number>(0);
  const [isAddingImage, setIsAddingImage] = useState(false);
  
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
  
  const handleAddGalleryImage = async () => {
    if (!newImageUrl) {
      return;
    }
    
    setIsAddingImage(true);
    
    try {
      await addGalleryImage({
        imageUrl: newImageUrl,
        caption: newImageCaption || null,
        displayOrder: newImageOrder || 0
      });
      
      // Clear form after successful addition
      setNewImageUrl("");
      setNewImageCaption("");
      setNewImageOrder(0);
    } catch (error) {
      console.error("Error adding gallery image:", error);
    } finally {
      setIsAddingImage(false);
    }
  };
  
  const handleMultipleImagesUpload = async (urls: string | string[]) => {
    if (!Array.isArray(urls)) {
      // Single image was uploaded
      setNewImageUrl(urls as string);
      return;
    }
    
    setIsAddingImage(true);
    
    try {
      // Add each image to the gallery with sequential display order
      for (let i = 0; i < urls.length; i++) {
        await addGalleryImage({
          imageUrl: urls[i],
          caption: `Gallery image ${i + 1}`,
          displayOrder: newImageOrder + i
        });
      }
      
      // Clear form after successful addition
      setNewImageUrl("");
      setNewImageCaption("");
      setNewImageOrder(prev => prev + urls.length);
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
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Project Details</TabsTrigger>
            {projectId && <TabsTrigger value="gallery">Gallery Images</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
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
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Project Image</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <Input 
                            placeholder="Enter image URL" 
                            {...field} 
                          />
                          <div className="mt-2">
                            <p className="text-sm mb-2 text-muted-foreground">Or upload an image directly:</p>
                            <FileUpload 
                              onUploadComplete={(fileUrl) => {
                                if (Array.isArray(fileUrl)) {
                                  // If multiple files were uploaded, just use the first one
                                  field.onChange(fileUrl[0]);
                                } else {
                                  field.onChange(fileUrl);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Provide a URL or upload the main thumbnail image for this project
                      </FormDescription>
                      <FormMessage />
                      {field.value && (
                        <div className="mt-2 border rounded p-2">
                          <p className="text-xs mb-1 font-medium">Preview:</p>
                          <img 
                            src={field.value} 
                            alt="Project thumbnail preview" 
                            className="max-h-[150px] object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = "https://placehold.co/600x400?text=Image+Not+Found";
                            }}
                          />
                        </div>
                      )}
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

                <div className="flex justify-end space-x-4">
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
                      projectId ? 'Updating...' : 'Creating...'
                    ) : (
                      projectId ? 'Update Project' : 'Create Project'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          {projectId && (
            <TabsContent value="gallery" className="space-y-6">
              <div className="max-w-3xl">
                <h2 className="text-xl font-bold mb-4">Project Gallery Images</h2>
                <p className="text-muted-foreground mb-6">
                  Add, edit, or remove gallery images for this project. These images will be displayed in a gallery on the project detail page.
                </p>
                
                {/* Add new gallery image form */}
                <Card className="mb-8">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">Add New Gallery Image</h3>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="imageUrl">Image URL</Label>
                          <Input
                            id="imageUrl"
                            placeholder="Enter image URL"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>Or upload image(s)</Label>
                          <div className="mt-1">
                            <FileUpload 
                              onUploadComplete={handleMultipleImagesUpload}
                              multiple={true}
                            />
                          </div>
                        </div>
                        
                        {newImageUrl && (
                          <div className="mt-2 border rounded p-2">
                            <p className="text-xs mb-1 font-medium">Preview:</p>
                            <img 
                              src={newImageUrl} 
                              alt="Gallery image preview" 
                              className="max-h-[150px] object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = "https://placehold.co/600x400?text=Image+Not+Found";
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="imageCaption">Caption (Optional)</Label>
                        <Input
                          id="imageCaption"
                          placeholder="Enter image caption"
                          value={newImageCaption}
                          onChange={(e) => setNewImageCaption(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="displayOrder">Display Order</Label>
                        <Input
                          id="displayOrder"
                          type="number"
                          min="0"
                          placeholder="Enter display order (0, 1, 2...)"
                          value={newImageOrder}
                          onChange={(e) => setNewImageOrder(parseInt(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleAddGalleryImage}
                        disabled={!newImageUrl || isAddingImage}
                        className="w-full"
                      >
                        {isAddingImage ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding Image...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Gallery Image
                          </span>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Gallery images list */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Gallery Images</h3>
                  {galleryImages.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-muted/20">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No gallery images added yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {galleryImages
                        .sort((a, b) => {
                          // Sort by display order, default to 0 if null
                          const orderA = a.displayOrder !== null ? a.displayOrder : 0;
                          const orderB = b.displayOrder !== null ? b.displayOrder : 0;
                          return orderA - orderB;
                        })
                        .map((image) => (
                          <Card key={image.id} className="overflow-hidden">
                            <div className="relative aspect-video bg-muted">
                              <img 
                                src={image.imageUrl} 
                                alt={image.caption || "Gallery image"} 
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  e.currentTarget.src = "https://placehold.co/600x400?text=Image+Not+Found";
                                }}
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-70 hover:opacity-100"
                                onClick={() => handleDeleteGalleryImage(image.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm truncate">
                                  {image.caption || "No caption"}
                                </span>
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  Order: {image.displayOrder !== null ? image.displayOrder : 0}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
};

export default ProjectForm;

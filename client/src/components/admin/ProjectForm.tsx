import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProject } from '@/hooks/useProject';
import { InsertProject, insertProjectSchema } from '@shared/schema';
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
import { ArrowLeft } from 'lucide-react';

interface ProjectFormProps {
  projectId?: number;
  onClose: () => void;
}

const ProjectForm = ({ projectId, onClose }: ProjectFormProps) => {
  const { project, isLoading, saveProject, isSubmitting } = useProject(projectId);
  
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
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter image URL" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a URL to an image for this project
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
                      checked={field.value}
                      onCheckedChange={field.onChange}
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
      )}
    </div>
  );
};

export default ProjectForm;

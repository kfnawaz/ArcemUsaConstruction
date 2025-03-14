import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Project, InsertProject, ProjectGallery, InsertProjectGallery, ExtendedInsertProject } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export const useProject = (projectId?: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingGalleryImage, setIsDeletingGalleryImage] = useState(false);

  // Fetch single project if ID is provided
  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });
  
  // Fetch project gallery images if ID is provided
  const { data: galleryImages = [] } = useQuery<ProjectGallery[]>({
    queryKey: [`/api/projects/${projectId}/gallery`],
    enabled: !!projectId,
  });
  
  // Log project data when it changes
  useEffect(() => {
    if (project) {
      console.log("Project data loaded:", project);
    }
  }, [project]);

  // Create project mutation
  const createMutation = useMutation<Project, Error, InsertProject>({
    mutationFn: async (data: InsertProject) => {
      return apiRequest<Project>('POST', '/api/projects', data);
    },
    onSuccess: () => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project created",
        description: "The project has been successfully created.",
        variant: "default"
      });
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive"
      });
      console.error("Error creating project:", error);
    }
  });

  // Update project mutation
  const updateMutation = useMutation<Project, Error, { id: number; data: Partial<InsertProject> }>({
    mutationFn: async ({ id, data }) => {
      return apiRequest<Project>('PUT', `/api/projects/${id}`, data);
    },
    onSuccess: () => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      }
      toast({
        title: "Project updated",
        description: "The project has been successfully updated.",
        variant: "default"
      });
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive"
      });
      console.error("Error updating project:", error);
    }
  });

  // Add gallery image mutation
  const addGalleryImageMutation = useMutation<ProjectGallery, Error, { projectId: number; data: Omit<InsertProjectGallery, 'projectId'> }>({
    mutationFn: async ({ projectId, data }) => {
      return apiRequest<ProjectGallery>('POST', `/api/projects/${projectId}/gallery`, data);
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/gallery`] });
      }
      toast({
        title: "Image added",
        description: "The gallery image has been successfully added.",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add gallery image. Please try again.",
        variant: "destructive"
      });
      console.error("Error adding gallery image:", error);
    }
  });

  // Update gallery image mutation
  const updateGalleryImageMutation = useMutation<ProjectGallery, Error, { id: number; data: Partial<InsertProjectGallery> }>({
    mutationFn: async ({ id, data }) => {
      return apiRequest<ProjectGallery>('PUT', `/api/projects/gallery/${id}`, data);
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/gallery`] });
      }
      toast({
        title: "Image updated",
        description: "The gallery image has been successfully updated.",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update gallery image. Please try again.",
        variant: "destructive"
      });
      console.error("Error updating gallery image:", error);
    }
  });

  // Delete gallery image mutation
  const deleteGalleryImageMutation = useMutation<any, Error, number>({
    mutationFn: async (id: number) => {
      return apiRequest<any>('DELETE', `/api/projects/gallery/${id}`);
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/gallery`] });
      }
      toast({
        title: "Image deleted",
        description: "The gallery image has been successfully deleted.",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete gallery image. Please try again.",
        variant: "destructive"
      });
      console.error("Error deleting gallery image:", error);
    }
  });

  const saveProject = async (data: InsertProject) => {
    setIsSubmitting(true);
    if (projectId) {
      await updateMutation.mutateAsync({ id: projectId, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const addGalleryImage = async (data: Omit<InsertProjectGallery, 'projectId'>): Promise<ProjectGallery | undefined> => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "Cannot add gallery image: No project ID provided.",
        variant: "destructive"
      });
      return undefined;
    }
    
    // Return the created gallery image for proper tracking
    return await addGalleryImageMutation.mutateAsync({ projectId, data });
  };

  const updateGalleryImage = async (id: number, data: Partial<InsertProjectGallery>) => {
    await updateGalleryImageMutation.mutateAsync({ id, data });
  };

  const deleteGalleryImage = async (id: number) => {
    try {
      setIsDeletingGalleryImage(true);
      await deleteGalleryImageMutation.mutateAsync(id);
    } finally {
      setIsDeletingGalleryImage(false);
    }
  };

  // Upload file and return URL
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    project,
    galleryImages,
    isLoading,
    isLoadingGallery: isLoading,  // Reuse the same loading state for gallery
    error,
    saveProject,
    isSubmitting,
    addGalleryImage,
    updateGalleryImage,
    deleteGalleryImage,
    uploadFile,
    isDeletingGalleryImage,
    // Alias functions for ProjectGalleryManager compatibility
    projectGallery: galleryImages,
    addProjectGalleryImage: addGalleryImage,
    deleteProjectGalleryImage: deleteGalleryImage
  };
};

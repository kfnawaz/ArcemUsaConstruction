import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Project, InsertProject, ProjectGallery, InsertProjectGallery, ExtendedInsertProject } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export const useProject = (projectId?: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch single project if ID is provided
  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });
  
  // Fetch project gallery images if ID is provided
  const { data: projectGallery = [], isLoading: isLoadingGallery } = useQuery<ProjectGallery[]>({
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
  const createMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      return apiRequest('POST', '/api/projects', data);
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
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProject> }) => {
      return apiRequest('PUT', `/api/projects/${id}`, data);
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
  const addGalleryImageMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number; data: Omit<InsertProjectGallery, 'projectId'> }) => {
      return apiRequest('POST', `/api/projects/${projectId}/gallery`, data);
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
  const updateGalleryImageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProjectGallery> }) => {
      return apiRequest('PUT', `/api/projects/gallery/${id}`, data);
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
  const deleteGalleryImageMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/projects/gallery/${id}`);
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

  const addGalleryImage = async (data: InsertProjectGallery) => {
    if (!projectId && !data.projectId) {
      toast({
        title: "Error",
        description: "Cannot add gallery image: No project ID provided.",
        variant: "destructive"
      });
      return;
    }
    
    await addGalleryImageMutation.mutateAsync({ 
      projectId: data.projectId || projectId as number, 
      data: {
        imageUrl: data.imageUrl,
        caption: data.caption,
        displayOrder: data.displayOrder
      } 
    });
  };

  const updateGalleryImage = async (id: number, data: Partial<InsertProjectGallery>) => {
    // Make sure we're only updating properties that exist in the schema
    const updateData: Partial<InsertProjectGallery> = {};
    
    if (data.caption !== undefined) updateData.caption = data.caption;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    
    await updateGalleryImageMutation.mutateAsync({ id, data: updateData });
  };

  const deleteGalleryImage = async (id: number) => {
    await deleteGalleryImageMutation.mutateAsync(id);
  };

  // Track upload sessions for cleanup
  const [uploadSessions, setUploadSessions] = useState<Set<string>>(new Set());
  
  // Upload file and return URL
  const uploadFile = async (file: File, sessionId?: string): Promise<{ url: string; sessionId: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Generate a session ID if not provided
    const fileSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      // Add sessionId to the request
      const url = new URL('/api/upload', window.location.origin);
      url.searchParams.append('sessionId', fileSessionId);
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      
      // Add to tracked sessions
      setUploadSessions(prev => {
        const updated = new Set(prev);
        updated.add(fileSessionId);
        return updated;
      });
      
      return { 
        url: data.url,
        sessionId: data.sessionId || fileSessionId
      };
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
  
  // Commit the uploads associated with a session
  const commitUploads = async (sessionId: string, fileUrls?: string[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/files/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, fileUrls }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to commit uploads');
      }
      
      const data = await response.json();
      
      // Remove this session from tracked sessions on success
      if (data.success) {
        setUploadSessions(prev => {
          const updated = new Set(prev);
          updated.delete(sessionId);
          return updated;
        });
      }
      
      return data.success;
    } catch (error) {
      console.error('Error committing uploads:', error);
      return false;
    }
  };
  
  // Clean up unused files from a session
  const cleanupUploads = async (sessionId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/files/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to cleanup uploads');
      }
      
      const data = await response.json();
      
      // Remove this session from tracked sessions on success
      if (data.success) {
        setUploadSessions(prev => {
          const updated = new Set(prev);
          updated.delete(sessionId);
          return updated;
        });
      }
      
      return data.success;
    } catch (error) {
      console.error('Error cleaning up uploads:', error);
      return false;
    }
  };

  // Add properties for Gallery state
  const isAddingGalleryImage = addGalleryImageMutation.isPending;
  const isDeletingGalleryImage = deleteGalleryImageMutation.isPending;
  const isUpdatingGalleryImage = updateGalleryImageMutation.isPending;

  // Add functions that are specifically named for project gallery management
  const addProjectGalleryImage = addGalleryImage;
  const deleteProjectGalleryImage = deleteGalleryImage;
  const updateProjectGalleryImage = updateGalleryImage;

  return {
    project,
    projectGallery,
    galleryImages: projectGallery, // Keep for backward compatibility
    isLoading,
    isLoadingGallery,
    error,
    saveProject,
    isSubmitting,
    addGalleryImage,
    updateGalleryImage,
    deleteGalleryImage,
    uploadFile,
    commitUploads,
    cleanupUploads,
    uploadSessions,
    // Add new exports for ProjectGalleryManager
    addProjectGalleryImage,
    deleteProjectGalleryImage,
    updateProjectGalleryImage,
    isAddingGalleryImage,
    isDeletingGalleryImage,
    isUpdatingGalleryImage
  };
};

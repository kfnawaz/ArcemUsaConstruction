import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Project, InsertProject } from '@shared/schema';
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

  const saveProject = async (data: InsertProject) => {
    setIsSubmitting(true);
    if (projectId) {
      await updateMutation.mutateAsync({ id: projectId, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return {
    project,
    isLoading,
    error,
    saveProject,
    isSubmitting
  };
};

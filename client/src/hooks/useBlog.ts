import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { BlogPost, InsertBlogPost } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/utils';

export const useBlog = (postId?: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch single blog post if ID is provided
  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${postId}`],
    enabled: !!postId,
  });

  // Create blog post mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertBlogPost) => {
      // Generate slug if not provided
      if (!data.slug) {
        data.slug = generateSlug(data.title);
      }
      return apiRequest('POST', '/api/blog', data);
    },
    onSuccess: () => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/all'] });
      toast({
        title: "Blog post created",
        description: "The blog post has been successfully created.",
        variant: "default"
      });
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to create blog post. Please try again.",
        variant: "destructive"
      });
      console.error("Error creating blog post:", error);
    }
  });

  // Update blog post mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertBlogPost> }) => {
      // Generate slug if title changed and slug not provided
      if (data.title && !data.slug) {
        data.slug = generateSlug(data.title);
      }
      return apiRequest('PUT', `/api/blog/${id}`, data);
    },
    onSuccess: () => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/all'] });
      if (postId) {
        queryClient.invalidateQueries({ queryKey: [`/api/blog/${postId}`] });
      }
      toast({
        title: "Blog post updated",
        description: "The blog post has been successfully updated.",
        variant: "default"
      });
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to update blog post. Please try again.",
        variant: "destructive"
      });
      console.error("Error updating blog post:", error);
    }
  });

  const saveBlogPost = async (data: InsertBlogPost) => {
    setIsSubmitting(true);
    if (postId) {
      await updateMutation.mutateAsync({ id: postId, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return {
    post,
    isLoading,
    error,
    saveBlogPost,
    isSubmitting
  };
};

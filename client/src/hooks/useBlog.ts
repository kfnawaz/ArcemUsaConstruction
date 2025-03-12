import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { BlogPost, ExtendedInsertBlogPost } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/utils';

// Extended interface for blog post with categories, tags, and gallery images
interface BlogPostWithRelations extends BlogPost {
  categories?: { id: number; name: string; slug: string }[];
  tags?: { id: number; name: string; slug: string }[];
  galleryImages?: {
    id: number;
    postId: number;
    imageUrl: string;
    caption: string | null;
    order: number;
  }[];
}

export const useBlog = (postId?: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingGalleryImage, setIsAddingGalleryImage] = useState(false);
  const [isDeletingGalleryImage, setIsDeletingGalleryImage] = useState(false);

  // Fetch single blog post with categories and tags if ID is provided
  const { data: post, isLoading, error } = useQuery<BlogPostWithRelations>({
    queryKey: [`/api/blog/${postId}`],
    enabled: !!postId,
  });
  
  // Fetch blog post gallery images
  const { data: galleryImages, isLoading: isLoadingGallery } = useQuery({
    queryKey: [`/api/blog/${postId}/gallery`],
    enabled: !!postId,
  });

  // Fetch categories for a post
  const getPostCategoryIds = async (postId: number): Promise<number[]> => {
    try {
      const res = await apiRequest('GET', `/api/blog/${postId}/categories`);
      const categories = await res.json();
      return categories.map((cat: any) => cat.id);
    } catch (error) {
      console.error("Error fetching post categories:", error);
      return [];
    }
  };

  // Fetch tags for a post
  const getPostTagIds = async (postId: number): Promise<number[]> => {
    try {
      const res = await apiRequest('GET', `/api/blog/${postId}/tags`);
      const tags = await res.json();
      return tags.map((tag: any) => tag.id);
    } catch (error) {
      console.error("Error fetching post tags:", error);
      return [];
    }
  };

  // Create blog post mutation
  const createMutation = useMutation({
    mutationFn: async (data: ExtendedInsertBlogPost) => {
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<ExtendedInsertBlogPost> }) => {
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

  const saveBlogPost = async (data: ExtendedInsertBlogPost) => {
    setIsSubmitting(true);
    if (postId) {
      await updateMutation.mutateAsync({ id: postId, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };
  
  // Add gallery image mutation
  const addGalleryImageMutation = useMutation({
    mutationFn: async ({ postId, data }: { postId: number, data: { imageUrl: string, caption: string | null, order: number } }) => {
      return apiRequest('POST', `/api/blog/${postId}/gallery`, data);
    },
    onSuccess: () => {
      setIsAddingGalleryImage(false);
      queryClient.invalidateQueries({ queryKey: [`/api/blog/${postId}/gallery`] });
      
      toast({
        title: "Image added",
        description: "The gallery image has been successfully added.",
        variant: "default"
      });
    },
    onError: (error) => {
      setIsAddingGalleryImage(false);
      toast({
        title: "Error",
        description: "Failed to add gallery image. Please try again.",
        variant: "destructive"
      });
      console.error("Error adding gallery image:", error);
    }
  });
  
  // Delete gallery image mutation
  const deleteGalleryImageMutation = useMutation({
    mutationFn: async (galleryImageId: number) => {
      return apiRequest('DELETE', `/api/blog/gallery/${galleryImageId}`);
    },
    onSuccess: () => {
      setIsDeletingGalleryImage(false);
      queryClient.invalidateQueries({ queryKey: [`/api/blog/${postId}/gallery`] });
      
      toast({
        title: "Image deleted",
        description: "The gallery image has been successfully deleted.",
        variant: "default"
      });
    },
    onError: (error) => {
      setIsDeletingGalleryImage(false);
      toast({
        title: "Error",
        description: "Failed to delete gallery image. Please try again.",
        variant: "destructive"
      });
      console.error("Error deleting gallery image:", error);
    }
  });

  // Helper function to upload a file
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
        throw new Error('Failed to upload file');
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };
  
  // Helper methods for gallery operations
  const addGalleryImage = async (imageUrl: string, caption: string | null = null, order: number = 0) => {
    if (!postId) return;
    
    setIsAddingGalleryImage(true);
    await addGalleryImageMutation.mutateAsync({
      postId,
      data: {
        imageUrl,
        caption,
        order
      }
    });
  };
  
  const deleteGalleryImage = async (galleryImageId: number) => {
    setIsDeletingGalleryImage(true);
    await deleteGalleryImageMutation.mutateAsync(galleryImageId);
  };

  return {
    post,
    isLoading,
    error,
    saveBlogPost,
    isSubmitting,
    getPostCategoryIds,
    getPostTagIds,
    uploadFile,
    galleryImages,
    isLoadingGallery,
    addGalleryImage,
    deleteGalleryImage,
    isAddingGalleryImage,
    isDeletingGalleryImage
  };
};

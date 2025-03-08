import { useQuery, useMutation } from "@tanstack/react-query";
import { Testimonial, InsertTestimonial, PublicTestimonial } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "./use-toast";

export const useTestimonials = () => {
  const { toast } = useToast();

  // Get all approved testimonials (public)
  const {
    data: testimonials = [],
    isLoading: isLoadingTestimonials,
    error: testimonialsError,
  } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  // Get all testimonials (admin only)
  const {
    data: allTestimonials = [],
    isLoading: isLoadingAllTestimonials,
    error: allTestimonialsError,
  } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
  });

  // Get pending testimonials (admin only)
  const {
    data: pendingTestimonials = [],
    isLoading: isLoadingPendingTestimonials,
    error: pendingTestimonialsError,
  } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials/pending"],
  });

  // Submit a new testimonial (public)
  const submitTestimonialMutation = useMutation({
    mutationFn: async (data: PublicTestimonial) => {
      const response = await apiRequest("POST", "/api/testimonials/submit", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Testimonial Submitted",
        description: "Thank you for your testimonial! It will be reviewed by our team before being published.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Submitting Testimonial",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update a testimonial (admin only)
  const updateTestimonialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTestimonial> }) => {
      const response = await apiRequest("PUT", `/api/admin/testimonials/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Testimonial Updated",
        description: "The testimonial has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Testimonial",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve a testimonial (admin only)
  const approveTestimonialMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PUT", `/api/admin/testimonials/${id}/approve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Testimonial Approved",
        description: "The testimonial has been approved and is now visible to the public.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Approving Testimonial",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete a testimonial (admin only)
  const deleteTestimonialMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/testimonials/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Testimonial Deleted",
        description: "The testimonial has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Testimonial",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    testimonials,
    allTestimonials,
    pendingTestimonials,
    
    // Loading states
    isLoadingTestimonials,
    isLoadingAllTestimonials,
    isLoadingPendingTestimonials,
    
    // Error states
    testimonialsError,
    allTestimonialsError,
    pendingTestimonialsError,
    
    // Mutations
    submitTestimonial: submitTestimonialMutation.mutate,
    updateTestimonial: updateTestimonialMutation.mutate,
    approveTestimonial: approveTestimonialMutation.mutate,
    deleteTestimonial: deleteTestimonialMutation.mutate,
    
    // Mutation states
    isSubmitting: submitTestimonialMutation.isPending,
    isUpdating: updateTestimonialMutation.isPending,
    isApproving: approveTestimonialMutation.isPending,
    isDeleting: deleteTestimonialMutation.isPending,
  };
};
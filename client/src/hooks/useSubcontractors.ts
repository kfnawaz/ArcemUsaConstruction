import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Subcontractor, 
  InsertSubcontractor,
  Vendor,
  InsertVendor
} from "@shared/schema";

export const useSubcontractors = () => {
  const { toast } = useToast();

  // For admin: Get all subcontractor applications
  const { 
    data: subcontractors = [], 
    isLoading: isLoadingSubcontractors, 
    error: subcontractorsError 
  } = useQuery<Subcontractor[]>({
    queryKey: ["/api/admin/subcontractors"],
    enabled: false // Only load when explicitly needed in admin pages
  });

  // For admin: Get all vendor applications
  const { 
    data: vendors = [], 
    isLoading: isLoadingVendors, 
    error: vendorsError 
  } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors"],
    enabled: false // Only load when explicitly needed in admin pages
  });

  // Submit subcontractor application
  const submitSubcontractorMutation = useMutation({
    mutationFn: async (data: InsertSubcontractor) => {
      const res = await apiRequest("POST", "/api/subcontractors/apply", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your subcontractor application has been submitted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit subcontractor application. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit vendor application
  const submitVendorMutation = useMutation({
    mutationFn: async (data: InsertVendor) => {
      console.log("Vendor application data in mutation:", data);
      // Ensure supplyTypes is an array
      const vendorData = {
        ...data,
        supplyTypes: Array.isArray(data.supplyTypes) ? data.supplyTypes : [],
      };
      console.log("Processed vendor data:", vendorData);
      const res = await apiRequest("POST", "/api/vendors/apply", vendorData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your vendor application has been submitted successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Vendor application submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit vendor application. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Admin: Update subcontractor status
  const updateSubcontractorStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/admin/subcontractors/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subcontractors"] });
      toast({
        title: "Status Updated",
        description: "Subcontractor application status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Admin: Update subcontractor notes
  const updateSubcontractorNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const res = await apiRequest("PUT", `/api/admin/subcontractors/${id}/notes`, { notes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subcontractors"] });
      toast({
        title: "Notes Updated",
        description: "Subcontractor application notes have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update notes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Admin: Delete subcontractor application
  const deleteSubcontractorMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/subcontractors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subcontractors"] });
      toast({
        title: "Application Deleted",
        description: "Subcontractor application has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete application. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Admin: Update vendor status
  const updateVendorStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/admin/vendors/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      toast({
        title: "Status Updated",
        description: "Vendor application status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Admin: Update vendor notes
  const updateVendorNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const res = await apiRequest("PUT", `/api/admin/vendors/${id}/notes`, { notes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      toast({
        title: "Notes Updated",
        description: "Vendor application notes have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update notes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Admin: Delete vendor application
  const deleteVendorMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      toast({
        title: "Application Deleted",
        description: "Vendor application has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete application. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    subcontractors,
    vendors,
    isLoadingSubcontractors,
    isLoadingVendors,
    subcontractorsError,
    vendorsError,

    // Public actions
    submitSubcontractorApplication: (data: InsertSubcontractor) => 
      submitSubcontractorMutation.mutate(data),
    submitVendorApplication: (data: InsertVendor) => 
      submitVendorMutation.mutate(data),
    
    // Admin actions
    updateSubcontractorStatus: (id: number, status: string) => 
      updateSubcontractorStatusMutation.mutate({ id, status }),
    updateSubcontractorNotes: (id: number, notes: string) => 
      updateSubcontractorNotesMutation.mutate({ id, notes }),
    deleteSubcontractor: (id: number) => 
      deleteSubcontractorMutation.mutate(id),
    updateVendorStatus: (id: number, status: string) => 
      updateVendorStatusMutation.mutate({ id, status }),
    updateVendorNotes: (id: number, notes: string) => 
      updateVendorNotesMutation.mutate({ id, notes }),
    deleteVendor: (id: number) => 
      deleteVendorMutation.mutate(id),
  };
};
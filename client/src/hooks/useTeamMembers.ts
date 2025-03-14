import { useMutation, useQuery } from "@tanstack/react-query";
import { TeamMember, InsertTeamMember } from "@shared/schema";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export const useTeamMembers = (teamMemberId?: number) => {
  const { toast } = useToast();

  // Get all team members
  const { data: teamMembers = [], isLoading: isLoadingTeamMembers } = useQuery({
    queryKey: ['/api/team-members'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get all team members (admin)
  const { data: allTeamMembers = [], isLoading: isLoadingAllTeamMembers } = useQuery({
    queryKey: ['/api/admin/team-members'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get a specific team member (if ID provided)
  const { data: teamMember, isLoading: isLoadingTeamMember } = useQuery({
    queryKey: ['/api/admin/team-members', teamMemberId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!teamMemberId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create team member
  const createTeamMemberMutation = useMutation({
    mutationFn: async (data: InsertTeamMember) => {
      return await apiRequest(
        'POST',
        '/api/admin/team-members',
        data
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team member created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to create team member",
        variant: "destructive",
      });
      console.error("Error creating team member:", error);
    },
  });

  // Update team member
  const updateTeamMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTeamMember> }) => {
      return await apiRequest(
        'PUT',
        `/api/admin/team-members/${id}`,
        data
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team member updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      if (teamMemberId) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members', teamMemberId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update team member",
        variant: "destructive",
      });
      console.error("Error updating team member:", error);
    },
  });

  // Toggle active status
  const toggleActiveStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(
        'PUT',
        `/api/admin/team-members/${id}/toggle-active`
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team member status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      if (teamMemberId) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members', teamMemberId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update team member status",
        variant: "destructive",
      });
      console.error("Error updating team member status:", error);
    },
  });

  // Update order
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, order }: { id: number; order: number }) => {
      return await apiRequest(
        'PUT',
        `/api/admin/team-members/${id}/order`,
        { order }
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team member order updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update team member order",
        variant: "destructive",
      });
      console.error("Error updating team member order:", error);
    },
  });

  // Delete team member
  const deleteTeamMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(
        'DELETE',
        `/api/admin/team-members/${id}`
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team member deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to delete team member",
        variant: "destructive",
      });
      console.error("Error deleting team member:", error);
    },
  });

  // File upload function for profile photos
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  return {
    // Data
    teamMembers,
    allTeamMembers,
    teamMember,
    
    // Loading states
    isLoadingTeamMembers,
    isLoadingAllTeamMembers,
    isLoadingTeamMember,
    isCreatingTeamMember: createTeamMemberMutation.isPending,
    isUpdatingTeamMember: updateTeamMemberMutation.isPending,
    isTogglingActiveStatus: toggleActiveStatusMutation.isPending,
    isUpdatingOrder: updateOrderMutation.isPending,
    isDeletingTeamMember: deleteTeamMemberMutation.isPending,
    
    // Methods
    createTeamMember: (data: InsertTeamMember) => createTeamMemberMutation.mutate(data),
    updateTeamMember: (id: number, data: Partial<InsertTeamMember>) => 
      updateTeamMemberMutation.mutate({ id, data }),
    toggleActiveStatus: (id: number) => toggleActiveStatusMutation.mutate(id),
    updateOrder: (id: number, order: number) => updateOrderMutation.mutate({ id, order }),
    deleteTeamMember: (id: number) => deleteTeamMemberMutation.mutate(id),
    uploadFile,
  };
};
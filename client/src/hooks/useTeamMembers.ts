import { useQuery, useMutation } from '@tanstack/react-query';
import { TeamMember, InsertTeamMember } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
    retry: 1,
    initialData: []
  });
}

export function useAllTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: ['/api/admin/team-members'],
    retry: 1,
    initialData: []
  });
}

export function useTeamMember(id: number) {
  return useQuery<TeamMember | null>({
    queryKey: ['/api/admin/team-members', id],
    enabled: !!id,
    retry: 1,
    initialData: null
  });
}

export function useTeamMembersActions() {
  const { toast } = useToast();

  // Create a team member
  const createTeamMemberMutation = useMutation({
    mutationFn: async (data: InsertTeamMember) => {
      return await apiRequest({
        url: '/api/admin/team-members',
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      toast({
        title: "Success",
        description: "Team member created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update a team member
  const updateTeamMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTeamMember> }) => {
      return await apiRequest({
        url: `/api/admin/team-members/${id}`,
        method: 'PUT',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      toast({
        title: "Success",
        description: "Team member updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle active status
  const toggleActiveStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest({
        url: `/api/admin/team-members/${id}/toggle-active`,
        method: 'PUT'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      toast({
        title: "Success",
        description: "Team member status updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update order
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, order }: { id: number; order: number }) => {
      return await apiRequest({
        url: `/api/admin/team-members/${id}/order`,
        method: 'PUT',
        body: { order }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      toast({
        title: "Success",
        description: "Display order updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update display order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete team member
  const deleteTeamMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest({
        url: `/api/admin/team-members/${id}`,
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      toast({
        title: "Success",
        description: "Team member deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    createTeamMember: (data: InsertTeamMember) => createTeamMemberMutation.mutate(data),
    updateTeamMember: (id: number, data: Partial<InsertTeamMember>) => 
      updateTeamMemberMutation.mutate({ id, data }),
    toggleActiveStatus: (id: number) => toggleActiveStatusMutation.mutate(id),
    updateOrder: (id: number, order: number) => updateOrderMutation.mutate({ id, order }),
    deleteTeamMember: (id: number) => deleteTeamMemberMutation.mutate(id),
    
    isCreating: createTeamMemberMutation.isPending,
    isUpdating: updateTeamMemberMutation.isPending,
    isTogglingActive: toggleActiveStatusMutation.isPending,
    isUpdatingOrder: updateOrderMutation.isPending,
    isDeleting: deleteTeamMemberMutation.isPending,
  };
}
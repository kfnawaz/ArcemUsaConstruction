import { useQuery } from '@tanstack/react-query';
import { TeamMember } from '@shared/schema';

export function useTeamMembers() {
  // Fetch active team members
  const { 
    data: teamMembers, 
    isLoading: isLoadingTeamMembers, 
    error: teamMembersError 
  } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
    refetchOnWindowFocus: false,
  });

  return {
    teamMembers,
    isLoadingTeamMembers,
    teamMembersError
  };
}

export function useAllTeamMembers() {
  // Fetch all team members (for admin)
  const { 
    data: allTeamMembers, 
    isLoading: isLoadingAllTeamMembers, 
    error: allTeamMembersError 
  } = useQuery<TeamMember[]>({
    queryKey: ['/api/admin/team-members'],
    refetchOnWindowFocus: false,
  });

  return {
    allTeamMembers,
    isLoadingAllTeamMembers,
    allTeamMembersError
  };
}

export function useTeamMember(id: number) {
  // Fetch a specific team member
  const { 
    data: teamMember, 
    isLoading: isLoadingTeamMember, 
    error: teamMemberError 
  } = useQuery<TeamMember>({
    queryKey: ['/api/admin/team-members', id],
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  return {
    teamMember,
    isLoadingTeamMember,
    teamMemberError
  };
}
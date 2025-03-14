import { useQuery } from '@tanstack/react-query';
import { TeamMember } from '@shared/schema';

export function useTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
    retry: 1,
  });
}

export function useAllTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: ['/api/admin/team-members'],
    retry: 1,
  });
}

export function useTeamMember(id: number) {
  return useQuery<TeamMember>({
    queryKey: ['/api/admin/team-members', id],
    enabled: !!id,
    retry: 1,
  });
}
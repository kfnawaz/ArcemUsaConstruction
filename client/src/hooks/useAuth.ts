import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  email: string | null;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: () => apiRequest<User>({ url: '/api/user', on401: 'returnNull' }),
  });

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
  };
}
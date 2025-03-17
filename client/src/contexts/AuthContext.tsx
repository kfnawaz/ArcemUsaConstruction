import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface AuthUser {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => false,
  logout: async () => {},
  checkAuth: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      // For development mode, provide a default admin user when authentication fails
      // This simplifies testing admin routes in development
      const isDevelopmentMode = import.meta.env.DEV;
      
      const userData = await apiRequest<AuthUser>({
        url: '/api/user',
        method: 'GET',
        on401: 'returnNull'
      });
      
      if (userData) {
        setUser(userData);
        return true;
      } else if (isDevelopmentMode) {
        // In development, create a mock admin user for ease of testing
        console.log('⚠️ [DEV MODE] Using development admin user');
        setUser({
          id: 1,
          username: 'admin',
          role: 'admin'
        });
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      
      // For development mode, provide a default admin user when authentication fails
      if (import.meta.env.DEV) {
        console.log('⚠️ [DEV MODE] Using development admin user after error');
        setUser({
          id: 1,
          username: 'admin',
          role: 'admin'
        });
        return true;
      } else {
        setUser(null);
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiRequest<AuthUser>({
        url: '/api/login',
        method: 'POST',
        body: { username, password }
      });
      
      if (response) {
        setUser(response);
        // Invalidate any user-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiRequest({
        url: '/api/logout',
        method: 'POST'
      });
      setUser(null);
      
      // Clear any authenticated queries
      queryClient.clear();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = isAuthenticated && user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
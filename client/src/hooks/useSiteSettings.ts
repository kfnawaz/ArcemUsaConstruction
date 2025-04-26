import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { SiteSetting } from '@shared/schema';

export function useSiteSettings() {
  const queryClient = useQueryClient();
  
  const { data: settings = [] as SiteSetting[], isLoading, error } = useQuery<SiteSetting[]>({
    queryKey: ['/api/site-settings'],
    refetchOnWindowFocus: false,
  });

  const createSetting = useMutation({
    mutationFn: async (setting: Omit<SiteSetting, 'id' | 'updatedAt'>) => {
      const response = await apiRequest({
        url: '/api/admin/site-settings',
        method: 'POST',
        body: setting,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ id, ...setting }: Partial<SiteSetting> & { id: number }) => {
      const response = await apiRequest({
        url: `/api/admin/site-settings/${id}`,
        method: 'PUT',
        body: setting,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
    },
  });

  const updateSettingByKey = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiRequest({
        url: `/api/admin/site-settings/key/${key}`,
        method: 'PUT',
        body: { value },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
    },
  });

  const deleteSetting = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest({
        url: `/api/admin/site-settings/${id}`,
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
    },
  });

  const getSocialMediaSettings = () => {
    return settings.filter((setting: SiteSetting) => 
      setting.category === 'social_media'
    );
  };

  const getSettingByKey = (key: string) => {
    return settings.find((setting: SiteSetting) => setting.key === key);
  };

  const getSettingValueByKey = (key: string, defaultValue: string = '') => {
    const setting = settings.find((setting: SiteSetting) => setting.key === key);
    return setting ? setting.value : defaultValue;
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter((setting: SiteSetting) => 
      setting.category === category
    );
  };

  return {
    settings,
    isLoading,
    error,
    createSetting,
    updateSetting,
    updateSettingByKey,
    deleteSetting,
    getSocialMediaSettings,
    getSettingByKey,
    getSettingValueByKey,
    getSettingsByCategory
  };
}
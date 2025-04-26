import { useState } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icons } from '@/components/icons';
import { Label } from '@/components/ui/label';

export function SocialMediaSettings() {
  const { settings, getSocialMediaSettings, updateSettingByKey, isLoading } = useSiteSettings();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when settings are loaded
  useState(() => {
    if (settings.length > 0 && Object.keys(formData).length === 0) {
      const initialData: Record<string, string> = {};
      getSocialMediaSettings().forEach((setting: any) => {
        initialData[setting.key] = setting.value;
      });
      setFormData(initialData);
    }
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const socialMediaSettings = getSocialMediaSettings();
      const updatePromises = socialMediaSettings.map((setting: any) => {
        // Only update if the value has changed
        if (formData[setting.key] !== setting.value) {
          return updateSettingByKey.mutateAsync({
            key: setting.key,
            value: formData[setting.key] || ''
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Settings saved",
        description: "Social media links have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving social media settings:", error);
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your social media links.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSocialIcon = (key: string) => {
    if (key.includes('facebook')) return <Icons.facebook className="mr-2 h-4 w-4" />;
    if (key.includes('twitter')) return <Icons.twitter className="mr-2 h-4 w-4" />;
    if (key.includes('instagram')) return <Icons.instagram className="mr-2 h-4 w-4" />;
    if (key.includes('linkedin')) return <Icons.linkedin className="mr-2 h-4 w-4" />;
    if (key.includes('youtube')) return <Icons.youtube className="mr-2 h-4 w-4" />;
    return <Icons.link className="mr-2 h-4 w-4" />;
  };

  const socialMediaSettings = getSocialMediaSettings();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Links</CardTitle>
        <CardDescription>
          Manage the social media links that appear in the website footer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {socialMediaSettings.map((setting: any) => (
            <div key={setting.id} className="grid gap-2">
              <Label htmlFor={setting.key} className="flex items-center">
                {getSocialIcon(setting.key)}
                {setting.label}
              </Label>
              <Input
                id={setting.key}
                type="url"
                placeholder={`Enter ${setting.label}`}
                value={formData[setting.key] || setting.value}
                onChange={(e) => handleInputChange(setting.key, e.target.value)}
              />
              {setting.description && (
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              )}
            </div>
          ))}
          <CardFooter className="px-0 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
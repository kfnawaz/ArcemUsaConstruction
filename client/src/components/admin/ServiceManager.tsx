import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Service, InsertService } from '@shared/schema';
import { useService } from '@/hooks/useService';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ServiceGalleryManager from './ServiceGalleryManager';
import { Loader2, Save, Building, Home, Wrench, Clipboard, Factory, Settings, PencilRuler, BarChart, HardHat } from 'lucide-react';

// Extend the base schema with client-side validation
const serviceFormSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  icon: z.string(),
  features: z.array(z.string()).min(1, {
    message: 'At least one feature is required',
  }),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceManagerProps {
  service?: Service;
  onSuccess?: () => void;
}

const ServiceManager: React.FC<ServiceManagerProps> = ({ service, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [featureInput, setFeatureInput] = useState('');
  const [featuresList, setFeaturesList] = useState<string[]>(
    service?.features || []
  );

  const {
    createService,
    updateService,
    isCreatingService,
    isUpdatingService,
  } = useService(service?.id);

  // Define form with default values
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: service?.title || '',
      description: service?.description || '',
      icon: service?.icon || 'building',
      features: service?.features || [],
    },
  });

  const isSubmitting = isCreatingService || isUpdatingService;

  // Add feature to the list
  const addFeature = () => {
    if (featureInput.trim()) {
      setFeaturesList([...featuresList, featureInput.trim()]);
      setFeatureInput('');
      form.setValue('features', [...featuresList, featureInput.trim()]);
    }
  };

  // Remove feature from the list
  const removeFeature = (index: number) => {
    const updatedFeatures = featuresList.filter((_, i) => i !== index);
    setFeaturesList(updatedFeatures);
    form.setValue('features', updatedFeatures);
  };

  // Handle form submission
  const onSubmit = (data: ServiceFormValues) => {
    const serviceData: InsertService = {
      title: data.title,
      description: data.description,
      icon: data.icon,
      features: data.features,
    };

    if (service) {
      // Update existing service
      updateService(service.id, serviceData);
    } else {
      // Create new service
      createService(serviceData);
    }

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Service Details</TabsTrigger>
          <TabsTrigger value="gallery" disabled={!service}>
            Gallery Images
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Commercial Construction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the service..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="building" className="flex items-center">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2" />
                            Building
                          </div>
                        </SelectItem>
                        <SelectItem value="home">
                          <div className="flex items-center">
                            <Home className="w-4 h-4 mr-2" />
                            Home
                          </div>
                        </SelectItem>
                        <SelectItem value="tool">
                          <div className="flex items-center">
                            <Wrench className="w-4 h-4 mr-2" />
                            Tool
                          </div>
                        </SelectItem>
                        <SelectItem value="clipboard">
                          <div className="flex items-center">
                            <Clipboard className="w-4 h-4 mr-2" />
                            Clipboard
                          </div>
                        </SelectItem>
                        <SelectItem value="factory">
                          <div className="flex items-center">
                            <Factory className="w-4 h-4 mr-2" />
                            Factory
                          </div>
                        </SelectItem>
                        <SelectItem value="settings">
                          <div className="flex items-center">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </div>
                        </SelectItem>
                        <SelectItem value="pencil-ruler">
                          <div className="flex items-center">
                            <PencilRuler className="w-4 h-4 mr-2" />
                            Architectural Design
                          </div>
                        </SelectItem>
                        <SelectItem value="bar-chart">
                          <div className="flex items-center">
                            <BarChart className="w-4 h-4 mr-2" />
                            Project Management
                          </div>
                        </SelectItem>
                        <SelectItem value="hard-hat">
                          <div className="flex items-center">
                            <HardHat className="w-4 h-4 mr-2" />
                            Construction Consultation
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="features"
                render={() => (
                  <FormItem>
                    <FormLabel>Features</FormLabel>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a feature..."
                          value={featureInput}
                          onChange={(e) => setFeatureInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addFeature();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={addFeature}
                          variant="outline"
                        >
                          Add
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {featuresList.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded-md"
                          >
                            <span>{feature}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFeature(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        {featuresList.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No features added yet. Add features to highlight this service.
                          </p>
                        )}
                      </div>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Service
                  </>
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="gallery" className="mt-6">
          {service ? (
            <ServiceGalleryManager serviceId={service.id} />
          ) : (
            <div className="text-center py-8">
              <p>Save the service details first to manage gallery images.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceManager;
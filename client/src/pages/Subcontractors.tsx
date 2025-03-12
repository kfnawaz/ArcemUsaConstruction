import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { scrollToTop, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useSubcontractors } from '@/hooks/useSubcontractors';

// Form schema
const formSchema = z.object({
  companyName: z.string().min(2, { message: 'Company name is required' }),
  contactName: z.string().min(2, { message: 'Contact name is required' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
  address: z.string().min(2, { message: 'Address is required' }),
  city: z.string().min(2, { message: 'City is required' }),
  state: z.string().min(2, { message: 'State is required' }),
  zip: z.string().min(5, { message: 'ZIP code is required' }),
  website: z.string().optional(),
  serviceTypes: z.array(z.string()).min(1, { message: 'Please select at least one service type' }),
  supplyTypes: z.array(z.string()).min(1, { message: 'Please select at least one product/supply type' }),
  serviceDescription: z.string().min(10, { message: 'Please provide a brief description of your services' }),
  yearsInBusiness: z.string().min(1, { message: 'Years in business is required' }),
  insurance: z.boolean(),
  bondable: z.boolean(),
  licenses: z.string().optional(),
  references: z.string().optional(),
  howDidYouHear: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const Subcontractors = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("subcontractor");
  const { toast } = useToast();
  const [location] = useLocation();
  const { submitSubcontractorApplication, submitVendorApplication } = useSubcontractors();

  // Check for tab parameter in URL
  useEffect(() => {
    // Parse URL query parameters
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    
    // Set active tab if parameter exists and is valid
    if (tabParam === 'vendor') {
      setActiveTab('vendor');
    }
    
    scrollToTop();
    document.title = 'Subcontractors & Vendors - ARCEMUSA';
  }, [location]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      website: '',
      serviceTypes: [],
      supplyTypes: [],
      serviceDescription: '',
      yearsInBusiness: '',
      insurance: false,
      bondable: false,
      licenses: '',
      references: '',
      howDidYouHear: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    console.log("Form submission started", { data, activeTab });
    
    // Log form errors to help debug validation issues
    console.log("Form state:", form.formState);
    if (Object.keys(form.formState.errors).length > 0) {
      console.error("Form has validation errors:", form.formState.errors);
      return; // Don't proceed if there are validation errors
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert form data to the appropriate format based on the active tab
      if (activeTab === "subcontractor") {
        console.log("Preparing subcontractor data", { serviceTypes: data.serviceTypes });
        const subcontractorData = {
          companyName: data.companyName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          website: data.website || undefined,
          serviceTypes: data.serviceTypes,
          serviceDescription: data.serviceDescription,
          yearsInBusiness: data.yearsInBusiness,
          insurance: data.insurance,
          bondable: data.bondable,
          licenses: data.licenses || "",
          references: data.references || "",
          howDidYouHear: data.howDidYouHear || "",
        };
        
        console.log("Submitting subcontractor application", subcontractorData);
        // Submit subcontractor application
        await submitSubcontractorApplication(subcontractorData);
      } else {
        // Vendor application
        console.log("Preparing vendor data", { supplyTypes: data.supplyTypes });
        const vendorData = {
          companyName: data.companyName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          website: data.website || undefined,
          supplyTypes: data.supplyTypes, // This must be an array
          serviceDescription: data.serviceDescription,
          yearsInBusiness: data.yearsInBusiness,
          references: data.references || "",
          howDidYouHear: data.howDidYouHear || "",
        };
        
        console.log("Submitting vendor application", vendorData);
        // Submit vendor application
        await submitVendorApplication(vendorData);
      }
      
      // Reset form after successful submission
      form.reset();
    } catch (error) {
      // Error handling is done in the hook itself with the toast notifications
      console.error("Error submitting application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debug function to test vendor form submission
  const debugVendorSubmit = () => {
    console.log("Debug vendor form submission");
    const data = form.getValues();
    console.log("Form values:", data);
    console.log("Form errors:", form.formState.errors);
    
    // Validate supplyTypes field manually
    if (!data.supplyTypes || !Array.isArray(data.supplyTypes) || data.supplyTypes.length === 0) {
      console.error("supplyTypes validation failed:", data.supplyTypes);
      form.setError("supplyTypes", { 
        type: "manual", 
        message: "Please select at least one product/supply type" 
      });
      return;
    }
    
    // Attempt direct API call
    const vendorData = {
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      website: data.website || undefined,
      supplyTypes: data.supplyTypes,
      serviceDescription: data.serviceDescription,
      yearsInBusiness: data.yearsInBusiness,
      references: data.references || "",
      howDidYouHear: data.howDidYouHear || "",
    };
    
    console.log("Submitting vendor data:", vendorData);
    submitVendorApplication(vendorData);
  };
  
  return (
    <div className="flex flex-col">
      {/* Debug Button */}
      {activeTab === "vendor" && (
        <div className="fixed top-4 right-4 z-50">
          <Button 
            onClick={debugVendorSubmit}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Debug Vendor Form
          </Button>
        </div>
      )}
    
      {/* Hero Section */}
      <div className="relative h-96 flex items-center justify-center bg-gradient-to-r from-gray-900 to-black">
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-white text-5xl md:text-6xl font-montserrat font-bold mb-6">
            Subcontractors & Vendors
          </h1>
          <p className="text-white text-xl md:text-2xl font-light max-w-3xl mx-auto">
            Partner with ARCEMUSA for construction excellence
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue={activeTab} className="mb-12">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="subcontractor" 
                  onClick={() => {
                    console.log("Switching to subcontractor tab");
                    setActiveTab("subcontractor");
                    // Clear any previous errors
                    form.clearErrors();
                    // Reset specific fields for subcontractor form
                    form.setValue("serviceTypes", []);
                  }}
                  className="text-lg font-medium"
                >
                  Subcontractor Registration
                </TabsTrigger>
                <TabsTrigger 
                  value="vendor" 
                  onClick={() => {
                    console.log("Switching to vendor tab");
                    setActiveTab("vendor");
                    // Clear any previous errors
                    form.clearErrors();
                    // Reset specific fields for vendor form
                    form.setValue("supplyTypes", []);
                  }}
                  className="text-lg font-medium"
                >
                  Vendor Registration
                </TabsTrigger>
              </TabsList>
              <TabsContent value="subcontractor" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="mb-8">
                      <h2 className="text-2xl font-montserrat font-bold mb-4">Subcontractor Registration</h2>
                      <p className="text-gray-600">
                        Thank you for your interest in working with ARCEMUSA. Please complete the form below to register as a subcontractor. We will review your information and contact you if there are opportunities that match your services.
                      </p>
                    </div>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your company name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="contactName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="your@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number *</FormLabel>
                                <FormControl>
                                  <Input placeholder="(xxx) xxx-xxxx" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Street address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City *</FormLabel>
                                <FormControl>
                                  <Input placeholder="City" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State *</FormLabel>
                                <FormControl>
                                  <Input placeholder="State" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="zip"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ZIP Code *</FormLabel>
                                <FormControl>
                                  <Input placeholder="ZIP" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://www.yourcompany.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="serviceTypes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Type *</FormLabel>
                              <div className="flex flex-col space-y-4">
                                <div className="flex flex-wrap gap-2">
                                  {field.value.map((service) => (
                                    <Badge key={service} className="py-1.5 px-2 flex items-center gap-1">
                                      {service.charAt(0).toUpperCase() + service.slice(1)}
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0 hover:bg-transparent"
                                        onClick={() => {
                                          const newValue = field.value.filter((s) => s !== service);
                                          field.onChange(newValue);
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </Badge>
                                  ))}
                                </div>
                                <Select
                                  onValueChange={(value) => {
                                    if (!field.value.includes(value)) {
                                      field.onChange([...field.value, value]);
                                    }
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select service type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="concrete">Concrete</SelectItem>
                                    <SelectItem value="carpentry">Carpentry</SelectItem>
                                    <SelectItem value="electrical">Electrical</SelectItem>
                                    <SelectItem value="plumbing">Plumbing</SelectItem>
                                    <SelectItem value="hvac">HVAC</SelectItem>
                                    <SelectItem value="roofing">Roofing</SelectItem>
                                    <SelectItem value="drywall">Drywall</SelectItem>
                                    <SelectItem value="painting">Painting</SelectItem>
                                    <SelectItem value="flooring">Flooring</SelectItem>
                                    <SelectItem value="landscaping">Landscaping</SelectItem>
                                    <SelectItem value="masonry">Masonry</SelectItem>
                                    <SelectItem value="glazing">Glazing</SelectItem>
                                    <SelectItem value="steel">Steel/Metal Work</SelectItem>
                                    <SelectItem value="other">Other (Please specify)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="serviceDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description of Services *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Please provide details about the services your company offers"
                                  className="min-h-[120px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="yearsInBusiness"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years in Business *</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select years in business" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0-1">Less than 1 year</SelectItem>
                                  <SelectItem value="1-3">1-3 years</SelectItem>
                                  <SelectItem value="3-5">3-5 years</SelectItem>
                                  <SelectItem value="5-10">5-10 years</SelectItem>
                                  <SelectItem value="10+">10+ years</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Additional Information</h3>
                          
                          <div className="flex items-center space-x-2">
                            <FormField
                              control={form.control}
                              name="insurance"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>
                                      We carry general liability and workers' compensation insurance
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <FormField
                              control={form.control}
                              name="bondable"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>
                                      We are bondable
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="licenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Licenses & Certifications (optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Please list any relevant licenses or certifications"
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="references"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>References (optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Please provide references from past projects"
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="howDidYouHear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>How did you hear about us? (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Google, Referral, Social Media, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="pt-4">
                          <Button 
                            type="submit" 
                            className="w-full sm:w-auto bg-[#1E90DB] hover:bg-[#1670B0]"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="vendor" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="mb-8">
                      <h2 className="text-2xl font-montserrat font-bold mb-4">Vendor Registration</h2>
                      <p className="text-gray-600">
                        We're always looking for reliable vendors to join our network. Please complete this form to register as a vendor with ARCEMUSA. We will review your information and contact you regarding potential partnerships.
                      </p>
                    </div>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your company name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="contactName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="your@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number *</FormLabel>
                                <FormControl>
                                  <Input placeholder="(xxx) xxx-xxxx" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Street address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City *</FormLabel>
                                <FormControl>
                                  <Input placeholder="City" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State *</FormLabel>
                                <FormControl>
                                  <Input placeholder="State" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="zip"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ZIP Code *</FormLabel>
                                <FormControl>
                                  <Input placeholder="ZIP" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://www.yourcompany.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="supplyTypes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product/Supply Type *</FormLabel>
                              <div className="flex flex-col space-y-4">
                                <div className="flex flex-wrap gap-2">
                                  {field.value.map((supply) => (
                                    <Badge key={supply} className="py-1.5 px-2 flex items-center gap-1">
                                      {supply.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0 hover:bg-transparent"
                                        onClick={() => {
                                          const newValue = field.value.filter((s) => s !== supply);
                                          field.onChange(newValue);
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </Badge>
                                  ))}
                                </div>
                                <Select
                                  onValueChange={(value) => {
                                    if (!field.value.includes(value)) {
                                      field.onChange([...field.value, value]);
                                    }
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select product/supply type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="building-materials">Building Materials</SelectItem>
                                    <SelectItem value="lumber">Lumber</SelectItem>
                                    <SelectItem value="electrical">Electrical Supplies</SelectItem>
                                    <SelectItem value="plumbing">Plumbing Supplies</SelectItem>
                                    <SelectItem value="hvac">HVAC Equipment</SelectItem>
                                    <SelectItem value="tools">Tools & Equipment</SelectItem>
                                    <SelectItem value="hardware">Hardware</SelectItem>
                                    <SelectItem value="concrete">Concrete & Masonry</SelectItem>
                                    <SelectItem value="paint">Paint & Finishes</SelectItem>
                                    <SelectItem value="flooring">Flooring Materials</SelectItem>
                                    <SelectItem value="safety">Safety Equipment</SelectItem>
                                    <SelectItem value="other">Other (Please specify)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="serviceDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description of Products/Services *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Please provide details about the products or services your company offers"
                                  className="min-h-[120px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="yearsInBusiness"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years in Business *</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select years in business" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0-1">Less than 1 year</SelectItem>
                                  <SelectItem value="1-3">1-3 years</SelectItem>
                                  <SelectItem value="3-5">3-5 years</SelectItem>
                                  <SelectItem value="5-10">5-10 years</SelectItem>
                                  <SelectItem value="10+">10+ years</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="references"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client References (optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Please provide references from past clients or projects"
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="howDidYouHear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>How did you hear about us? (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Google, Referral, Social Media, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="pt-4">
                          <Button 
                            type="submit" 
                            className="w-full sm:w-auto bg-[#1E90DB] hover:bg-[#1670B0]"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#1E90DB] py-12">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-white text-3xl font-montserrat font-bold mb-4">
            Join Our Network Today
          </h2>
          <p className="text-white text-lg mb-0 max-w-3xl mx-auto">
            Become a part of ARCEMUSA's trusted network of subcontractors and vendors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subcontractors;
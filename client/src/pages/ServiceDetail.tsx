import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Service, ServiceGallery } from '@shared/schema';
import { scrollToTop } from '@/lib/utils';
import { Building, Home, Wrench, Clipboard, Factory, Settings, ArrowRight, Check } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext 
} from "@/components/ui/carousel";
// Using AutoplayType to avoid TypeScript errors
import Autoplay, { type AutoplayType } from 'embla-carousel-autoplay';
import { apiRequest } from '@/lib/queryClient';
import { useService } from '@/hooks/useService';

const ServiceDetail = () => {
  // Extract service ID from URL
  const [, params] = useRoute('/services/:id/:slug');
  const serviceId = params ? parseInt(params.id) : undefined;
  
  // State for gallery images
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  useEffect(() => {
    scrollToTop();
    // Title will be updated after data is loaded
  }, []);

  // Fetch service data
  const { data: services, isLoading, error } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  
  // Fetch service gallery images
  const { data: serviceGallery, isLoading: isLoadingGallery } = useQuery<ServiceGallery[]>({
    queryKey: ['/api/services', serviceId, 'gallery'],
    queryFn: async () => {
      if (!serviceId) return [];
      const res = await apiRequest('GET', `/api/services/${serviceId}/gallery`);
      return await res.json();
    },
    enabled: !!serviceId,
  });
  
  // Find the specific service data
  const service = services?.find(s => s.id === serviceId);
  
  // Update gallery images when serviceGallery data changes
  useEffect(() => {
    if (serviceGallery && serviceGallery.length > 0) {
      setGalleryImages(serviceGallery.map(item => item.imageUrl));
    }
  }, [serviceGallery]);

  // Update page title when service data is loaded
  useEffect(() => {
    if (service) {
      document.title = `${service.title} - ARCEMUSA`;
    }
  }, [service]);

  // Get icon component based on icon name
  const getIcon = (iconName?: string) => {
    if (!iconName) return <Building className="w-16 h-16" />;
    
    switch (iconName.toLowerCase()) {
      case 'building':
        return <Building className="w-16 h-16" />;
      case 'home':
        return <Home className="w-16 h-16" />;
      case 'tool':
        return <Wrench className="w-16 h-16" />;
      case 'clipboard':
        return <Clipboard className="w-16 h-16" />;
      case 'factory':
        return <Factory className="w-16 h-16" />;
      case 'settings':
        return <Settings className="w-16 h-16" />;
      default:
        return <Building className="w-16 h-16" />;
    }
  };

  // Service-specific content based on service type
  const getServiceDetails = (service: Service) => {
    // Images for each service type
    const getServiceImages = (serviceType: string) => {
      switch (serviceType.toLowerCase()) {
        case 'commercial construction':
          return [
            '/images/commercial1.jpg',
            '/images/commercial2.jpg',
            '/images/commercial3.jpg'
          ];
        case 'residential construction':
          return [
            '/images/residential1.jpg',
            '/images/residential2.jpg',
            '/images/residential3.jpg'
          ];
        case 'renovation & remodeling':
          return [
            '/images/renovation1.jpg',
            '/images/renovation2.jpg',
            '/images/renovation3.jpg'
          ];
        case 'architectural design':
          return [
            '/attached_assets/slider1.png',
            '/attached_assets/slider2.png'
          ];
        case 'project management':
          return [
            '/attached_assets/slider3.png',
            '/attached_assets/slider4.png'
          ];
        case 'construction consultation':
          return [
            '/attached_assets/slider5.png',
            '/attached_assets/image_1741432012642.png'
          ];
        default:
          return [
            '/attached_assets/slider1.png',
            '/attached_assets/slider2.png'
          ];
      }
    };

    // Get detailed service description based on title
    const getServiceDescription = (title: string) => {
      switch (title.toLowerCase()) {
        case 'commercial construction':
          return {
            description: "Our commercial construction services deliver high-quality, functional spaces for businesses of all sizes. From office buildings to retail spaces, we combine architectural excellence with practical functionality to create commercial environments that enhance productivity and leave a lasting impression.",
            features: [
              "Turn-key commercial building solutions",
              "Office and retail space construction",
              "Restaurant and hospitality building projects",
              "Medical facility construction",
              "Educational institution construction",
              "Commercial renovations and expansions"
            ],
            approach: "We approach each commercial project with a focus on efficiency, durability, and your specific business needs. Our team collaborates closely with architects, engineers, and your stakeholders to ensure every detail meets your expectations and building code requirements.",
            benefits: [
              "Cost-effective building solutions",
              "Efficient project management for on-time completion",
              "Energy-efficient design and construction",
              "High-quality materials and craftsmanship",
              "Minimal disruption to surrounding businesses",
              "Long-term structural integrity"
            ]
          };
        case 'residential construction':
          return {
            description: "We build dream homes that reflect your personal style and meet your family's needs. Our residential construction services focus on creating living spaces that combine beauty, functionality, and excellent craftsmanship, resulting in homes you'll love for years to come.",
            features: [
              "Custom home design and construction",
              "Luxury home building services",
              "Multi-family residential projects",
              "Housing development construction",
              "Residential additions and expansions",
              "Energy-efficient home construction"
            ],
            approach: "Our residential construction process begins with understanding your vision, lifestyle needs, and budget. We collaborate with you at every stage, from initial design through construction, ensuring your new home perfectly reflects your personal style and requirements.",
            benefits: [
              "Personalized design and construction process",
              "Quality materials and superior craftsmanship",
              "Energy-efficient building techniques",
              "Transparent communication throughout the project",
              "Attention to detail in every aspect",
              "Built to last for generations"
            ]
          };
        case 'renovation & remodeling':
          return {
            description: "Transform your existing space with our renovation and remodeling services. Whether you're updating a single room or completely renovating an entire property, our team delivers results that enhance functionality, aesthetics, and property value.",
            features: [
              "Complete home renovations",
              "Kitchen and bathroom remodeling",
              "Basement finishing and conversions",
              "Commercial space renovations",
              "Historic building restoration",
              "Structural renovations and repairs"
            ],
            approach: "Our renovation process begins with a thorough assessment of your existing space and a clear understanding of your goals. We develop detailed plans that respect the original structure while incorporating modern improvements and your design preferences.",
            benefits: [
              "Increased property value",
              "Improved functionality and space utilization",
              "Updated aesthetics and design",
              "Enhanced energy efficiency",
              "Modern amenities and features",
              "Preserved architectural character where desired"
            ]
          };
        case 'project planning & design':
          return {
            description: "Our comprehensive planning and design services set the foundation for successful construction projects. We combine creative design thinking with practical construction knowledge to develop plans that are both aesthetically pleasing and buildable within your budget.",
            features: [
              "Architectural design services",
              "Construction planning and feasibility studies",
              "3D modeling and visualizations",
              "Budget development and cost estimating",
              "Permit acquisition assistance",
              "Sustainable design solutions"
            ],
            approach: "We take a collaborative approach to planning and design, working closely with you to understand your vision, needs, and constraints. Our team integrates creative design concepts with practical construction considerations to develop comprehensive plans that guide successful project execution.",
            benefits: [
              "Cohesive vision and design direction",
              "Early identification of potential challenges",
              "Accurate budgeting and cost control",
              "Streamlined construction process",
              "Optimized space utilization",
              "Integrated sustainable design elements"
            ]
          };
        case 'industrial construction':
          return {
            description: "Our industrial construction services deliver robust, efficient facilities designed for manufacturing, processing, storage, and distribution operations. We understand the unique requirements of industrial buildings and create spaces that optimize workflow and operational efficiency.",
            features: [
              "Manufacturing facility construction",
              "Warehouse and distribution center building",
              "Processing plant construction",
              "Industrial facility expansions",
              "Cold storage facility construction",
              "Industrial retrofits and renovations"
            ],
            approach: "We approach industrial projects with a focus on functionality, durability, and operational efficiency. Our team works closely with your operations personnel to understand specific workflows and equipment requirements, incorporating these needs into every aspect of the design and construction process.",
            benefits: [
              "Durable structures built to withstand industrial use",
              "Efficient layout for optimized operations",
              "Compliance with all safety and regulatory requirements",
              "Integration of specialized equipment and systems",
              "Flexible spaces adaptable to changing operations",
              "Energy-efficient building systems"
            ]
          };
        case 'construction management':
          return {
            description: "Our experienced construction management team oversees every aspect of your project from pre-construction planning through completion. We coordinate all activities, manage resources, and ensure quality control to deliver successful projects on time and within budget.",
            features: [
              "Comprehensive project oversight",
              "Schedule development and management",
              "Budget administration and cost control",
              "Subcontractor coordination and management",
              "Quality assurance and control",
              "Risk management and problem resolution"
            ],
            approach: "Our construction management approach combines meticulous planning with proactive oversight. We establish clear communication channels, detailed documentation systems, and regular reporting processes to keep your project running smoothly and all stakeholders informed.",
            benefits: [
              "Single point of responsibility",
              "Reduced administrative burden for owners",
              "Proactive issue identification and resolution",
              "Improved coordination among all parties",
              "Consistent quality control throughout the project",
              "Optimized project schedule and budget performance"
            ]
          };
        default:
          return {
            description: "Our professional construction services deliver quality results for all types of projects. We combine industry expertise with dedicated craftsmanship to create spaces that exceed expectations and stand the test of time.",
            features: [
              "Professional construction services",
              "Expert team of builders and craftsmen",
              "Quality materials and construction methods",
              "Adherence to building codes and regulations",
              "Comprehensive project management",
              "Attention to detail at every stage"
            ],
            approach: "We take a client-centered approach to every project, ensuring your specific needs and preferences guide our work. Our experienced team manages all aspects of the construction process, keeping you informed and involved at every stage.",
            benefits: [
              "High-quality construction results",
              "Professional project management",
              "Excellent communication throughout the process",
              "Adherence to schedule and budget",
              "Durable and functional finished spaces",
              "Comprehensive warranty coverage"
            ]
          };
      }
    };

    const serviceDetails = getServiceDescription(service.title);
    
    // Use gallery images from the API if available, otherwise fall back to hardcoded images
    const serviceImages = galleryImages.length > 0 
      ? galleryImages 
      : getServiceImages(service.title);

    return (
      <>
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="md:w-2/3">
                <div className="mb-8">
                  <h2 className="text-3xl font-montserrat font-bold mb-6">Overview</h2>
                  <p className="text-gray-600 leading-relaxed mb-6">{serviceDetails.description}</p>
                </div>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-montserrat font-bold mb-4">Our Approach</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">{serviceDetails.approach}</p>
                </div>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-montserrat font-bold mb-4">Key Features</h3>
                  <ul className="space-y-2 mb-6">
                    {service.features && service.features.length > 0 ? (
                      service.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="w-5 h-5 text-[#C09E5E] mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))
                    ) : (
                      // Fallback to hard-coded features if none are found in database
                      serviceDetails.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="w-5 h-5 text-[#C09E5E] mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-montserrat font-bold mb-4">Benefits</h3>
                  <ul className="space-y-2">
                    {serviceDetails.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-[#C09E5E] mr-2 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link href="/request-quote" className="bg-[#C09E5E] hover:bg-[#A98D54] text-white py-3 px-8 font-montserrat font-medium text-sm tracking-wider inline-block transition-colors">
                    REQUEST A QUOTE
                  </Link>
                </div>
              </div>
              
              <div className="md:w-1/3">
                <div className="sticky top-24 bg-gray-100 p-6 rounded-lg">
                  <div className="text-[#C09E5E] mb-4">
                    {getIcon(service.icon)}
                  </div>
                  <h3 className="text-xl font-montserrat font-bold mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  
                  <div className="space-y-4 mt-8">
                    <h4 className="font-semibold text-lg">Contact Us</h4>
                    <div className="flex items-center">
                      <span className="mr-2 text-gray-700">Phone:</span>
                      <a href="tel:+1234567890" className="text-[#C09E5E] hover:text-[#A98D54]">(123) 456-7890</a>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 text-gray-700">Email:</span>
                      <a href="mailto:info@arcemusa.com" className="text-[#C09E5E] hover:text-[#A98D54]">info@arcemusa.com</a>
                    </div>
                    <div className="mt-4">
                      <Link href="/contact" className="inline-flex items-center text-[#C09E5E] hover:text-[#A98D54] font-medium">
                        Contact Us
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl font-montserrat font-bold mb-12 text-center">Our {service.title} Projects</h2>
            
            <Carousel 
              className="w-full"
              opts={{
                align: "start",
                loop: true,
                skipSnaps: false,
                dragFree: false,
              }}
              plugins={[
                // Using any to bypass TypeScript error with Autoplay plugin
                Autoplay({
                  delay: 5000,
                  stopOnInteraction: true,
                  stopOnMouseEnter: true,
                }) as any,
              ]}
            >
              <CarouselContent className="p-1">
                {serviceImages.map((img, index) => (
                  <CarouselItem key={index} className="basis-full md:basis-1/3 pl-1 pr-5">
                    <div className="bg-white shadow-lg overflow-hidden hover-scale h-full">
                      <div className="h-64 bg-gray-300 relative overflow-hidden">
                        <img 
                          src={img} 
                          alt={`${service.title} project ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback for missing images
                            e.currentTarget.src = "https://placehold.co/600x400/e2e8f0/1e293b?text=Project+Image";
                          }}
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="font-montserrat font-bold text-lg mb-2">{service.title} Project {index + 1}</h3>
                        <p className="text-gray-600 mb-4">Example {service.title.toLowerCase()} project showcasing our expertise and quality craftsmanship.</p>
                        <Link href="/projects" className="text-[#C09E5E] hover:text-[#A98D54] inline-flex items-center">
                          View More Projects
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:flex justify-end gap-2 mt-4">
                <CarouselPrevious className="static transform-none" />
                <CarouselNext className="static transform-none" />
              </div>
            </Carousel>
          </div>
        </section>
        
        {/* Call To Action */}
        <section className="py-20 bg-black text-white">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-6">Ready to Start Your {service.title} Project?</h2>
              <p className="text-lg mb-8">
                Contact us today to schedule a consultation with our team of experts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact" 
                  className="bg-[#C09E5E] hover:bg-[#A98D54] text-white py-3 px-8 font-montserrat font-medium text-sm tracking-wider inline-block transition-colors"
                >
                  CONTACT US
                </Link>
                <Link
                  href="/request-quote" 
                  className="bg-transparent border border-white hover:bg-white hover:text-black text-white py-3 px-8 font-montserrat font-medium text-sm tracking-wider inline-block transition-colors"
                >
                  REQUEST A QUOTE
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-[#C09E5E]" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="text-3xl font-montserrat font-bold mb-4">Service Not Found</h1>
        <p className="text-gray-600 mb-8 text-center">
          The service you're looking for could not be found or may have been removed.
        </p>
        <Link href="/services" className="bg-[#C09E5E] hover:bg-[#A98D54] text-white py-3 px-8 font-montserrat font-medium text-sm tracking-wider inline-block transition-colors">
          VIEW ALL SERVICES
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Page Banner */}
      <div className="bg-black text-white py-32 relative">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-montserrat font-bold mb-6">{service.title}</h1>
          <p className="text-lg max-w-3xl">
            {service.description}
          </p>
        </div>
      </div>

      {/* Service Content */}
      {getServiceDetails(service)}
    </>
  );
};

export default ServiceDetail;
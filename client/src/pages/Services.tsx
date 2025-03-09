import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { initializeRevealEffects, scrollToTop } from '@/lib/utils';
import { Service } from '@shared/schema';
import { Building, Home, Wrench, Clipboard, Factory, Settings } from 'lucide-react';
import { Link } from 'wouter';

const Services = () => {
  useEffect(() => {
    scrollToTop();
    document.title = 'Services - ARCEMUSA';
    const cleanup = initializeRevealEffects();
    return cleanup;
  }, []);

  const { data: services, isLoading, error } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  // Get icon component based on icon name
  const getIcon = (iconName: string) => {
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

  return (
    <>
      {/* Page Banner */}
      <div className="bg-black text-white py-32 relative">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-montserrat font-bold mb-6">Our Services</h1>
          <p className="text-lg max-w-3xl">
            Comprehensive construction solutions delivered with expertise and dedication to excellence.
          </p>
        </div>
      </div>

      {/* Services Overview */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 reveal">
            <h2 className="text-sm font-montserrat text-[#C09E5E] mb-4">WHAT WE OFFER</h2>
            <h3 className="text-3xl md:text-4xl font-montserrat font-bold mb-6">Comprehensive Construction Solutions</h3>
            <p className="text-gray-600 leading-relaxed">
              At ARCEMUSA, we offer a wide range of construction services tailored to meet the specific needs of each client. Our team of experienced professionals is dedicated to delivering exceptional results that exceed expectations.
            </p>
          </div>

          {isLoading ? (
            // Loading state
            <div className="grid grid-cols-1 gap-12">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="animate-pulse flex flex-col md:flex-row gap-8 items-center">
                  <div className="md:w-1/3 bg-gray-200 h-64 w-full"></div>
                  <div className="md:w-2/3 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              Failed to load services. Please try again later.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-20">
              {services?.map((service, index) => (
                <div 
                  key={service.id}
                  className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center reveal`}
                >
                  <div className="md:w-1/3 bg-gray-100 p-12 flex justify-center items-center">
                    <div className="text-[#C09E5E]">
                      {getIcon(service.icon)}
                    </div>
                  </div>
                  <div className="md:w-2/3">
                    <h4 className="text-2xl font-montserrat font-bold mb-4">{service.title}</h4>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {service.description}
                    </p>
                    <ul className="space-y-2 text-gray-600 mb-6">
                      {service.features && service.features.length > 0 ? (
                        service.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <svg className="w-5 h-5 text-[#C09E5E] mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                          </li>
                        ))
                      ) : (
                        // Fallback to default features if none are provided
                        ['Expert Team of Professionals', 
                        'Quality Materials and Craftsmanship', 
                        'Timely Project Completion', 
                        'Competitive Pricing', 
                        'Attention to Detail'].map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <svg className="w-5 h-5 text-[#C09E5E] mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                          </li>
                        ))
                      )}
                    </ul>
                    
                    <Link 
                      href={`/services/${service.id}/${service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      className="bg-[#C09E5E] hover:bg-[#A98D54] text-white py-2 px-6 font-montserrat font-medium text-sm tracking-wider inline-block transition-colors"
                    >
                      LEARN MORE
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Our Process */}
      <section className="py-20 md:py-32 bg-gray-100">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 reveal">
            <h2 className="text-sm font-montserrat text-[#C09E5E] mb-4">OUR PROCESS</h2>
            <h3 className="text-3xl md:text-4xl font-montserrat font-bold mb-6">How We Work</h3>
            <p className="text-gray-600 leading-relaxed">
              Our streamlined process ensures a smooth experience from initial consultation to project completion.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 shadow-lg hover-scale reveal">
              <div className="w-12 h-12 bg-[#C09E5E] text-white rounded-full flex items-center justify-center font-montserrat font-bold text-xl mb-6">1</div>
              <h4 className="text-xl font-montserrat font-bold mb-4">Consultation</h4>
              <p className="text-gray-600 leading-relaxed">
                We begin with a thorough consultation to understand your vision, needs, and budget. This allows us to provide tailored solutions and accurate estimates.
              </p>
            </div>
            
            <div className="bg-white p-8 shadow-lg hover-scale reveal">
              <div className="w-12 h-12 bg-[#C09E5E] text-white rounded-full flex items-center justify-center font-montserrat font-bold text-xl mb-6">2</div>
              <h4 className="text-xl font-montserrat font-bold mb-4">Planning & Design</h4>
              <p className="text-gray-600 leading-relaxed">
                Our team develops detailed plans and designs that bring your vision to life while addressing practical considerations and regulatory requirements.
              </p>
            </div>
            
            <div className="bg-white p-8 shadow-lg hover-scale reveal">
              <div className="w-12 h-12 bg-[#C09E5E] text-white rounded-full flex items-center justify-center font-montserrat font-bold text-xl mb-6">3</div>
              <h4 className="text-xl font-montserrat font-bold mb-4">Construction</h4>
              <p className="text-gray-600 leading-relaxed">
                We execute the project with precision, adhering to the highest standards of quality and safety while keeping you informed throughout the process.
              </p>
            </div>
            
            <div className="bg-white p-8 shadow-lg hover-scale reveal">
              <div className="w-12 h-12 bg-[#C09E5E] text-white rounded-full flex items-center justify-center font-montserrat font-bold text-xl mb-6">4</div>
              <h4 className="text-xl font-montserrat font-bold mb-4">Completion & Support</h4>
              <p className="text-gray-600 leading-relaxed">
                After the final walkthrough and handover, we provide ongoing support to ensure your complete satisfaction with the delivered project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <div className="max-w-3xl mx-auto reveal">
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-6">Ready to Discuss Your Project?</h2>
            <p className="text-lg mb-8">
              Contact us today to schedule a consultation with our team of experts.
            </p>
            <Link
              href="/contact" 
              className="bg-[#C09E5E] hover:bg-[#A98D54] text-white py-3 px-8 font-montserrat font-medium text-sm tracking-wider inline-block transition-colors"
            >
              CONTACT US
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Services;

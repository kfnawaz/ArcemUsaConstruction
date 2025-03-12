import { useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { scrollToTop } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

const JoinUs = () => {
  useEffect(() => {
    scrollToTop();
    document.title = 'Join Our Team - ARCEMUSA';
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="relative h-96 flex items-center justify-center bg-gradient-to-r from-gray-900 to-black">
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-white text-5xl md:text-6xl font-montserrat font-bold mb-6">
            Join Our Team
          </h1>
          <p className="text-white text-xl md:text-2xl font-light max-w-3xl mx-auto">
            We're committed to building relationships as sturdy as our constructions.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Subcontractors Section */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden transition-transform hover:translate-y-[-10px]">
              <div className="p-8">
                <h2 className="text-2xl font-montserrat font-bold mb-4">Subcontractors</h2>
                <p className="text-gray-600 mb-8">
                  As a trusted partner in the industry, we understand the value of strong 
                  subcontractor relationships in achieving project success. We offer reliable 
                  subcontractor solutions, forging collaborative partnerships with subcontractors 
                  who share our commitment to excellence, quality craftsmanship, and timely project delivery.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-[#1E90DB] hover:bg-[#1670B0]">
                    REGISTER <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-[#1E90DB] text-[#1E90DB] hover:bg-[#1E90DB] hover:text-white">
                    RESOURCES <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Vendors Section */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden transition-transform hover:translate-y-[-10px]">
              <div className="p-8">
                <h2 className="text-2xl font-montserrat font-bold mb-4">Vendors</h2>
                <p className="text-gray-600 mb-8">
                  ARCEMUSA works with a variety of vendors to source the materials and equipment 
                  we need to complete our projects. We value our relationships with our vendors 
                  and are always looking for reliable and professional suppliers to work with us. 
                  If you are a vendor interested in working with ARCEMUSA, please visit our Vendors 
                  page to learn more about our vendor requirements and how to become a preferred vendor.
                </p>
                <Button className="bg-[#1E90DB] hover:bg-[#1670B0]">
                  APPLY NOW <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Careers Section */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden transition-transform hover:translate-y-[-10px]">
              <div className="p-8">
                <h2 className="text-2xl font-montserrat font-bold mb-4">Careers</h2>
                <p className="text-gray-600 mb-8">
                  At ARCEMUSA, we are always looking for talented and passionate individuals to join 
                  our team. We offer a dynamic and challenging work environment, competitive compensation 
                  packages, and opportunities for growth and development. If you are interested in a 
                  career in construction and want to work with a company that values its employees and 
                  supports their success, we invite you to explore our career opportunities.
                </p>
                <Button className="bg-[#1E90DB] hover:bg-[#1670B0]">
                  APPLY NOW <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#1E90DB] py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-white text-3xl md:text-4xl font-montserrat font-bold mb-6">
            Ready to join the ARCEMUSA team?
          </h2>
          <p className="text-white text-lg mb-8 max-w-3xl mx-auto">
            Whether you're a subcontractor, vendor, or looking for a new career opportunity, 
            we would love to hear from you. Join us in building the future.
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-[#1E90DB] hover:bg-gray-100">
              CONTACT US TODAY
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JoinUs;
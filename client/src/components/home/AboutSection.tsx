import { useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { initializeRevealEffects } from '@/lib/utils';
import ImageSlider from './ImageSlider';

const AboutSection = () => {
  useEffect(() => {
    const cleanup = initializeRevealEffects();
    return cleanup;
  }, []);

  return (
    <section id="about" className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/2 reveal">
            <img 
              src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80" 
              alt="Construction site with workers" 
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="md:w-1/2 reveal">
            <h2 className="text-sm font-montserrat text-[#C09E5E] mb-4">ABOUT ARCEMUSA</h2>
            <h3 className="text-3xl md:text-4xl font-montserrat font-bold mb-6">A Tradition of Excellence Since 1985</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              For over three decades, ARCEMUSA has been at the forefront of the construction industry, delivering exceptional quality and innovative solutions for complex projects. Our team of highly skilled professionals brings extensive experience and unwavering commitment to every project we undertake.
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed">
              We pride ourselves on our attention to detail, transparent communication, and the lasting relationships we build with our clients. From concept to completion, we work closely with you to realize your vision and exceed your expectations.
            </p>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-montserrat font-bold text-2xl text-[#C09E5E] mb-2">350+</h4>
                <p className="text-gray-600">Projects Completed</p>
              </div>
              <div>
                <h4 className="font-montserrat font-bold text-2xl text-[#C09E5E] mb-2">45+</h4>
                <p className="text-gray-600">Industry Awards</p>
              </div>
              <div>
                <h4 className="font-montserrat font-bold text-2xl text-[#C09E5E] mb-2">120+</h4>
                <p className="text-gray-600">Team Members</p>
              </div>
              <div>
                <h4 className="font-montserrat font-bold text-2xl text-[#C09E5E] mb-2">38</h4>
                <p className="text-gray-600">Years Experience</p>
              </div>
            </div>
            <Link href="/services">
              <Button variant="black">
                OUR SERVICES
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-16 reveal">
          <h3 className="text-2xl font-montserrat font-bold mb-8 text-center">Our Trusted Clients</h3>
          <ImageSlider className="overflow-hidden" />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

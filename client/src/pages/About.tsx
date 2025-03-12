import { useEffect } from 'react';
import { initializeRevealEffects, scrollToTop } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const About = () => {
  useEffect(() => {
    scrollToTop();
    document.title = 'About Us - ARCEMUSA';
    const cleanup = initializeRevealEffects();
    return cleanup;
  }, []);

  return (
    <>
      {/* Page Banner */}
      <div className="bg-black text-white py-32 relative">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-montserrat font-bold mb-6">About ARCEMUSA</h1>
          <p className="text-lg max-w-3xl">
            We've been building excellence and crafting futures for over three decades.
          </p>
        </div>
      </div>

      {/* Our Story Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2 reveal">
              <img 
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                alt="Construction team discussing plans" 
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="md:w-1/2 reveal">
              <h2 className="text-sm font-montserrat text-[#1E90DB] mb-4">OUR STORY</h2>
              <h3 className="text-3xl md:text-4xl font-montserrat font-bold mb-6">Building Our Legacy Since 1985</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                ARCEMUSA was founded in 1985 with a vision to transform the construction industry through exceptional quality, innovative solutions, and a client-first approach. What began as a small team with big dreams has grown into one of the region's most respected construction companies.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Over the decades, we've completed hundreds of projects across commercial, residential, and industrial sectors, each one reflecting our commitment to excellence and attention to detail. Our success is built on strong relationships with clients, partners, and communities, as well as our dedication to sustainable practices and cutting-edge technology.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Today, ARCEMUSA continues to push boundaries and set new standards in the construction industry, while staying true to our founding principles of integrity, quality, and client satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 md:py-32 bg-gray-100">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 reveal">
            <h2 className="text-sm font-montserrat text-[#1E90DB] mb-4">OUR VALUES</h2>
            <h3 className="text-3xl md:text-4xl font-montserrat font-bold mb-6">What Drives Us Forward</h3>
            <p className="text-gray-600 leading-relaxed">
              Our core values guide everything we do, from how we interact with clients to how we approach each project.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 shadow-lg hover-scale reveal">
              <div className="text-[#1E90DB] mb-6">
                <svg className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-montserrat font-bold mb-4">Excellence</h4>
              <p className="text-gray-600 leading-relaxed">
                We strive for excellence in every aspect of our work, from planning and design to execution and follow-up.
              </p>
            </div>
            
            <div className="bg-white p-8 shadow-lg hover-scale reveal">
              <div className="text-[#1E90DB] mb-6">
                <svg className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-montserrat font-bold mb-4">Collaboration</h4>
              <p className="text-gray-600 leading-relaxed">
                We believe in the power of teamwork and partnership, working closely with clients and partners to achieve shared goals.
              </p>
            </div>
            
            <div className="bg-white p-8 shadow-lg hover-scale reveal">
              <div className="text-[#1E90DB] mb-6">
                <svg className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-montserrat font-bold mb-4">Innovation</h4>
              <p className="text-gray-600 leading-relaxed">
                We continuously seek new technologies, methods, and ideas to deliver better results and exceed expectations.
              </p>
            </div>
            
            <div className="bg-white p-8 shadow-lg hover-scale reveal">
              <div className="text-[#1E90DB] mb-6">
                <svg className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-montserrat font-bold mb-4">Reliability</h4>
              <p className="text-gray-600 leading-relaxed">
                We honor our commitments and deliver on time and within budget, building trust through consistent performance.
              </p>
            </div>
            
            <div className="bg-white p-8 shadow-lg hover-scale reveal">
              <div className="text-[#1E90DB] mb-6">
                <svg className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h4 className="text-xl font-montserrat font-bold mb-4">Sustainability</h4>
              <p className="text-gray-600 leading-relaxed">
                We integrate environmentally responsible practices into our projects, minimizing impact and maximizing resource efficiency.
              </p>
            </div>
            
            <div className="bg-white p-8 shadow-lg hover-scale reveal">
              <div className="text-[#1E90DB] mb-6">
                <svg className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 className="text-xl font-montserrat font-bold mb-4">Safety</h4>
              <p className="text-gray-600 leading-relaxed">
                We prioritize the safety of our team, clients, and the public, maintaining rigorous standards across all operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 reveal">
            <h2 className="text-sm font-montserrat text-[#1E90DB] mb-4">OUR TEAM</h2>
            <h3 className="text-3xl md:text-4xl font-montserrat font-bold mb-6">Meet Our Leadership</h3>
            <p className="text-gray-600 leading-relaxed">
              Our experienced leadership team brings decades of industry expertise and a passion for excellence to every project.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="reveal">
              <img 
                src="https://images.unsplash.com/photo-1569779213435-ba3167ecf3f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80" 
                alt="CEO" 
                className="w-full h-80 object-cover object-center mb-4"
              />
              <h4 className="text-xl font-montserrat font-bold mb-1">Robert Anderson</h4>
              <p className="text-[#1E90DB] font-montserrat mb-3">Chief Executive Officer</p>
              <p className="text-gray-600">
                With over 25 years of experience in construction management, Robert leads our company with vision and strategic direction.
              </p>
            </div>
            
            <div className="reveal">
              <img 
                src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                alt="Operations Director" 
                className="w-full h-80 object-cover object-center mb-4"
              />
              <h4 className="text-xl font-montserrat font-bold mb-1">Maria Rodriguez</h4>
              <p className="text-[#1E90DB] font-montserrat mb-3">Operations Director</p>
              <p className="text-gray-600">
                Maria oversees all operational aspects of our projects, ensuring efficiency, quality, and client satisfaction at every stage.
              </p>
            </div>
            
            <div className="reveal">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                alt="Design Director" 
                className="w-full h-80 object-cover object-center mb-4"
              />
              <h4 className="text-xl font-montserrat font-bold mb-1">Daniel Chen</h4>
              <p className="text-[#1E90DB] font-montserrat mb-3">Design Director</p>
              <p className="text-gray-600">
                Daniel brings innovative design solutions to our projects, blending functionality, aesthetics, and sustainability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-black text-white text-center">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-6 reveal">Ready to Start Your Project?</h2>
          <p className="text-lg max-w-2xl mx-auto mb-10 reveal">
            Let's discuss how ARCEMUSA can bring your construction vision to life with our expertise and dedication to excellence.
          </p>
          <div className="reveal">
            <Link href="/contact">
              <Button variant="gold" size="default">
                CONTACT US TODAY
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;

import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { scrollToElement } from '@/lib/utils';

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // Simulate video loading
    const reveal = document.querySelectorAll('.reveal');
    
    const timeout = setTimeout(() => {
      reveal.forEach((element) => element.classList.add('active'));
    }, 100);
    
    return () => clearTimeout(timeout);
  }, []);
  
  const handleScrollDown = () => {
    scrollToElement('about');
  };

  return (
    <div className="hero-video-container relative h-screen">
      {/* Video background */}
      <div className="absolute inset-0 z-0 bg-gray-900">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay 
          muted 
          loop 
          playsInline
          poster="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
          aria-label="Construction site timelapse video showing building progress" 
          title="ARCEMUSA construction showcase video"
        >
          <source 
            src="https://player.vimeo.com/progressive_redirect/playback/699037999/rendition/1080p/file.mp4?loc=external&signature=0ec2fce3f32cdeb285c7c78a7f9bd89ca63f58906e037f8a8473ddc33e7617aa" 
            type="video/mp4" 
          />
          Your browser does not support the video tag.
        </video>
      </div>
      
      {/* Overlay */}
      <div className="hero-overlay absolute inset-0 z-10"></div>
      
      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 h-full flex flex-col justify-center">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl text-white font-montserrat font-bold leading-tight mb-6 reveal">
            Building Excellence, <br/>Crafting Futures
          </h1>
          <p className="text-white text-lg md:text-xl mb-8 reveal" style={{animationDelay: '0.2s'}}>
            ARCEMUSA is a premier construction company delivering exceptional quality and innovative solutions for complex projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 reveal" style={{animationDelay: '0.4s'}}>
            <Link href="/contact">
              <Button variant="gold">
                CONTACT US
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="white">
                VIEW PROJECTS
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center">
        <button 
          onClick={handleScrollDown}
          className="text-white animate-bounce p-2"
          aria-label="Scroll down"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default HeroSection;

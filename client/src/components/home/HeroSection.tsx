import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { scrollToElement } from "@/lib/utils";

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const heroContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate content reveal
    const reveal = document.querySelectorAll(".reveal");
    const timeout = setTimeout(() => {
      reveal.forEach((element) => element.classList.add("active"));
    }, 100);

    // Add event listener for first user interaction
    const handleUserInteraction = () => {
      setShowVideo(true);
      
      // Start the video
      if (videoRef.current) {
        videoRef.current.play().catch(err => {
          console.error('Video playback failed:', err);
        });
      }
      
      // Remove event listeners after first interaction
      if (heroContainerRef.current) {
        heroContainerRef.current.removeEventListener('mousemove', handleUserInteraction);
        heroContainerRef.current.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('scroll', handleUserInteraction);
      }
    };
    
    // Add event listeners for user interaction
    if (heroContainerRef.current) {
      heroContainerRef.current.addEventListener('mousemove', handleUserInteraction);
      heroContainerRef.current.addEventListener('click', handleUserInteraction);
      document.addEventListener('scroll', handleUserInteraction);
    }
    
    return () => {
      clearTimeout(timeout);
      // Cleanup event listeners
      if (heroContainerRef.current) {
        heroContainerRef.current.removeEventListener('mousemove', handleUserInteraction);
        heroContainerRef.current.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('scroll', handleUserInteraction);
      }
    };
  }, []);

  const handleScrollDown = () => {
    scrollToElement("about");
  };

  return (
    <div ref={heroContainerRef} className="hero-video-container relative h-screen">
      {/* Background media - starts with image, switches to video on user interaction */}
      <div className="absolute inset-0 z-0 bg-gray-900">
        {/* Static image (visible initially) */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${showVideo ? 'opacity-0' : 'opacity-100'}`}>
          <img 
            src="/images/projects.webp" 
            alt="ARCEMUSA construction projects showcase" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Video (loads in background, visible after user interaction) */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
          preload="auto"
          muted
          loop
          playsInline
          poster="/images/projects.webp"
          aria-label="Construction site timelapse video showing building progress"
          title="ARCEMUSA construction showcase video"
        >
          <source
            src="/videos/file.mp4"
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
            Building Excellence, <br />
            Crafting Futures
          </h1>
          <p
            className="text-white text-lg md:text-xl mb-8 reveal"
            style={{ animationDelay: "0.2s" }}
          >
            ARCEMUSA is a premier construction company delivering exceptional
            quality and innovative solutions for complex projects.
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 reveal"
            style={{ animationDelay: "0.4s" }}
          >
            <Link href="/contact">
              <Button variant="gold">CONTACT US</Button>
            </Link>
            <Link href="/projects">
              <Button variant="white">VIEW PROJECTS</Button>
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

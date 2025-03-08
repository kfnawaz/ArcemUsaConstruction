import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { scrollToElement } from "@/lib/utils";

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate content reveal
    const reveal = document.querySelectorAll(".reveal");
    const timeout = setTimeout(() => {
      reveal.forEach((element) => element.classList.add("active"));
    }, 100);

    // Function to handle user interaction and load video
    const handleUserInteraction = () => {
      if (showVideo) return; // Only trigger once
      
      console.log("User interaction detected, loading video");
      setShowVideo(true);
      
      // Play the video if it's loaded
      if (videoRef.current) {
        videoRef.current.play().catch(err => {
          console.error('Video playback failed:', err);
        });
      }
      
      // Remove all event listeners after first interaction
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
    
    // Add event listeners to window for better detection
    window.addEventListener('mousemove', handleUserInteraction);
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('scroll', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      clearTimeout(timeout);
      
      // Clean up event listeners
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [showVideo]);

  const handleScrollDown = () => {
    scrollToElement("about");
  };

  return (
    <div ref={containerRef} className="hero-video-container relative h-screen overflow-hidden">
      {/* Background media container */}
      <div className="absolute inset-0 z-0 bg-gray-900">
        {/* Static image (shown first) */}
        <img 
          src="/images/projects.webp" 
          alt="ARCEMUSA construction projects showcase" 
          className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-700 ${showVideo ? 'opacity-0' : 'opacity-100'}`}
        />
        
        {/* Video (loaded after user interaction) */}
        {showVideo && (
          <video
            ref={videoRef}
            className="w-full h-full object-cover absolute inset-0 transition-opacity duration-700"
            autoPlay
            muted
            loop
            playsInline
            aria-label="Construction site timelapse video showing building progress"
          >
            <source src="/videos/file.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
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

import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { initializeRevealEffects } from '@/lib/utils';
import TestimonialCard from '@/components/common/TestimonialCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Testimonial } from '@shared/schema';

const TestimonialsSection = () => {
  const { data: testimonials, isLoading, error } = useQuery<Testimonial[]>({
    queryKey: ['/api/testimonials'],
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const [totalSlides, setTotalSlides] = useState(0);

  useEffect(() => {
    if (testimonials) {
      setTotalSlides(testimonials.length);
    }
  }, [testimonials]);

  useEffect(() => {
    const cleanup = initializeRevealEffects();
    return cleanup;
  }, []);

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    } else {
      setCurrentSlide(totalSlides - 1);
    }
  };

  const handleNextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setCurrentSlide(0);
    }
  };

  useEffect(() => {
    // Auto scroll testimonials
    const interval = setInterval(() => {
      handleNextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentSlide, totalSlides]);

  useEffect(() => {
    if (slideContainerRef.current && testimonials && testimonials.length > 0) {
      // Calculate slide width (including padding)
      const slideWidth = slideContainerRef.current.children[0].clientWidth;
      
      // Apply transformation
      slideContainerRef.current.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
    }
  }, [currentSlide, testimonials]);

  if (error) {
    console.error('Error loading testimonials:', error);
  }

  return (
    <section className="py-20 md:py-32 bg-gray-100">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 reveal">
          <h2 className="text-sm font-montserrat text-[#C09E5E] mb-4">TESTIMONIALS</h2>
          <h3 className="text-3xl md:text-4xl font-montserrat font-bold mb-6">What Our Clients Say</h3>
          <p className="text-gray-600 leading-relaxed">
            Hear from our satisfied clients about their experience working with ARCEMUSA on their construction projects.
          </p>
        </div>
        
        <div className="testimonial-slider overflow-hidden relative reveal">
          {isLoading ? (
            // Loading state
            <div className="flex">
              {Array(3).fill(0).map((_, index) => (
                <div key={index} className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-4">
                  <div className="bg-white p-8 shadow-lg h-full animate-pulse">
                    <div className="h-40 bg-gray-200 mb-4"></div>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
                      <div>
                        <div className="h-4 w-24 bg-gray-200 mb-2"></div>
                        <div className="h-3 w-16 bg-gray-200"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="text-center text-red-500 p-8">
              Failed to load testimonials. Please try again later.
            </div>
          ) : (
            // Render actual testimonials
            <div 
              id="testimonials-container" 
              ref={slideContainerRef}
              className="flex transition-transform duration-500"
            >
              {testimonials?.map((testimonial) => (
                <TestimonialCard 
                  key={testimonial.id}
                  name={testimonial.name}
                  position={testimonial.position}
                  company={testimonial.company || ''}
                  content={testimonial.content}
                  rating={testimonial.rating}
                  image={testimonial.image || ''}
                />
              ))}
            </div>
          )}
          
          <button 
            id="prev-testimonial" 
            className="absolute top-1/2 left-4 -translate-y-1/2 bg-white p-2 rounded-full shadow-md text-[#C09E5E] hover:text-[#A98D54] focus:outline-none"
            onClick={handlePrevSlide}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            id="next-testimonial" 
            className="absolute top-1/2 right-4 -translate-y-1/2 bg-white p-2 rounded-full shadow-md text-[#C09E5E] hover:text-[#A98D54] focus:outline-none"
            onClick={handleNextSlide}
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

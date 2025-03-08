import React, { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import TestimonialCard from "@/components/common/TestimonialCard";
import TestimonialForm from "@/components/common/TestimonialForm";
import { useTestimonials } from "@/hooks/useTestimonials";
import { AlertCircle, MessageSquarePlus, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Testimonial } from "@shared/schema";

const TestimonialsSection = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { testimonials: testimonialsData, isLoadingTestimonials } = useTestimonials();
  const testimonials: Testimonial[] = Array.isArray(testimonialsData) ? testimonialsData : [];
  const testimonialsError = null; // We'll simplify error handling for now
  
  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };

  if (isLoadingTestimonials) {
    return (
      <section className="py-16 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from our satisfied clients about their experiences working with ARCEMUSA Construction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg p-6 h-64">
                <div className="flex items-center mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="ml-4 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (testimonialsError) {
    return (
      <section className="py-16 bg-secondary/5">
        <div className="container mx-auto px-4">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Unable to load testimonials. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  if (!testimonials || testimonials.length === 0) {
    return null; // Don't show the section if there are no testimonials
  }

  return (
    <section className="py-16 bg-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Clients Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
            Hear from our satisfied clients about their experiences working with ARCEMUSA Construction.
          </p>
          
          <Button 
            onClick={toggleForm} 
            className="mt-2"
            variant="outline" 
            size="lg"
          >
            <MessageSquarePlus className="mr-2 h-5 w-5" />
            {isFormOpen ? "Close Form" : "Share Your Experience"}
            {isFormOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        {isFormOpen && (
          <div className="max-w-2xl mx-auto mb-12 bg-card rounded-lg shadow-md p-6 border border-border">
            <h3 className="text-xl font-bold mb-4">Submit Your Testimonial</h3>
            <TestimonialForm onSuccess={() => setIsFormOpen(false)} />
          </div>
        )}

        {testimonials.length <= 3 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                name={testimonial.name}
                position={testimonial.position || 'Client'}
                company={testimonial.company || 'Happy Customer'}
                content={testimonial.content}
                rating={testimonial.rating}
                image={testimonial.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=random`}
              />
            ))}
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="md:basis-1/3 p-2">
                  <TestimonialCard
                    name={testimonial.name}
                    position={testimonial.position || 'Client'}
                    company={testimonial.company || 'Happy Customer'}
                    content={testimonial.content}
                    rating={testimonial.rating}
                    image={testimonial.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=random`}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-8">
              <CarouselPrevious className="relative static mr-2" />
              <CarouselNext className="relative static" />
            </div>
          </Carousel>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
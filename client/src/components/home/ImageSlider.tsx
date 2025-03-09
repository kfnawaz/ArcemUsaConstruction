import { useEffect, useState } from 'react';

interface ImageSliderProps {
  className?: string;
}

const ImageSlider = ({ className = '' }: ImageSliderProps) => {
  const [sliderImages, setSliderImages] = useState<string[]>([]);
  
  useEffect(() => {
    // Project portfolio images
    const images = [
      '/slider/slide1.jpg',
      '/slider/slide2.jpg',
      '/slider/slide3.jpg',
      '/slider/slide4.jpg',
      '/slider/slide5.jpg',
      '/slider/slide6.jpg',
      '/slider/slide7.jpg',
      '/slider/slide8.jpg',
    ];
    
    setSliderImages(images);
  }, []);

  if (sliderImages.length === 0) {
    return null;
  }

  return (
    <div className={`image-slider-container ${className}`}>
      <div className="slider-track flex">
        {/* First set of images */}
        {sliderImages.map((image, index) => (
          <div 
            key={`slide-${index}`} 
            className="slider-item flex-shrink-0 min-w-[180px] sm:min-w-[220px] md:min-w-[250px] h-24 sm:h-28 md:h-32 mx-2 transform transition-all duration-300 hover:scale-110"
          >
            <img 
              src={image} 
              alt={`ARCEMUSA Project ${index + 1}`} 
              className="w-full h-full object-cover rounded-md shadow-lg border border-amber-300/30"
              loading="lazy"
            />
          </div>
        ))}
        
        {/* Duplicate the images for continuous scroll effect */}
        {sliderImages.map((image, index) => (
          <div 
            key={`slide-dup-${index}`} 
            className="slider-item flex-shrink-0 min-w-[180px] sm:min-w-[220px] md:min-w-[250px] h-24 sm:h-28 md:h-32 mx-2 transform transition-all duration-300 hover:scale-110"
          >
            <img 
              src={image} 
              alt={`ARCEMUSA Project ${index + 1}`} 
              className="w-full h-full object-cover rounded-md shadow-lg border border-amber-300/30"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
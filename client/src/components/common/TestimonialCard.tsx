import { Star } from 'lucide-react';

interface TestimonialCardProps {
  name: string;
  position: string;
  company: string;
  content: string;
  rating: number;
  image: string;
}

const TestimonialCard = ({ name, position, company, content, rating, image }: TestimonialCardProps) => {
  // Generate star rating elements
  const renderStars = () => {
    return Array(rating).fill(0).map((_, index) => (
      <Star key={index} className="w-5 h-5" fill="currentColor" />
    ));
  };

  // Format position and company
  const formattedPosition = company 
    ? `${position}, ${company}` 
    : position;

  return (
    <div className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-4">
      <div className="bg-white p-8 shadow-lg h-full">
        <div className="flex items-center mb-6">
          <div className="text-[#C09E5E]">
            <div className="flex">
              {renderStars()}
            </div>
          </div>
        </div>
        <p className="text-gray-600 mb-6 italic leading-relaxed">
          "{content}"
        </p>
        <div className="flex items-center">
          <div className="mr-4">
            <img 
              src={image || "https://via.placeholder.com/48"} 
              alt={name} 
              className="w-12 h-12 rounded-full object-cover"
            />
          </div>
          <div>
            <h5 className="font-montserrat font-bold">{name}</h5>
            <p className="text-gray-600 text-sm">{formattedPosition}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;

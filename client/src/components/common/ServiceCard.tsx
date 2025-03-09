import { ArrowRight } from 'lucide-react';
import { Building, Home, Wrench, Clipboard, Factory, Settings } from 'lucide-react';
import { Link } from 'wouter';

interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
  id: number;
}

const ServiceCard = ({ icon, title, description, id }: ServiceCardProps) => {
  const getIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'building':
        return <Building className="w-10 h-10" />;
      case 'home':
        return <Home className="w-10 h-10" />;
      case 'tool':
        return <Wrench className="w-10 h-10" />;
      case 'clipboard':
        return <Clipboard className="w-10 h-10" />;
      case 'factory':
        return <Factory className="w-10 h-10" />;
      case 'settings':
        return <Settings className="w-10 h-10" />;
      default:
        return <Building className="w-10 h-10" />;
    }
  };

  // Create URL-friendly slug from the title
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div className="bg-white p-8 shadow-lg hover-scale reveal">
      <div className="text-[#C09E5E] mb-6">
        {getIcon(icon)}
      </div>
      <h4 className="text-xl font-montserrat font-bold mb-4">{title}</h4>
      <p className="text-gray-600 mb-6 leading-relaxed">
        {description}
      </p>
      <Link href={`/services/${id}/${slug}`} className="text-[#C09E5E] hover:text-[#A98D54] font-montserrat text-sm font-medium inline-flex items-center cursor-pointer">
        LEARN MORE
        <ArrowRight className="w-4 h-4 ml-2" />
      </Link>
    </div>
  );
};

export default ServiceCard;

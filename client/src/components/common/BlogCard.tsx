import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  category: string;
}

const BlogCard = ({ slug, title, excerpt, imageUrl, date, category }: BlogCardProps) => {
  return (
    <div className="bg-white shadow-lg hover-scale reveal">
      <div className="overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-60 object-cover transition-transform duration-500 hover:scale-110"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span>{date}</span>
          <span className="mx-2">•</span>
          <span>{category}</span>
        </div>
        <h4 className="text-xl font-montserrat font-bold mb-4">{title}</h4>
        <p className="text-gray-600 mb-6 leading-relaxed">
          {excerpt}
        </p>
        <Link href={`/blog/${slug}`}>
          <a className="text-[#C09E5E] hover:text-[#A98D54] font-montserrat text-sm font-medium inline-flex items-center">
            READ MORE
            <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </Link>
      </div>
    </div>
  );
};

export default BlogCard;

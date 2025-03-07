import { Link } from 'wouter';

interface ProjectCardProps {
  id: number;
  title: string;
  category: string;
  imageUrl: string;
}

const ProjectCard = ({ id, title, category, imageUrl }: ProjectCardProps) => {
  return (
    <div className="project-card relative overflow-hidden group shadow-lg reveal">
      <img 
        src={imageUrl} 
        alt={title} 
        className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="project-overlay absolute inset-0 flex flex-col justify-center items-center p-6 text-white">
        <h4 className="text-xl font-montserrat font-bold mb-2">{title}</h4>
        <p className="text-center mb-4">{category}</p>
        <Link href={`/projects/${id}`} className="border border-white text-white py-2 px-6 font-montserrat text-sm tracking-wider inline-block hover:bg-white hover:text-black transition-colors">
          VIEW PROJECT
        </Link>
      </div>
    </div>
  );
};

export default ProjectCard;

import { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Project, ProjectGallery } from '@shared/schema';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, ImageIcon, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initializeRevealEffects, scrollToTop, formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ProjectDetail = () => {
  const [, params] = useRoute('/projects/:id');
  const projectId = params?.id ? parseInt(params.id) : 0;
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    scrollToTop();
    const cleanup = initializeRevealEffects();
    return cleanup;
  }, [projectId]);

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });
  
  // Fetch project gallery images
  const { data: galleryImages = [] } = useQuery<ProjectGallery[]>({
    queryKey: [`/api/projects/${projectId}/gallery`],
    enabled: !!projectId,
  });
  
  // Sort gallery images by display order
  const sortedGalleryImages = [...galleryImages].sort((a, b) => {
    const orderA = a.displayOrder !== null ? a.displayOrder : 0;
    const orderB = b.displayOrder !== null ? b.displayOrder : 0;
    return orderA - orderB;
  });

  const openGallery = (index: number) => {
    setCurrentImageIndex(index);
    setGalleryOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === sortedGalleryImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? sortedGalleryImages.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    if (project) {
      document.title = `${project.title} - ARCEMUSA Projects`;
    } else {
      document.title = 'Project Details - ARCEMUSA';
    }
  }, [project]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 w-1/2 mb-8"></div>
            <div className="h-96 bg-gray-200 w-full mb-8"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 w-full"></div>
              <div className="h-4 bg-gray-200 w-full"></div>
              <div className="h-4 bg-gray-200 w-5/6"></div>
              <div className="h-4 bg-gray-200 w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-white">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="text-3xl font-montserrat font-bold mb-4">Project Not Found</h1>
          <p className="text-gray-600 mb-8">
            The project you're looking for doesn't exist or there was an error loading it.
          </p>
          <Link href="/projects">
            <Button variant="black">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-8">
          <Link href="/projects">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-montserrat font-bold mb-4 reveal">{project.title}</h1>
          
          <div className="flex flex-wrap gap-4 mb-8 reveal">
            <div className="flex items-center text-gray-500">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{formatDate(project.createdAt)}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Tag className="w-4 h-4 mr-2" />
              <span>{project.category}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          <div className="lg:col-span-2 reveal">
            <img 
              src={project.image} 
              alt={project.title} 
              className="w-full h-auto object-cover mb-8 shadow-lg"
            />
            <div className="prose max-w-none">
              <p className="text-gray-600 leading-relaxed mb-6">
                {project.description}
              </p>
              
              {/* Additional project details - these would come from the API in a real implementation */}
              <h2 className="text-2xl font-montserrat font-bold mt-8 mb-4">Project Overview</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Our team was tasked with delivering a state-of-the-art {project.category.toLowerCase()} that met the highest standards of quality, functionality, and aesthetic appeal. The project required careful planning, innovative solutions, and meticulous execution to overcome various challenges and meet the client's specific requirements.
              </p>

              <h2 className="text-2xl font-montserrat font-bold mt-8 mb-4">Challenges & Solutions</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                One of the main challenges was integrating modern design elements while maintaining the structural integrity of the building. Our team of experts collaborated closely with architects and engineers to develop innovative solutions that balanced aesthetic considerations with practical requirements.
              </p>

              <h2 className="text-2xl font-montserrat font-bold mt-8 mb-4">Results</h2>
              <p className="text-gray-600 leading-relaxed">
                The completed project exceeded the client's expectations, delivering a functional, aesthetically pleasing space that met all specifications. The project was completed on time and within budget, showcasing our commitment to excellence and client satisfaction.
              </p>
            </div>
          </div>

          <div className="lg:col-span-1 reveal">
            <div className="bg-gray-100 p-8 mb-8">
              <h3 className="text-xl font-montserrat font-bold mb-6">Project Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-montserrat font-semibold text-gray-700">Client</h4>
                  <p className="text-gray-600">XYZ Corporation</p>
                </div>
                <div>
                  <h4 className="font-montserrat font-semibold text-gray-700">Location</h4>
                  <p className="text-gray-600">New York, NY</p>
                </div>
                <div>
                  <h4 className="font-montserrat font-semibold text-gray-700">Project Size</h4>
                  <p className="text-gray-600">25,000 sq ft</p>
                </div>
                <div>
                  <h4 className="font-montserrat font-semibold text-gray-700">Completion</h4>
                  <p className="text-gray-600">{formatDate(project.createdAt)}</p>
                </div>
                <div>
                  <h4 className="font-montserrat font-semibold text-gray-700">Services Provided</h4>
                  <p className="text-gray-600">Design, Construction, Project Management</p>
                </div>
              </div>
            </div>

            <div className="bg-black text-white p-8">
              <h3 className="text-xl font-montserrat font-bold mb-6">Ready to Start Your Project?</h3>
              <p className="mb-6">Contact us today to discuss how we can bring your vision to life.</p>
              <Link href="/contact">
                <Button variant="gold" className="w-full">
                  CONTACT US
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Related Projects Section */}
        <div className="mt-16 reveal">
          <h2 className="text-2xl font-montserrat font-bold mb-8">Related Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* This would use actual related projects from the API in a real implementation */}
            {[1, 2, 3].map((_, index) => (
              <Link key={index} href={`/projects/${(projectId % 6) + index + 1}`}>
                <a className="group block overflow-hidden shadow-lg">
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={`https://images.unsplash.com/photo-151968714593${index}-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`} 
                      alt="Related Project" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white font-montserrat font-medium">View Project</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-montserrat font-bold">Similar {project.category} Project</h3>
                    <p className="text-gray-600 text-sm">Another exceptional project in our portfolio</p>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;

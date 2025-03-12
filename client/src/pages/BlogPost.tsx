import { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { BlogPost as BlogPostType, BlogGallery } from '@shared/schema';
import { initializeRevealEffects, scrollToTop, formatDate } from '@/lib/utils';
import { ArrowLeft, Calendar, Tag, User, Image as ImageIcon, X } from 'lucide-react';
import BlogPostSeo from '@/components/seo/BlogPostSeo';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogHeader,
  DialogFooter
} from '@/components/ui/dialog';

const BlogPost = () => {
  const [, params] = useRoute('/blog/:slug');
  const slug = params?.slug;
  const [selectedImage, setSelectedImage] = useState<{ url: string; caption: string | null } | null>(null);

  useEffect(() => {
    scrollToTop();
    const cleanup = initializeRevealEffects();
    return cleanup;
  }, [slug]);

  const { data: post, isLoading, error } = useQuery<BlogPostType>({
    queryKey: [`/api/blog/slug/${slug}`],
    enabled: !!slug,
  });
  
  // Fetch blog post gallery images
  const { data: galleryImages, isLoading: isLoadingGallery } = useQuery<BlogGallery[]>({
    queryKey: [`/api/blog/${post?.id}/gallery`],
    enabled: !!post?.id,
  });

  // SEO metadata is now handled by BlogPostSeo component

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

  if (error || !post) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-white">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="text-3xl font-montserrat font-bold mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-8">
            The article you're looking for doesn't exist or there was an error loading it.
          </p>
          <Link href="/blog">
            <Button variant="black">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen pt-32 pb-20 bg-white">
        {post && (
          <BlogPostSeo
            title={post.title}
            description={post.excerpt || post.content.substring(0, 160)}
            imageUrl={post.image || ''}
            author={post.author}
            publishedDate={post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()}
            modifiedDate={undefined}
            url={window.location.href}
            slug={slug || ''}
          />
        )}
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <Link href="/blog">
              <Button variant="outline" className="mb-8">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
              </Button>
            </Link>

            <article>
              <header className="mb-12 reveal">
                <h1 className="text-3xl md:text-4xl font-montserrat font-bold mb-6">{post.title}</h1>
                
                <div className="flex flex-wrap gap-4 mb-8 text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(post.createdAt || new Date())}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    <span>{post.category}</span>
                  </div>
                </div>

                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-auto object-cover rounded shadow-lg mb-8"
                />
              </header>

              <div className="prose max-w-none reveal">
                {/* This would render rich content in a real implementation */}
                <p className="text-gray-700 leading-relaxed mb-6">
                  {post.content}
                </p>
                
                <h2 className="text-2xl font-montserrat font-bold mt-12 mb-4">Introduction</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  The construction industry is constantly evolving, with new technologies, methods, and materials emerging to improve efficiency, sustainability, and quality. In this article, we explore some of the latest developments in the field and how they're shaping the future of construction.
                </p>
                
                {/* Gallery Images Section */}
                {galleryImages && galleryImages.length > 0 && (
                  <div className="not-prose my-12">
                    <h3 className="text-xl font-montserrat font-bold mb-6 flex items-center">
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Project Gallery
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {galleryImages
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((image, index) => (
                          <div 
                            key={image.id} 
                            className="group relative rounded overflow-hidden shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl"
                            onClick={() => setSelectedImage({ url: image.imageUrl, caption: image.caption })}
                          >
                            <img 
                              src={image.imageUrl} 
                              alt={image.caption || `Image ${index + 1}`} 
                              className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {image.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-sm">
                                {image.caption}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                <h2 className="text-2xl font-montserrat font-bold mt-12 mb-4">Key Innovations</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  From Building Information Modeling (BIM) to prefabricated construction elements, the industry is embracing innovations that streamline processes and enhance outcomes. These technologies not only improve efficiency but also contribute to more sustainable building practices.
                </p>
                
                <h2 className="text-2xl font-montserrat font-bold mt-12 mb-4">Challenges and Opportunities</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  While new technologies offer exciting possibilities, they also present challenges in terms of implementation, training, and cost. However, the long-term benefits often outweigh these initial obstacles, making innovation a worthwhile investment for construction companies.
                </p>
                
                <h2 className="text-2xl font-montserrat font-bold mt-12 mb-4">Conclusion</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  As the construction industry continues to evolve, staying informed about the latest trends and technologies is essential for companies looking to remain competitive. By embracing innovation while maintaining a focus on quality and client satisfaction, construction firms can position themselves for long-term success.
                </p>
              </div>
            </article>

            <div className="border-t border-gray-200 mt-16 pt-12 reveal">
              <h3 className="text-2xl font-montserrat font-bold mb-8">Related Articles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* This would use actual related posts from the API in a real implementation */}
                {[1, 2, 3].map((_, index) => (
                  <Link key={index} href={`/blog/related-article-${index + 1}`}>
                    <a className="group block overflow-hidden shadow-lg">
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={`https://images.unsplash.com/photo-158157873${index}348-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`} 
                          alt="Related Article" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-montserrat font-bold line-clamp-2">Related Article about Construction Trends</h4>
                        <p className="text-gray-500 text-sm mt-2">June 1, 2023</p>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
          <div className="bg-white rounded-lg overflow-hidden relative">
            <DialogHeader className="p-4 sm:p-6">
              <DialogTitle className="text-lg">
                {selectedImage?.caption || 'Gallery Image'}
              </DialogTitle>
              <Button 
                onClick={() => setSelectedImage(null)} 
                variant="ghost" 
                size="icon"
                className="absolute top-2 right-2 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogHeader>
            {selectedImage && (
              <div className="p-4 sm:p-6 pt-0">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.caption || 'Gallery image'} 
                  className="w-full h-auto object-contain rounded"
                />
                {selectedImage.caption && (
                  <p className="mt-4 text-center text-gray-600">{selectedImage.caption}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BlogPost;
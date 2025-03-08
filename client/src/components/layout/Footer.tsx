import { Link } from 'wouter';
import { Facebook, Github, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NewsletterSubscription from '@/components/common/NewsletterSubscription';

const Footer = () => {
  return (
    <footer className="bg-black text-white pt-20 pb-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/" className="text-white text-2xl font-montserrat font-bold mb-6 inline-block">
              ARCEMUSA
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Premier construction company delivering exceptional quality and innovative solutions for over three decades.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-[#C09E5E] transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#C09E5E] transition-colors" aria-label="GitHub">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#C09E5E] transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#C09E5E] transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h5 className="text-white font-montserrat font-bold mb-6">Quick Links</h5>
            <ul className="space-y-3">
              <li><Link href="/" className="text-gray-400 hover:text-[#C09E5E] transition-colors">Home</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-[#C09E5E] transition-colors">About Us</Link></li>
              <li><Link href="/services" className="text-gray-400 hover:text-[#C09E5E] transition-colors">Services</Link></li>
              <li><Link href="/projects" className="text-gray-400 hover:text-[#C09E5E] transition-colors">Projects</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-[#C09E5E] transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-[#C09E5E] transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-white font-montserrat font-bold mb-6">Our Services</h5>
            <ul className="space-y-3">
              <li><a href="/services" className="text-gray-400 hover:text-[#C09E5E] transition-colors">Commercial Construction</a></li>
              <li><a href="/services" className="text-gray-400 hover:text-[#C09E5E] transition-colors">Residential Construction</a></li>
              <li><a href="/services" className="text-gray-400 hover:text-[#C09E5E] transition-colors">Renovation & Remodeling</a></li>
              <li><a href="/services" className="text-gray-400 hover:text-[#C09E5E] transition-colors">Project Planning & Design</a></li>
              <li><a href="/services" className="text-gray-400 hover:text-[#C09E5E] transition-colors">Industrial Construction</a></li>
              <li><a href="/services" className="text-gray-400 hover:text-[#C09E5E] transition-colors">Construction Management</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-white font-montserrat font-bold mb-6">Newsletter</h5>
            <p className="text-gray-400 mb-4 leading-relaxed">
              Subscribe to our newsletter to receive updates on our latest projects and industry insights.
            </p>
            <form className="flex mb-6">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 focus:border-[#C09E5E] outline-none transition-colors" 
                required 
              />
              <Button 
                type="submit" 
                variant="gold" 
                className="px-4 py-2 text-sm"
              >
                SUBSCRIBE
              </Button>
            </form>
            <p className="text-gray-400 text-sm">
              By subscribing, you agree to our Privacy Policy.
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} ARCEMUSA Construction Company. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-[#C09E5E] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#C09E5E] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#C09E5E] transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

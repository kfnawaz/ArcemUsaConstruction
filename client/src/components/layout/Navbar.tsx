import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type NavbarProps = {
  isScrolled: boolean;
};

const Navbar = ({ isScrolled }: NavbarProps) => {
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const isAuthenticated = !!user;
  
  // Check if we're on an admin page
  const isAdminPage = location.startsWith('/admin');
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#mobile-menu') && !target.closest('#mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigation items
  const navItems = [
    { label: 'HOME', href: '/' },
    { label: 'ABOUT', href: '/about' },
    { label: 'SERVICES', href: '/services' },
    { label: 'PROJECTS', href: '/projects' },
    { label: 'BLOG', href: '/blog' },
    { label: 'CONTACT', href: '/contact' },
  ];

  return (
    <nav 
      id="navbar" 
      className={cn(
        'fixed w-full z-50 py-4 transition-all duration-300',
        isAdminPage ? 'navbar-admin' : (isScrolled ? 'navbar-fixed' : '')
      )}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <img 
              src="/images/logo.png" 
              alt="A+R C.E.M Construction Engineering Management" 
              className="h-12 mr-2" 
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className={cn(
                  "text-white hover:text-[#e0c080] transition-colors font-montserrat text-sm font-medium",
                  location === item.href && "text-[#e0c080]"
                )}
              >
                {item.label}
              </Link>
            ))}
            
            
            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex space-x-2">
                <Link 
                  href="/admin" 
                  className="bg-[#C09E5E] hover:bg-[#A98D54] text-white px-4 py-2 rounded-sm flex items-center space-x-1 font-montserrat text-sm transition-colors"
                >
                  <User className="w-4 h-4 mr-1" />
                  ADMIN
                </Link>
                <Button 
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-white text-white hover:bg-white/10 font-montserrat text-sm transition-colors"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  LOGOUT
                </Button>
              </div>
            ) : (
              <Link 
                href="/auth/login" 
                className="bg-[#C09E5E] hover:bg-[#A98D54] text-white px-4 py-2 rounded-sm flex items-center space-x-1 font-montserrat text-sm transition-colors"
              >
                <User className="w-4 h-4 mr-1" />
                LOGIN
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <button 
            id="mobile-menu-button" 
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        <div 
          id="mobile-menu" 
          className={cn(
            "md:hidden bg-black bg-opacity-95 absolute left-0 right-0 mt-4 py-4 px-4 slide-in",
            isMobileMenuOpen ? "block" : "hidden"
          )}
        >
          <div className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className={cn(
                  "text-white hover:text-[#e0c080] transition-colors font-montserrat text-sm font-medium",
                  location === item.href && "text-[#e0c080]"
                )}
                onClick={closeMobileMenu}
              >
                {item.label}
              </Link>
            ))}
            
            
            {/* Mobile Login/Admin Button */}
            <Link 
              href={isAuthenticated ? "/admin" : "/auth/login"}
              className="bg-[#C09E5E] hover:bg-[#A98D54] text-white px-4 py-2 rounded-sm flex items-center justify-center space-x-1 font-montserrat text-sm transition-colors"
              onClick={closeMobileMenu}
            >
              <User className="w-4 h-4 mr-1" />
              {isAuthenticated ? "ADMIN" : "LOGIN"}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

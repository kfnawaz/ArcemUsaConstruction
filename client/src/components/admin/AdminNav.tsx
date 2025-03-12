import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Building, 
  FileText, 
  MessageSquare, 
  Settings,
  Eye,
  Star,
  Mail,
  ClipboardList,
  Wrench,
  Users
} from 'lucide-react';

type AdminNavProps = {
  activePage: 'dashboard' | 'projects' | 'services' | 'blog' | 'messages' | 'testimonials' | 'settings' | 'accessibility' | 'newsletter' | 'quotes' | 'subcontractors';
};

const AdminNav = ({ activePage }: AdminNavProps) => {
  const [location, navigate] = useLocation();
  
  const navItems = [
    { 
      href: '/admin', 
      label: 'Dashboard', 
      icon: <Home className="w-5 h-5 mr-3" />,
      active: activePage === 'dashboard'
    },
    { 
      href: '/admin/projects', 
      label: 'Projects', 
      icon: <Building className="w-5 h-5 mr-3" />,
      active: activePage === 'projects'
    },
    { 
      href: '/admin/services', 
      label: 'Services', 
      icon: <Wrench className="w-5 h-5 mr-3" />,
      active: activePage === 'services'
    },
    { 
      href: '/admin/blog', 
      label: 'Blog', 
      icon: <FileText className="w-5 h-5 mr-3" />,
      active: activePage === 'blog'
    },
    { 
      href: '/admin/testimonials', 
      label: 'Testimonials', 
      icon: <Star className="w-5 h-5 mr-3" />,
      active: activePage === 'testimonials'
    },
    { 
      href: '/admin/messages', 
      label: 'Messages', 
      icon: <MessageSquare className="w-5 h-5 mr-3" />,
      active: activePage === 'messages'
    },
    { 
      href: '/admin/newsletter', 
      label: 'Newsletter', 
      icon: <Mail className="w-5 h-5 mr-3" />,
      active: activePage === 'newsletter'
    },
    { 
      href: '/admin/quotes', 
      label: 'Quote Requests', 
      icon: <ClipboardList className="w-5 h-5 mr-3" />,
      active: activePage === 'quotes'
    },
    { 
      href: '/admin/subcontractors', 
      label: 'Vendors', 
      icon: <Users className="w-5 h-5 mr-3" />,
      active: activePage === 'subcontractors'
    },
    { 
      href: '/admin/settings', 
      label: 'Settings', 
      icon: <Settings className="w-5 h-5 mr-3" />,
      active: activePage === 'settings'
    },
    { 
      href: '/admin/accessibility', 
      label: 'Accessibility', 
      icon: <Eye className="w-5 h-5 mr-3" />,
      active: activePage === 'accessibility'
    }
  ];

  return (
    <div className="w-full md:w-64 mb-8 md:mb-0">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-black text-white">
          <h2 className="font-montserrat font-bold text-lg">Admin Panel</h2>
        </div>
        <nav className="p-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <div 
                  className={`flex items-center px-4 py-3 rounded-md transition-colors cursor-pointer ${
                    item.active 
                      ? 'bg-[#1E90DB] text-white font-medium' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => navigate(item.href)}
                >
                  {item.icon}
                  {item.label}
                </div>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mt-4 bg-white rounded-lg shadow-md p-4">
        <div 
          onClick={() => navigate('/')}
          className="text-sm text-gray-600 hover:text-[#1E90DB] transition-colors cursor-pointer"
        >
          ← Return to Website
        </div>
      </div>
    </div>
  );
};

export default AdminNav;

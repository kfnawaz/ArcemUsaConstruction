import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/common/BackToTop";
import { SeoProvider } from "@/contexts/SeoContext";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import ChatbotWidget from "@/components/custom/ChatbotWidget";

// Pages
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Contact from "@/pages/Contact";
import RequestQuote from "@/pages/RequestQuote";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/admin/Dashboard";
import ProjectManagement from "@/pages/admin/ProjectManagement";
import BlogManagement from "@/pages/admin/BlogManagement";
import MessagesManagement from "@/pages/admin/MessagesManagement";
import TestimonialsManagement from "@/pages/admin/TestimonialsManagement";
import NewsletterManagement from "@/pages/admin/NewsletterManagement";
import QuoteRequestsManagement from "@/pages/admin/QuoteRequestsManagement";
import SettingsPage from "@/pages/admin/Settings";
import AccessibilityCheckerPage from "@/pages/admin/AccessibilityChecker";
import NotFound from "@/pages/not-found";
import RequestQuoteButton from "@/components/common/A11yFloatingButton";

// Removed AdminRoute function as we now use ProtectedRoute directly

function Router() {
  // For navbar color change on scroll
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Check if we're on an admin page
  const isAdminPage = currentPath.startsWith('/admin');
  
  // Debug
  console.log('Current path:', currentPath, 'Is admin page:', isAdminPage);

  // Listen for location changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    // Set up event listener for path changes
    window.addEventListener('popstate', handleLocationChange);
    
    // Check for changes when clicking on links
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      history.pushState = originalPushState;
    };
  }, []);

  // Handle scroll events for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Show Navbar on all pages */}
      <Navbar isScrolled={isScrolled} />
      
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/services" component={Services} />
          <Route path="/projects" component={Projects} />
          <Route path="/projects/:id" component={ProjectDetail} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/contact" component={Contact} />
          <Route path="/request-quote" component={RequestQuote} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/auth/login" component={AuthPage} />
          
          {/* Protected Admin Routes */}
          <ProtectedRoute path="/admin" component={Dashboard} />
          <ProtectedRoute path="/admin/projects" component={ProjectManagement} />
          <ProtectedRoute path="/admin/blog" component={BlogManagement} />
          <ProtectedRoute path="/admin/messages" component={MessagesManagement} />
          <ProtectedRoute path="/admin/testimonials" component={TestimonialsManagement} />
          <ProtectedRoute path="/admin/newsletter" component={NewsletterManagement} />
          <ProtectedRoute path="/admin/quotes" component={QuoteRequestsManagement} />
          <ProtectedRoute path="/admin/settings" component={SettingsPage} />
          <ProtectedRoute path="/admin/accessibility" component={AccessibilityCheckerPage} />
          
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <BackToTop />
      {/* Show Chatbot on non-admin pages */}
      {!isAdminPage && <ChatbotWidget />}
      {/* Show Footer on all pages */}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SeoProvider>
          <Router />
          <Toaster />
          <AdminAccessibilityButton />
        </SeoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// A separate component to handle request quote button
function AdminAccessibilityButton() {
  return <RequestQuoteButton />;
}

export default App;

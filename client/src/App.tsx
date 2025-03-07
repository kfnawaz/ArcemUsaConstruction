import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/common/BackToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Contact from "@/pages/Contact";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/admin/Dashboard";
import ProjectManagement from "@/pages/admin/ProjectManagement";
import BlogManagement from "@/pages/admin/BlogManagement";
import MessagesManagement from "@/pages/admin/MessagesManagement";
import Settings from "@/pages/admin/Settings";
import AccessibilityChecker from "@/pages/admin/AccessibilityChecker";
import NotFound from "@/pages/not-found";
import A11yFloatingButton from "@/components/common/A11yFloatingButton";

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <Route>
      <ProtectedRoute>
        <Component />
      </ProtectedRoute>
    </Route>
  );
}

function Router() {
  // For navbar color change on scroll
  const [isScrolled, setIsScrolled] = useState(false);

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
          <Route path="/auth">
            <Login />
          </Route>
          
          <Route path="/auth/login">
            <Login />
          </Route>
          
          {/* Protected Admin Routes */}
          <Route path="/admin">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/projects">
            <ProtectedRoute>
              <ProjectManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/blog">
            <ProtectedRoute>
              <BlogManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/messages">
            <ProtectedRoute>
              <MessagesManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/settings">
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/accessibility">
            <ProtectedRoute>
              <AccessibilityChecker />
            </ProtectedRoute>
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      </main>
      <BackToTop />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
        {process.env.NODE_ENV === 'development' && <A11yFloatingButton />}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

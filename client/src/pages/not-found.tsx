import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function NotFound() {
  const [location] = useLocation();
  
  // Debug info
  useEffect(() => {
    console.log("NotFound component rendered for path:", location);
    console.log("Current URL:", window.location.href);
  }, [location]);
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            The page "{location}" was not found in the router.
          </p>
          
          <p className="mt-2 text-xs text-gray-500">
            {import.meta.env.DEV ? "Development mode" : "Production mode"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

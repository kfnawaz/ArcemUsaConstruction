import { useState } from 'react';
import AdminNav from '@/components/admin/AdminNav';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Check } from 'lucide-react';
import { checkAccessibility, AccessibilityChecker as A11yChecker } from '@/lib/accessibility';

const AccessibilityChecker = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checksRun, setChecksRun] = useState(0);

  const handleRunCheck = () => {
    setIsChecking(true);
    
    setTimeout(() => {
      setIsChecking(false);
      setChecksRun(prev => prev + 1);
      toast({
        title: "Accessibility Check Complete",
        description: "Results are displayed on the page.",
        variant: "default",
      });
    }, 1500);
  };

  return (
    <div className="admin-container flex flex-col md:flex-row gap-8 p-6">
      <AdminNav activePage="settings" />
      
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-6">Accessibility Checker</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Website Accessibility Compliance</CardTitle>
            <CardDescription>
              Validate your website against WCAG 2.1 standards and ensure accessibility compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              This tool scans your website for common accessibility issues including contrast ratios, 
              missing alt text, improper ARIA usage, keyboard navigation problems, and more.
            </p>
            
            <div className="grid gap-4 mb-6">
              <div className="grid gap-2">
                <Label htmlFor="url">Page URL to Check (optional)</Label>
                <div className="flex gap-2">
                  <Input 
                    id="url" 
                    placeholder="Enter URL or leave empty to check current page" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleRunCheck} disabled={isChecking}>
                    {isChecking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running Check...
                      </>
                    ) : (
                      <>Run Check</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Important Information
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Automated checks can identify many accessibility issues, but manual testing is still required for complete compliance.</li>
                <li>This tool follows WCAG 2.1 guidelines, which are industry standard for accessibility.</li>
                <li>After fixing issues, run the checker again to verify improvements.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        {/* Show a new checker instance for each check, forcing a re-render */}
        {checksRun > 0 && <A11yChecker showAlways={true} key={checksRun} />}
      </div>
    </div>
  );
};

export default AccessibilityChecker;
import { useState } from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkAccessibility } from '@/lib/accessibility';

// Types imported from accessibility.tsx
type AccessibilityViolation = {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
};

const A11yFloatingButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [violations, setViolations] = useState<AccessibilityViolation[]>([]);

  const runCheck = async () => {
    setIsChecking(true);
    try {
      const results = await checkAccessibility();
      setViolations(results);
      setIsOpen(true);
    } catch (error) {
      console.error('Error running accessibility check:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'serious':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'serious':
        return 'bg-orange-600 text-white';
      case 'moderate':
        return 'bg-yellow-600 text-white';
      case 'minor':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          size="sm"
          variant="outline"
          className="bg-white shadow-md flex items-center gap-2"
          onClick={runCheck}
          disabled={isChecking}
        >
          {isChecking ? (
            <><span className="animate-spin">⟳</span> Checking...</>
          ) : (
            <><AlertTriangle className="h-4 w-4 text-amber-500" /> A11y Check</>
          )}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 bg-[#C09E5E] text-white flex justify-between items-center">
              <h2 className="font-bold text-lg">
                Accessibility Check
                {violations.length > 0 ? ` (${violations.length} issues found)` : ' (All Clear!)'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {violations.length > 0 ? (
                <div className="space-y-6">
                  {violations.map((violation) => (
                    <div 
                      key={violation.id} 
                      className={`border rounded-lg p-4 ${getImpactColor(violation.impact)}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{violation.help}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactBadge(violation.impact)}`}>
                          {violation.impact}
                        </span>
                      </div>
                      <p className="mb-2">{violation.description}</p>
                      <a 
                        href={violation.helpUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm mb-4 inline-block"
                      >
                        Learn more
                      </a>
                      
                      <div className="mt-3 space-y-3">
                        {violation.nodes.map((node, i) => (
                          <div key={i} className="bg-white p-3 rounded border text-sm">
                            <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-2 overflow-x-auto">
                              {node.html}
                            </div>
                            <div>
                              <span className="font-medium">Element:</span> {node.target.join(', ')}
                            </div>
                            <div className="mt-1">
                              <span className="font-medium">Issue:</span> {node.failureSummary}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Check className="h-12 w-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium">No accessibility issues found!</p>
                  <p className="text-gray-600 mt-2">
                    Your page passed all accessibility checks. Great job!
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-between">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Close
              </Button>
              <Button 
                onClick={runCheck} 
                disabled={isChecking}
                className="bg-[#C09E5E] hover:bg-[#9a7e48]"
              >
                {isChecking ? "Checking..." : "Run Check Again"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default A11yFloatingButton;
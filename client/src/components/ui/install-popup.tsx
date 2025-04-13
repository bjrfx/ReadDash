import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { promptInstall } from '@/lib/pwa-utils';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InstallPopupProps {
  delay?: number; // Delay in ms before showing the popup
}

const InstallPopup = ({ delay = 3000 }: InstallPopupProps) => {
  const [open, setOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  // Check if app is already installed and capture install prompt
  useEffect(() => {
    // Check if app is in standalone mode or display-mode is standalone
    const isInStandaloneMode = () => 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone || 
      document.referrer.includes('android-app://');
    
    setIsInstalled(isInStandaloneMode());

    // If not installed, listen for beforeinstallprompt event
    if (!isInStandaloneMode()) {
      const handleBeforeInstallPrompt = (e: Event) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        setInstallPrompt(e);
        
        // Log for debugging
        console.log('📱 Install prompt event captured');
        toast({
          title: "App can be installed",
          description: "You can install ReadDash as an app on your device.",
          duration: 5000,
        });
        
        // After delay, show the install popup
        setTimeout(() => {
          setOpen(true);
        }, delay);
      };
      
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, [delay]); // Only dependency is delay

  // Handle install button click
  const handleInstall = async () => {
    if (!installPrompt) {
      toast({
        title: "Installation not available",
        description: "Please try again when the install prompt appears.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📱 Attempting to install app...');
      const { outcome } = await installPrompt.prompt();
      const installed = outcome === 'accepted';
      
      if (installed) {
        console.log('📱 App installation accepted');
        toast({
          title: "Installation started",
          description: "Thank you for installing ReadDash!",
          variant: "default",
        });
        setOpen(false);
        setIsInstalled(true);
      } else {
        console.log('📱 App installation rejected');
        toast({
          title: "Installation cancelled",
          description: "You can install the app later from the settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('📱 Installation error:', error);
      toast({
        title: "Installation failed",
        description: "There was a problem installing the app. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Handle open app button click
  const handleOpenApp = () => {
    // Try to open the installed PWA
    window.location.href = window.location.origin;
  };

  if (isInstalled) {
    return null; // Don't show anything if already installed
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md relative overflow-hidden border-primary/20 glow-primary fixed left-[50%] top-[10%] translate-x-[-50%] translate-y-[0%] !mt-0">
        {/* Animated gradient border effect */}
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 opacity-50 animate-gradient-x"></div>
        </div>
        
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Install ReadDash</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Install our app for a better experience with offline access and faster loading times.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 pt-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Benefits:</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                <span>Works offline</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                <span>Faster loading times</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                <span>Home screen access</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleInstall} 
              variant="glow"
            >
              <Download /> Install Now
            </Button>
            <Button 
              onClick={() => setOpen(false)} 
              variant="outline"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallPopup;
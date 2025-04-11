import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if user has already consented to cookies
    const hasConsented = localStorage.getItem('cookieConsent');
    if (!hasConsented) {
      setIsVisible(true);
    }
  }, []);
  
  const acceptCookies = () => {
    // Set cookie consent in localStorage
    localStorage.setItem('cookieConsent', 'accepted');
    // Set a special flag for third-party cookies that might be needed for auth
    localStorage.setItem('thirdPartyCookiesAllowed', 'true');
    document.cookie = "cookieConsent=accepted; path=/; max-age=31536000"; // 1 year
    setIsVisible(false);
  };
  
  const declineCookies = () => {
    // Store preference but note they declined
    localStorage.setItem('cookieConsent', 'declined');
    document.cookie = "cookieConsent=minimal; path=/; max-age=31536000"; // 1 year
    setIsVisible(false);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-4xl mx-auto border shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Cookie Settings</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={declineCookies}
              aria-label="Close"
            >
              <X size={20} />
            </Button>
          </div>
          <CardDescription>
            We use cookies to enhance your experience and enable features like Google Sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2 text-sm">
          <p>
            This site uses cookies and similar technologies to remember your preferences, 
            analyze traffic, and enable third-party features like Google Sign-in. 
            By clicking "Accept all cookies", you consent to the use of cookies.
          </p>
          <p className="mt-2 text-primary">
            <strong>Important:</strong> Third-party cookies are required for Google Sign-in to work properly on mobile devices.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={declineCookies}>
            Essential cookies only
          </Button>
          <Button onClick={acceptCookies}>
            Accept all cookies
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CookieConsent;
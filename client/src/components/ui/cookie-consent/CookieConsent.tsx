import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Cookie, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-background/80 backdrop-blur-sm"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <Card className="w-full max-w-4xl mx-auto border shadow-lg overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-300 via-primary-500 to-primary-700"></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-primary-500" />
                  <CardTitle>Cookie Settings</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={declineCookies}
                  aria-label="Close"
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={18} />
                </Button>
              </div>
              <CardDescription className="mt-1">
                We use cookies to enhance your experience and enable features like Google Sign-in.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2 text-sm">
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="mt-1 text-primary-500">
                    <Cookie className="h-4 w-4" />
                  </div>
                  <p>
                    This site uses cookies and similar technologies to remember your preferences, 
                    analyze traffic, and enable third-party features like Google Sign-in. 
                    By clicking "Accept all cookies", you consent to the use of cookies.
                  </p>
                </div>
                <div className="flex gap-3 bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
                  <div className="mt-1 text-primary-500">
                    <Shield className="h-4 w-4" />
                  </div>
                  <p className="text-primary-700 dark:text-primary-300">
                    <strong>Important:</strong> Third-party cookies are required for Google Sign-in to work properly on mobile devices.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 pt-3 pb-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  onClick={declineCookies}
                  className="rounded-full px-4 border-gray-300 hover:border-gray-400 transition-colors"
                >
                  Essential cookies only
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={acceptCookies}
                  className="rounded-full px-4 shadow-sm hover:shadow transition-all"
                >
                  Accept all cookies
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
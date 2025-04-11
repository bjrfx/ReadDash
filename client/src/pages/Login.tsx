import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { signInWithGoogle, handleRedirectResult, signInWithGooglePopup } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const newDate = new Date();
  const currentYear = newDate.getFullYear();
  
  
  // Handle redirect result when component mounts
  useEffect(() => {
    const checkRedirectResult = async () => {
      setIsLoading(true);
      try {
        const user = await handleRedirectResult();
        if (user) {
          // User is signed in, redirect to the home page
          setLocation('/');
        }
      } catch (error) {
        // Check if this is an unauthorized domain error
        const errorObj = error as { code?: string, message?: string };
        const errorMessage = errorObj.message || "Failed to sign in with Google";
        const isUnauthorizedDomain = errorObj.code === "auth/unauthorized-domain";
        
        toast({
          title: "Authentication failed",
          description: isUnauthorizedDomain 
            ? "This domain is not authorized for authentication. Please add your Replit URL to the authorized domains in Firebase Console." 
            : errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkRedirectResult();
  }, [setLocation, toast]);
  
  // Choose the appropriate sign-in method based on the device/browser
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // For mobile devices, use redirect method as it works better
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        await signInWithGoogle();
      } else {
        // For desktop, use popup method
        const user = await signInWithGooglePopup();
        if (user) {
          setLocation('/');
        }
      }
    } catch (error) {
      // Check if this is an unauthorized domain error
      const errorObj = error as { code?: string, message?: string };
      const errorMessage = errorObj.message || "Failed to sign in with Google";
      const isUnauthorizedDomain = errorObj.code === "auth/unauthorized-domain";
      
      toast({
        title: "Authentication failed",
        description: isUnauthorizedDomain 
          ? "This domain is not authorized for authentication. Please add your Replit URL to the authorized domains in Firebase Console." 
          : errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md mb-8">
        <h1 className="text-4xl font-bold text-center font-heading">
          <span className="text-primary-600 dark:text-primary-400">Read</span>
          <span className="text-secondary-600 dark:text-secondary-400">Dash</span>
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
          Improve your reading comprehension skills
        </p>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to ReadDash</CardTitle>
          <CardDescription className="text-center">
            Sign in to track your progress and unlock achievements
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Sign in with Google
          </Button>
          
          {/* <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-3 rounded border border-amber-200 dark:border-amber-800">
            <p className="font-medium">Setup Note:</p>
            <p>For Firebase authentication to work, add your Replit URL to the authorized domains in Firebase Console:</p>
            <ol className="list-decimal pl-5 mt-1 space-y-1">
              <li>Go to Firebase Console</li>
              <li>Select your project</li>
              <li>Go to Authentication → Settings → Authorized domains</li>
              <li>Add your Replit URL</li>
            </ol>
          </div> */}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>
      
      <div className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center">
        <p>ReadDash - A modern reading comprehension web application</p>
        <p className="mt-1">© {currentYear} ReadDash</p>
      </div>
    </div>
  );
}

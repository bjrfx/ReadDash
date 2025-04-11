import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  signInWithGoogle, 
  handleRedirectResult, 
  signInWithGooglePopup, 
  auth,
  prepareForRedirect,
  checkRedirectStatus,
  signInWithEmail,
  signUpWithEmail,
  resetPassword
} from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { onAuthStateChanged } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCookieErrorVisible, setIsCookieErrorVisible] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const newDate = new Date();
  const currentYear = newDate.getFullYear();
  
  // Listen for auth state changes and handle redirect result when component mounts
  useEffect(() => {
    console.log("Login component mounted - checking auth state and redirect result");
    setIsLoading(true);
    
    // Check if we're returning from a Google sign-in redirect
    const isReturningFromRedirect = sessionStorage.getItem('googleAuthAttempt') === 'true';
    if (isReturningFromRedirect) {
      console.log("Detected return from Google redirect");
      // Use our debug utility to check the redirect status
      const redirectStatus = checkRedirectStatus();
      console.log("Redirect flow details:", redirectStatus);
    }
    
    // Set up auth state listener first to catch any existing auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Auth state changed: User is signed in:", user.email);
        
        // If returning from redirect and we have a user, treat this as a successful redirect auth
        if (isReturningFromRedirect) {
          console.log("User is authenticated after redirect, redirecting to home");
          sessionStorage.removeItem('googleAuthAttempt');
          setLocation('/');
          setIsLoading(false);
          return;
        }
        
        // Otherwise just redirect to home since user is already authenticated
        setLocation('/');
      } else {
        console.log("Auth state changed: No user is signed in");
        
        // Only check redirect result if we're not already authenticated
        if (isReturningFromRedirect) {
          checkRedirect().catch(() => {
            setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      }
    });
    
    // The redirect check function remains the same
    const checkRedirect = async () => {
      try {
        console.log("Explicitly checking for redirect result");
        const redirectUser = await handleRedirectResult();
        if (redirectUser) {
          console.log("Successfully signed in via redirect:", redirectUser.email);
          sessionStorage.removeItem('googleAuthAttempt');
          setLocation('/');
          return true;
        } else if (isReturningFromRedirect) {
          console.log("Returning from redirect but no user found - possible error");
          
          // Show warning about potential issues if we're returning from redirect without a user
          toast({
            title: "Sign-in issue detected",
            description: "Your browser's privacy settings may be blocking the sign-in. Please enable third-party cookies for this site or try a different browser.",
            variant: "destructive",
          });
          
          // Display cookie troubleshooting information and show email auth options
          setIsCookieErrorVisible(true);
          setShowEmailAuth(true);
          
          sessionStorage.removeItem('googleAuthAttempt');
        }
        setIsLoading(false);
        return false;
      } catch (error) {
        const errorObj = error as { code?: string, message?: string };
        console.error("Redirect result error:", errorObj.code, errorObj.message);
        sessionStorage.removeItem('googleAuthAttempt');
        
        toast({
          title: "Authentication failed",
          description: errorObj.code === "auth/unauthorized-domain"
            ? "This domain is not authorized for authentication. Please check the Firebase Console authorized domains."
            : (errorObj.message || "Failed to sign in with Google"),
          variant: "destructive",
        });
        
        // Show email auth options as an alternative
        setShowEmailAuth(true);
        
        setIsLoading(false);
        return false;
      }
    };
    
    // If not returning from redirect and no user is signed in, we don't need to check for redirect results
    if (!isReturningFromRedirect && !auth.currentUser) {
      setIsLoading(false);
    }
    
    return () => unsubscribe();
  }, [setLocation, toast]);
  
  // Choose the appropriate sign-in method based on the device/browser
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // For mobile devices, use redirect method as it works better
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        console.log("Using redirect method for mobile device");
        // Store that we're attempting a Google auth redirect and prepare for redirect
        sessionStorage.setItem('googleAuthAttempt', 'true');
        prepareForRedirect(); // Use our new debugging helper
        await signInWithGoogle();
        // Will redirect to Google, code below won't execute until return
      } else {
        // For desktop, use popup method
        console.log("Using popup method for desktop");
        const user = await signInWithGooglePopup();
        if (user) {
          console.log("Successfully signed in via popup:", user.email);
          setLocation('/');
        }
      }
    } catch (error) {
      // Check if this is an unauthorized domain error
      const errorObj = error as { code?: string, message?: string };
      console.error("Sign-in error:", errorObj.code, errorObj.message);
      
      toast({
        title: "Authentication failed",
        description: errorObj.code === "auth/unauthorized-domain" 
          ? "This domain is not authorized for authentication. Please check the Firebase Console authorized domains." 
          : (errorObj.message || "Failed to sign in with Google"),
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Email authentication handlers
  const handleEmailSignIn = async () => {
    setAuthError('');
    if (!email || !password) {
      setAuthError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      const user = await signInWithEmail(email, password);
      if (user) {
        console.log("Successfully signed in with email:", user.email);
        setLocation('/');
      }
    } catch (error) {
      const errorObj = error as { code?: string, message?: string };
      console.error("Email sign-in error:", errorObj.code, errorObj.message);
      
      // Handle common Firebase auth errors with user-friendly messages
      if (errorObj.code === 'auth/user-not-found' || errorObj.code === 'auth/wrong-password') {
        setAuthError('Invalid email or password');
      } else if (errorObj.code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address');
      } else if (errorObj.code === 'auth/too-many-requests') {
        setAuthError('Too many sign-in attempts. Please try again later');
      } else {
        setAuthError(errorObj.message || 'Failed to sign in with email');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEmailSignUp = async () => {
    setAuthError('');
    if (!email || !password) {
      setAuthError('Please enter both email and password');
      return;
    }
    
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    try {
      const user = await signUpWithEmail(email, password);
      if (user) {
        console.log("Successfully signed up with email:", user.email);
        toast({
          title: "Account created",
          description: "Your account has been created successfully",
        });
        setLocation('/');
      }
    } catch (error) {
      const errorObj = error as { code?: string, message?: string };
      console.error("Email sign-up error:", errorObj.code, errorObj.message);
      
      // Handle common Firebase auth errors with user-friendly messages
      if (errorObj.code === 'auth/email-already-in-use') {
        setAuthError('This email is already in use');
      } else if (errorObj.code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address');
      } else if (errorObj.code === 'auth/weak-password') {
        setAuthError('Password is too weak. Please use a stronger password');
      } else {
        setAuthError(errorObj.message || 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordReset = async () => {
    setAuthError('');
    if (!email) {
      setAuthError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    try {
      await resetPassword(email);
      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password",
      });
      // Switch back to sign in mode
      setAuthMode('signin');
    } catch (error) {
      const errorObj = error as { code?: string, message?: string };
      console.error("Password reset error:", errorObj.code, errorObj.message);
      
      if (errorObj.code === 'auth/user-not-found') {
        setAuthError('No account found with this email address');
      } else if (errorObj.code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address');
      } else {
        setAuthError(errorObj.message || 'Failed to send password reset email');
      }
    } finally {
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
          {showEmailAuth ? (
            <div>
              <div className="mb-4">
                <p className="text-sm text-center mb-2 text-gray-800 dark:text-gray-200">
                  Having trouble with Google Sign-in? Use email instead.
                </p>
                <Tabs defaultValue="signin" className="w-full" 
                  value={authMode}
                  onValueChange={(value) => setAuthMode(value as 'signin' | 'signup' | 'reset')}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  {/* Sign In Form */}
                  <TabsContent value="signin" className="space-y-4 mt-4">
                    {authError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{authError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="email"
                          placeholder="your.email@example.com" 
                          className="pl-10"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="password">Password</Label>
                        <button
                          type="button"
                          className="text-xs text-primary dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 hover:underline"
                          onClick={() => setAuthMode('reset')}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="password"
                          placeholder="••••••••" 
                          className="pl-10"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={handleEmailSignIn}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Sign in with Email
                    </Button>
                    
                    <div className="text-center">
                      <Button 
                        variant="link" 
                        className="text-xs text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400"
                        onClick={() => setShowEmailAuth(false)}
                      >
                        Try Google Sign-in again
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Sign Up Form */}
                  <TabsContent value="signup" className="space-y-4 mt-4">
                    {authError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{authError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="signup-email"
                          placeholder="your.email@example.com" 
                          className="pl-10"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="signup-password">Password</Label>
                        <button
                          type="button"
                          className="text-xs text-primary dark:text-primary-400 hover:underline"
                          onClick={() => setAuthMode('reset')}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="signup-password"
                          placeholder="••••••••" 
                          className="pl-10"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="confirm-password"
                          placeholder="••••••••" 
                          className="pl-10"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={handleEmailSignUp}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <User className="mr-2 h-4 w-4" />
                      )}
                      Sign up with Email
                    </Button>
                    
                    <div className="text-center flex flex-col gap-2">
                      <Button 
                        variant="link" 
                        className="text-xs text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400"
                        onClick={() => setShowEmailAuth(false)}
                      >
                        Try Google Sign-in again
                      </Button>
                      
                      <Button
                        variant="link"
                        className="text-xs text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400"
                        onClick={() => setAuthMode('reset')}
                      >
                        <Lock className="mr-1 h-3 w-3" />
                        Forgot your password?
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Reset Password Form */}
                  <TabsContent value="reset" className="space-y-4 mt-4">
                    {authError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{authError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="reset-email"
                          placeholder="your.email@example.com" 
                          className="pl-10"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={handlePasswordReset}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Send Reset Instructions
                    </Button>
                    
                    <div className="text-center">
                      <Button 
                        variant="link" 
                        className="text-xs text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400"
                        onClick={() => setAuthMode('signin')}
                      >
                        Back to Sign-in
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {isCookieErrorVisible && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setIsCookieErrorVisible(true)}
                  >
                    View Cookie Troubleshooting
                  </Button>
                </div>
              )}
            </div>
          ) : isCookieErrorVisible ? (
            <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md border border-amber-200 dark:border-amber-800 mb-4">
              <h3 className="font-medium text-amber-800 dark:text-amber-400 mb-2">Troubleshooting Sign In Issues</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                Google Sign In requires third-party cookies to be enabled. Please follow these steps:
              </p>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">On iPhone/iPad (Safari):</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Go to Settings → Safari</li>
                  <li>Turn off "Prevent Cross-Site Tracking"</li>
                  <li>Return to this page and try again</li>
                </ol>
                
                <p className="font-medium mt-3 mb-1">On Android (Chrome):</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Go to Chrome Settings → Site settings → Cookies</li>
                  <li>Allow third-party cookies or add this site to exceptions</li>
                  <li>Return to this page and try again</li>
                </ol>
                
                <p className="mt-3">Alternatively, try using a different browser.</p>
              </div>
              
              <div className="flex justify-between mt-3 gap-2">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    setIsCookieErrorVisible(false);
                    setShowEmailAuth(true);
                  }}
                >
                  Use Email Instead
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setIsCookieErrorVisible(false)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ) : (
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
          )}
          
          {!showEmailAuth && !isCookieErrorVisible && (
            <div className="text-center mt-2 space-y-2">
              <Button 
                variant="link" 
                className="text-xs text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400"
                onClick={() => setShowEmailAuth(true)}
              >
                Sign in with Email instead
              </Button>
              
              <div className="flex items-center justify-center">
                <div className="border-t border-gray-200 dark:border-gray-700 w-full"></div>
                <span className="px-2 text-xs text-gray-500 dark:text-gray-400">or</span>
                <div className="border-t border-gray-200 dark:border-gray-700 w-full"></div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400"
                onClick={() => {
                  setShowEmailAuth(true);
                  setAuthMode('reset');
                }}
              >
                <Lock className="mr-1 h-3 w-3" />
                Forgot Password?
              </Button>
            </div>
          )}
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

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks";
import { signOut } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function AuthTest() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userDetails, setUserDetails] = useState<string>("");

  useEffect(() => {
    if (user) {
      setUserDetails(JSON.stringify(user, null, 2));
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Successfully signed out",
        description: "You have been signed out of your account",
      });
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Firebase Authentication Test</CardTitle>
          <CardDescription>Testing if Firebase authentication is working properly</CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="h-12 w-12 rounded-full" />
                ) : (
                  <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-lg">{user.displayName || "User"}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
                <p className="text-sm font-medium mb-1">User details:</p>
                <pre className="text-xs overflow-auto p-2 bg-gray-100 dark:bg-gray-900 rounded">
                  {userDetails}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="mb-4">You are not signed in</p>
              <Button onClick={() => setLocation("/login")}>Go to Login</Button>
            </div>
          )}
        </CardContent>
        
        {user && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setLocation("/")}>
              Go to Dashboard
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAdmin } from "@/lib/hooks";
import { Loader2 } from "lucide-react";

interface RequireAdminProps {
  children: React.ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { isAdmin, loading } = useAdmin();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAdmin) {
      // Redirect to home if not admin
      setLocation("/");
    }
  }, [isAdmin, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect to home
  }

  return <>{children}</>;
}

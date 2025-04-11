import { User } from "firebase/auth";
import { Link, useLocation } from "wouter";
import { signOut } from "@/lib/firebase";
import { useTheme } from "@/lib/hooks";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Home, BookOpen, Trophy, History, Settings, LogOut } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface DesktopSidebarProps {
  user: User | null;
  userLevel?: string;
  dailyGoalProgress?: number;
}

export function DesktopSidebar({ 
  user, 
  userLevel = "1A", 
  dailyGoalProgress = 0 
}: DesktopSidebarProps) {
  const [location] = useLocation();
  const { toggleTheme } = useTheme();
  const { toast } = useToast();

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/", icon: <Home className="w-5 text-center" /> },
    { label: "Reading Quizzes", href: "/quizzes", icon: <BookOpen className="w-5 text-center" /> },
    { label: "Achievements", href: "/achievements", icon: <Trophy className="w-5 text-center" /> },
    { label: "History", href: "/history", icon: <History className="w-5 text-center" /> },
    { label: "Settings", href: "/settings", icon: <Settings className="w-5 text-center" /> },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="hidden sm:flex flex-col fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-5 z-50">
      <div className="flex items-center mb-8">
        <h1 className="font-heading text-2xl font-bold">
          <span className="text-primary-600 dark:text-primary-400">Read</span>
          <span className="text-secondary-600 dark:text-secondary-400">Dash</span>
        </h1>
      </div>

      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="User avatar" 
              className="h-12 w-12 rounded-full"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 font-medium text-lg">
              {user?.displayName?.charAt(0) || "U"}
            </div>
          )}
          <div>
            <p className="font-medium">{user?.displayName || "Guest"}</p>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 text-primary-500 mr-1" />
                Level {userLevel}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg ${
                location === item.href 
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Daily Goal</span>
            <span className="text-sm text-primary-600 dark:text-primary-400">
              {Math.round(dailyGoalProgress * 100) / 100}/3
            </span>
          </div>
          <Progress value={dailyGoalProgress / 3 * 100} className="h-2 bg-gray-200 dark:bg-gray-600" />
        </div>
        
        <Button 
          variant="outline" 
          className="w-full justify-center" 
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Sign Out</span>
        </Button>
        
        <div className="flex justify-center mt-4">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

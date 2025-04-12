import { User } from "firebase/auth";
import { useTheme } from "@/lib/hooks";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

// Logo component with updated color (purple instead of blue)
const Logo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 text-purple-600 dark:text-purple-400"
  >
    <path d="M2 3h6a4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7v-15z" />
  </svg>
);

interface MobileHeaderProps {
  user: User | null;
  userLevel?: string;
  notificationCount?: number;
}

export function MobileHeader({ 
  user, 
  userLevel = "1A", 
  notificationCount = 0 
}: MobileHeaderProps) {
  const { toggleTheme } = useTheme();

  return (
    <header className="sm:hidden fixed top-0 inset-x-0 h-16 border-b border-primary/10 bg-background/80 backdrop-blur-sm z-50 shadow-md transition-all duration-300">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center space-x-2">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="User avatar" 
              className="h-8 w-8 rounded-full ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/50 hover:scale-110 shadow-sm"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/50 hover:scale-110 shadow-sm">
              {user?.displayName?.charAt(0) || "U"}
            </div>
          )}
          <div className="flex items-center">
            <Logo />
            <h1 className="font-heading text-xl font-bold ml-1.5 tracking-tight">
              <span className="text-primary font-extrabold bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">Read</span>
              <span className="text-secondary bg-gradient-to-r from-teal-600 to-teal-400 dark:from-teal-400 dark:to-teal-600 bg-clip-text text-transparent">Dash</span>
            </h1>
            <div className="ml-1.5 px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-300 transform hover:scale-105">
              <p className="text-xs font-medium text-primary">
                Level {userLevel}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative transform hover:scale-110 transition-all duration-300">
            <Bell className="h-5 w-5 text-primary/80 hover:text-primary transition-colors duration-300" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-white animate-pulse shadow-glow"
              >
                {notificationCount}
              </Badge>
            )}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

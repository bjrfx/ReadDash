import { User } from "firebase/auth";
import { useTheme } from "@/lib/hooks";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

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
    <header className="sm:hidden fixed top-0 inset-x-0 h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-50">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center space-x-2">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="User avatar" 
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 font-medium">
              {user?.displayName?.charAt(0) || "U"}
            </div>
          )}
          <div>
            <h1 className="font-heading text-xl font-bold flex items-center">
              <span className="text-primary-600 dark:text-primary-400">Read</span>
              <span className="text-secondary-600 dark:text-secondary-400">Dash</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Reading Level: {userLevel}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-xs text-white"
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

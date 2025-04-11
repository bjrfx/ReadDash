import { Home, BookOpen, Trophy, User } from "lucide-react";
import { Link, useLocation } from "wouter";

interface MobileNavBarProps {
  currentRoute: string;
}

export function MobileNavBar({ currentRoute }: MobileNavBarProps) {
  const [location] = useLocation();
  
  // Determine current route if not provided
  const route = currentRoute || location;
  
  // Check if a route is active
  const isActive = (path: string) => {
    return route === path;
  };

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 flex items-center">
      <div className="flex justify-around w-full">
        <Link href="/" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/") ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"}`}>
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Dashboard</span>
        </Link>
        
        <Link href="/quizzes" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/quizzes") ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"}`}>
          <BookOpen className="h-5 w-5" />
          <span className="text-xs mt-1">Quizzes</span>
        </Link>
        
        <Link href="/achievements" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/achievements") ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"}`}>
          <Trophy className="h-5 w-5" />
          <span className="text-xs mt-1">Achievements</span>
        </Link>
        
        <Link href="/settings" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive("/settings") ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"}`}>
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  );
}

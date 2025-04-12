import { User } from "firebase/auth";
import { Link, useLocation } from "wouter";
import { signOut } from "@/lib/firebase";
import { useTheme, useAdmin, useAuth } from "@/lib/hooks";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Home, BookOpen, Trophy, History, Settings, LogOut, ShieldAlert, Edit, Book } from "lucide-react";
import { useDailyGoal } from "@/lib/dailyGoal";
import { useUserData } from "@/lib/userData";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export function DesktopSidebar({ user }: DesktopSidebarProps) {
  const [location] = useLocation();
  const { toggleTheme } = useTheme();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { data: userData } = useUserData();
  const { goalSettings, goalProgress, isLoading: goalLoading, updateDailyGoal } = useDailyGoal();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState<number>(goalSettings?.dailyGoal || 3);
  const [isSaving, setIsSaving] = useState(false);

  // For fallback/initial render before data is loaded
  const userLevel = userData?.readingLevel || "1A";
  const dailyGoalProgress = goalProgress?.currentProgress || 0;
  const dailyGoalTarget = goalSettings?.dailyGoal || 3;

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/", icon: <Home className="w-5 text-center" /> },
    { label: "Reading Quizzes", href: "/quizzes", icon: <BookOpen className="w-5 text-center" /> },
    { label: "Vocabulary", href: "/vocabulary", icon: <Book className="w-5 text-center" /> },
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

  const handleSaveNewGoal = async () => {
    setIsSaving(true);
    try {
      if (await updateDailyGoal(newGoalValue)) {
        toast({
          title: "Daily goal updated",
          description: `Your daily goal has been set to ${newGoalValue} quizzes.`,
        });
        setIsDialogOpen(false);
      } else {
        throw new Error("Failed to update goal");
      }
    } catch (error) {
      toast({
        title: "Error updating goal",
        description: "There was a problem updating your daily goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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

          {/* Admin Button - only visible for admin users */}
          {isAdmin && (
            <Link 
              href="/admin"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg ${
                location === "/admin" 
                  ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              <ShieldAlert className="w-5 text-center text-red-600 dark:text-red-400" />
              <span className="font-medium">Admin Dashboard</span>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Daily Goal</span>
            <div className="flex items-center">
              <span className="text-sm text-primary-600 dark:text-primary-400 mr-1">
                {dailyGoalProgress}/{dailyGoalTarget}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setNewGoalValue(dailyGoalTarget);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                      <span className="sr-only">Edit daily goal</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit daily goal</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <Progress 
            value={(dailyGoalProgress / dailyGoalTarget) * 100} 
            className="h-2 bg-gray-200 dark:bg-gray-600" 
          />
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

      {/* Dialog for editing daily goal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Daily Reading Goal</DialogTitle>
            <DialogDescription>
              How many quizzes would you like to complete each day?
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newDailyGoal" className="text-right col-span-1">
                Quizzes per day
              </Label>
              <Input
                id="newDailyGoal"
                type="number"
                min={1}
                max={10}
                value={newGoalValue}
                onChange={(e) => setNewGoalValue(parseInt(e.target.value) || dailyGoalTarget)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNewGoal} 
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}

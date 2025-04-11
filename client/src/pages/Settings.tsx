import { useState } from "react";
import { useAuth } from "@/lib/hooks";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/hooks";
import { signOut } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Bell,
  Moon,
  Sun,
  Languages,
  LogOut,
  BookOpen,
  User,
  Shield,
  BookOpenCheck,
  Globe,
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // State for settings
  const [notifications, setNotifications] = useState({
    newQuizzes: true,
    achievements: true,
    levelChanges: true,
    dailyReminders: false,
  });
  
  const [preferences, setPreferences] = useState({
    language: "english",
    defaultLevel: "auto",
    defaultCategory: "all",
    autoSubmit: true,
    showTimer: true,
  });
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handlePreferenceChange = (key: keyof typeof preferences, value: string | boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  return (
    <MainLayout currentRoute="/settings" userLevel="8B">
      <div className="p-4 sm:p-6">
        <h2 className="font-heading text-2xl font-bold mb-6">Settings</h2>
        
        <Tabs defaultValue="account">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          {/* Account Tab */}
          <TabsContent value="account">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  View and manage your account details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-6">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="h-16 w-16 rounded-full mr-4" 
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 font-medium text-xl mr-4">
                      {user?.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-lg">{user?.displayName || "User"}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input 
                      id="display-name" 
                      value={user?.displayName || ""} 
                      disabled 
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your display name is managed by your Google account
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      value={user?.email || ""} 
                      disabled 
                      className="mt-1" 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your email address is managed by your Google account
                    </p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <h3 className="font-medium mb-4 flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    Authentication
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    You are currently signed in with Google.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpenCheck className="mr-2 h-5 w-5" />
                  Reading Preferences
                </CardTitle>
                <CardDescription>
                  Customize your reading experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="default-level">Default Reading Level</Label>
                    <Select
                      value={preferences.defaultLevel}
                      onValueChange={(value) => handlePreferenceChange('defaultLevel', value)}
                    >
                      <SelectTrigger id="default-level" className="mt-1">
                        <SelectValue placeholder="Select default level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (Based on your level)</SelectItem>
                        <SelectItem value="5A">Level 5A (Basic)</SelectItem>
                        <SelectItem value="6B">Level 6B (Intermediate)</SelectItem>
                        <SelectItem value="8B">Level 8B (Advanced)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      This will be the default level when browsing quizzes
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="default-category">Default Category</Label>
                    <Select
                      value={preferences.defaultCategory}
                      onValueChange={(value) => handlePreferenceChange('defaultCategory', value)}
                    >
                      <SelectTrigger id="default-category" className="mt-1">
                        <SelectValue placeholder="Select default category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="science">Science</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="literature">Literature</SelectItem>
                        <SelectItem value="social">Social Studies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-submit" className="text-base">Auto-Submit Quizzes</Label>
                      <p className="text-xs text-gray-500">
                        Automatically submit quiz when all questions are answered
                      </p>
                    </div>
                    <Switch
                      id="auto-submit"
                      checked={preferences.autoSubmit}
                      onCheckedChange={(checked) => handlePreferenceChange('autoSubmit', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-timer" className="text-base">Show Timer</Label>
                      <p className="text-xs text-gray-500">
                        Display a timer while taking quizzes
                      </p>
                    </div>
                    <Switch
                      id="show-timer"
                      checked={preferences.showTimer}
                      onCheckedChange={(checked) => handlePreferenceChange('showTimer', checked)}
                    />
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <h3 className="font-medium mb-4 flex items-center">
                    <Globe className="mr-2 h-5 w-5" />
                    Display & Language
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={preferences.language}
                        onValueChange={(value) => handlePreferenceChange('language', value)}
                      >
                        <SelectTrigger id="language" className="mt-1">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="spanish">Spanish</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="theme-toggle" className="text-base">Dark Mode</Label>
                        <p className="text-xs text-gray-500">
                          Toggle between light and dark theme
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Sun className="h-4 w-4 mr-2 text-gray-500" />
                        <Switch
                          id="theme-toggle"
                          checked={theme === 'dark'}
                          onCheckedChange={toggleTheme}
                        />
                        <Moon className="h-4 w-4 ml-2 text-gray-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Manage your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="new-quizzes" className="text-base">New Quizzes</Label>
                      <p className="text-xs text-gray-500">
                        Notify me when new quizzes are available
                      </p>
                    </div>
                    <Switch
                      id="new-quizzes"
                      checked={notifications.newQuizzes}
                      onCheckedChange={() => handleNotificationChange('newQuizzes')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="achievements" className="text-base">Achievements</Label>
                      <p className="text-xs text-gray-500">
                        Notify me when I earn new achievements
                      </p>
                    </div>
                    <Switch
                      id="achievements"
                      checked={notifications.achievements}
                      onCheckedChange={() => handleNotificationChange('achievements')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="level-changes" className="text-base">Level Changes</Label>
                      <p className="text-xs text-gray-500">
                        Notify me when my reading level changes
                      </p>
                    </div>
                    <Switch
                      id="level-changes"
                      checked={notifications.levelChanges}
                      onCheckedChange={() => handleNotificationChange('levelChanges')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="daily-reminders" className="text-base">Daily Reminders</Label>
                      <p className="text-xs text-gray-500">
                        Send me daily reminders to practice
                      </p>
                    </div>
                    <Switch
                      id="daily-reminders"
                      checked={notifications.dailyReminders}
                      onCheckedChange={() => handleNotificationChange('dailyReminders')}
                    />
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <Button variant="outline" className="w-full">
                    Save Notification Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

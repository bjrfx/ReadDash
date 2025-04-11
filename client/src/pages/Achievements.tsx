import { useAuth } from "@/lib/hooks";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Flame, Brain, Rocket, BookOpen, Award, Clock, Check, Target, TrendingUp } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Achievements() {
  const { user } = useAuth();
  
  // Fetch achievements data
  const { data: achievementsData, isLoading } = useQuery({
    queryKey: ['/api/user/achievements/all'],
    enabled: !!user,
  });
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2">Loading achievements...</span>
      </div>
    );
  }
  
  // Default achievements data
  const defaultAchievements = [
    {
      id: "1",
      title: "5-Day Streak",
      description: "Completed quizzes for 5 days in a row",
      icon: <Flame className="h-6 w-6" />,
      bgClass: "bg-gradient-to-br from-primary-500 to-secondary-600",
      earned: true,
      date: "Mar 15, 2023",
      progress: 100,
    },
    {
      id: "2",
      title: "Knowledge Master",
      description: "Scored 100% on 5 consecutive quizzes",
      icon: <Brain className="h-6 w-6" />,
      bgClass: "bg-gradient-to-br from-green-500 to-emerald-600",
      earned: true,
      date: "Apr 2, 2023",
      progress: 100,
    },
    {
      id: "3",
      title: "Level Up",
      description: "Advanced to reading level 8B",
      icon: <Rocket className="h-6 w-6" />,
      bgClass: "bg-gradient-to-br from-amber-500 to-orange-600",
      earned: true,
      date: "Apr 10, 2023",
      progress: 100,
    },
    {
      id: "4",
      title: "Bookworm",
      description: "Completed 20 reading passages",
      icon: <BookOpen className="h-6 w-6" />,
      bgClass: "bg-gradient-to-br from-blue-500 to-cyan-600",
      earned: true,
      date: "Apr 18, 2023",
      progress: 100,
    },
    {
      id: "5",
      title: "Golden Reader",
      description: "Earn 50 perfect scores",
      icon: <Award className="h-6 w-6" />,
      bgClass: "bg-gradient-to-br from-yellow-500 to-amber-600",
      earned: false,
      progress: 64,
    },
    {
      id: "6",
      title: "Speed Reader",
      description: "Complete 10 quizzes in under 3 minutes each",
      icon: <Clock className="h-6 w-6" />,
      bgClass: "bg-gradient-to-br from-red-500 to-rose-600",
      earned: false,
      progress: 40,
    },
    {
      id: "7",
      title: "Completionist",
      description: "Complete 100 quizzes",
      icon: <Check className="h-6 w-6" />,
      bgClass: "bg-gradient-to-br from-indigo-500 to-purple-600",
      earned: false,
      progress: 24,
    },
    {
      id: "8",
      title: "Goal Setter",
      description: "Achieve your daily reading goal for 30 days",
      icon: <Target className="h-6 w-6" />,
      bgClass: "bg-gradient-to-br from-teal-500 to-green-600",
      earned: false,
      progress: 53,
    },
    {
      id: "9",
      title: "Top 10%",
      description: "Reach the top 10% of readers on the platform",
      icon: <TrendingUp className="h-6 w-6" />,
      bgClass: "bg-gradient-to-br from-purple-500 to-pink-600",
      earned: false,
      progress: 78,
    }
  ];
  
  // Use fetched data or default
  const achievements = achievementsData || defaultAchievements;
  
  // Split achievements into earned and in-progress
  const earnedAchievements = achievements.filter(a => a.earned);
  const inProgressAchievements = achievements.filter(a => !a.earned);
  
  return (
    <>
      <MobileHeader user={user} userLevel="8B" notificationCount={3} />
      <DesktopSidebar user={user} userLevel="8B" dailyGoalProgress={2} />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-6">
          <h2 className="font-heading text-2xl font-bold mb-6">Achievements</h2>
          
          {/* Achievement Stats */}
          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Earned</p>
                  <p className="text-3xl font-bold">{earnedAchievements.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">out of {achievements.length} total</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Completion</p>
                  <p className="text-3xl font-bold">
                    {achievements.length > 0 
                      ? Math.round((earnedAchievements.length / achievements.length) * 100) 
                      : 0}%
                  </p>
                  <Progress 
                    value={achievements.length > 0 
                      ? (earnedAchievements.length / achievements.length) * 100 
                      : 0} 
                    className="h-2 w-32 mx-auto mt-2" 
                  />
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Latest</p>
                  <p className="text-xl font-medium">
                    {earnedAchievements.length > 0 ? earnedAchievements[0].title : "None yet"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {earnedAchievements.length > 0 ? earnedAchievements[0].date : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Earned Achievements */}
          <div className="mb-8">
            <h3 className="font-heading text-lg font-medium mb-4">Earned Achievements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {earnedAchievements.map((achievement) => (
                <Card key={achievement.id} className="overflow-hidden">
                  <CardContent className="p-4 text-center">
                    <div className={`w-16 h-16 mx-auto mb-3 ${achievement.bgClass} text-white rounded-full flex items-center justify-center`}>
                      {achievement.icon}
                    </div>
                    <h4 className="font-medium mb-1">{achievement.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{achievement.description}</p>
                    <Badge variant="outline" className="mx-auto">
                      Earned: {achievement.date}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* In Progress Achievements */}
          <div>
            <h3 className="font-heading text-lg font-medium mb-4">In Progress</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {inProgressAchievements.map((achievement) => (
                <Card key={achievement.id} className="overflow-hidden">
                  <CardContent className="p-4 text-center">
                    <div className={`w-16 h-16 mx-auto mb-3 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full flex items-center justify-center`}>
                      {achievement.icon}
                    </div>
                    <h4 className="font-medium mb-1">{achievement.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{achievement.description}</p>
                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}%</span>
                      </div>
                      <Progress value={achievement.progress} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <MobileNavBar currentRoute="/achievements" />
    </>
  );
}

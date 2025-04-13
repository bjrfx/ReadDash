import { useAuth } from "@/lib/hooks";
import { useUserData } from "@/lib/userData";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Flame, Brain, Rocket, BookOpen, Award, Clock, Check, Target, TrendingUp, Medal, ThumbsUp, Zap, Heart, Star, Lightbulb, Lock } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { useState, useEffect } from "react";
import SEO from "@/components/seo/SEO";

// Define all available achievements
const ALL_ACHIEVEMENTS = [
  {
    id: "streak-5",
    title: "5-Day Streak",
    description: "Completed quizzes for 5 days in a row",
    icon: <Flame className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-primary-500 to-secondary-600",
    category: "consistency"
  },
  {
    id: "streak-10",
    title: "10-Day Streak",
    description: "Completed quizzes for 10 days in a row",
    icon: <Flame className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-primary-500 to-secondary-600",
    category: "consistency"
  },
  {
    id: "streak-30",
    title: "Monthly Master",
    description: "Completed quizzes for 30 days in a row",
    icon: <Flame className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-primary-500 to-secondary-600",
    category: "consistency"
  },
  {
    id: "perfect-5",
    title: "Knowledge Master",
    description: "Scored 100% on 5 consecutive quizzes",
    icon: <Brain className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-green-500 to-emerald-600",
    category: "accuracy"
  },
  {
    id: "level-up",
    title: "Level Up",
    description: "Advanced to a higher reading level",
    icon: <Rocket className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-amber-500 to-orange-600",
    category: "progress"
  },
  {
    id: "passages-20",
    title: "Bookworm",
    description: "Completed 20 reading passages",
    icon: <BookOpen className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-blue-500 to-cyan-600",
    category: "volume"
  },
  {
    id: "perfect-50",
    title: "Golden Reader",
    description: "Earn 50 perfect scores",
    icon: <Award className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-yellow-500 to-amber-600",
    category: "accuracy"
  },
  {
    id: "speed-10",
    title: "Speed Reader",
    description: "Complete 10 quizzes in under 3 minutes each",
    icon: <Clock className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-red-500 to-rose-600",
    category: "speed"
  },
  {
    id: "quizzes-100",
    title: "Completionist",
    description: "Complete 100 quizzes",
    icon: <Check className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-indigo-500 to-purple-600",
    category: "volume"
  },
  {
    id: "daily-30",
    title: "Goal Setter",
    description: "Achieve your daily reading goal for 30 days",
    icon: <Target className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-teal-500 to-green-600",
    category: "consistency"
  },
  {
    id: "top-10",
    title: "Top 10%",
    description: "Reach the top 10% of readers on the platform",
    icon: <TrendingUp className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-purple-500 to-pink-600",
    category: "rank"
  },
  {
    id: "points-1000",
    title: "Point Collector",
    description: "Earn 1,000 knowledge points",
    icon: <Star className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-yellow-500 to-orange-600",
    category: "points"
  },
  {
    id: "first-quiz",
    title: "First Steps",
    description: "Complete your first quiz",
    icon: <Medal className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-blue-500 to-indigo-600",
    category: "milestones"
  },
  {
    id: "variety-5",
    title: "Well-Rounded Reader",
    description: "Complete quizzes in 5 different categories",
    icon: <Lightbulb className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-purple-500 to-violet-600",
    category: "diversity"
  },
  {
    id: "challenge-complete",
    title: "Challenge Accepted",
    description: "Complete a reading challenge",
    icon: <Zap className="h-6 w-6" />,
    bgClass: "bg-gradient-to-br from-pink-500 to-rose-600",
    category: "challenges"
  }
];

export default function Achievements() {
  const { user } = useAuth();
  const { data: userData } = useUserData();
  const [activeTab, setActiveTab] = useState("earned");
  
  // Fetch user achievements from Firestore
  const { data: userAchievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['userAchievements', user?.uid],
    enabled: !!user?.uid,
    queryFn: async () => {
      try {
        console.log("Fetching user achievements from Firestore...");
        
        const achievementsRef = collection(db, "achievements");
        const achievementsQuery = query(
          achievementsRef,
          where("userId", "==", user.uid),
          orderBy("earnedAt", "desc")
        );
        
        const snapshot = await getDocs(achievementsQuery);
        console.log(`Found ${snapshot.docs.length} achievements`);
        
        if (snapshot.empty) {
          console.log("No achievements found for this user");
          return [];
        }
        
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: data.achievementId,
            earnedAt: data.earnedAt?.toDate(),
            progress: 100
          };
        });
      } catch (error) {
        console.error("Error fetching achievements:", error);
        return [];
      }
    }
  });
  
  // Fetch user quiz stats to calculate progress for unearned achievements
  const { data: quizStats, isLoading: statsLoading } = useQuery({
    queryKey: ['quizStats', user?.uid],
    enabled: !!user?.uid,
    queryFn: async () => {
      try {
        console.log("Fetching quiz stats for achievement progress...");
        
        const quizResultsRef = collection(db, "quizResults");
        const quizQuery = query(
          quizResultsRef,
          where("userId", "==", user.uid)
        );
        
        const snapshot = await getDocs(quizQuery);
        console.log(`Found ${snapshot.docs.length} quiz results`);
        
        if (snapshot.empty) {
          return {
            totalQuizzes: 0,
            perfectScores: 0,
            fastCompletions: 0,
            categories: new Set(),
            streakDays: 0
          };
        }
        
        let totalQuizzes = 0;
        let perfectScores = 0;
        let fastCompletions = 0;
        const categories = new Set();
        const dateSet = new Set();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          
          totalQuizzes++;
          
          // Count perfect scores
          if (data.score === 100 || data.score === 1) {
            perfectScores++;
          }
          
          // Count fast completions
          if (data.timeSpent && data.timeSpent < 180) { // Less than 3 minutes
            fastCompletions++;
          }
          
          // Track categories
          if (data.category) {
            categories.add(data.category);
          }
          
          // Track unique days for streak calculation
          if (data.completedAt) {
            const date = data.completedAt.toDate();
            dateSet.add(date.toDateString());
          }
        });
        
        return {
          totalQuizzes,
          perfectScores,
          fastCompletions,
          categories: categories.size,
          streakDays: dateSet.size
        };
      } catch (error) {
        console.error("Error fetching quiz stats:", error);
        return null;
      }
    }
  });
  
  // Show loading state
  if (achievementsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2">Loading achievements...</span>
      </div>
    );
  }
  
  // Process achievements to combine with ALL_ACHIEVEMENTS
  const processedAchievements = ALL_ACHIEVEMENTS.map(achievement => {
    // Check if user has earned this achievement
    const userAchievement = userAchievements?.find(a => a.id === achievement.id);
    
    // If earned, return with earned data
    if (userAchievement) {
      return {
        ...achievement,
        earned: true,
        earnedAt: userAchievement.earnedAt,
        date: userAchievement.earnedAt ? new Date(userAchievement.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date',
        progress: 100
      };
    }
    
    // Calculate progress for unearned achievements
    let progress = 0;
    
    if (quizStats) {
      switch (achievement.id) {
        case 'streak-5':
          progress = Math.min(100, (quizStats.streakDays / 5) * 100);
          break;
        case 'streak-10':
          progress = Math.min(100, (quizStats.streakDays / 10) * 100);
          break;
        case 'streak-30':
          progress = Math.min(100, (quizStats.streakDays / 30) * 100);
          break;
        case 'perfect-5':
          progress = Math.min(100, (quizStats.perfectScores / 5) * 100);
          break;
        case 'perfect-50':
          progress = Math.min(100, (quizStats.perfectScores / 50) * 100);
          break;
        case 'speed-10':
          progress = Math.min(100, (quizStats.fastCompletions / 10) * 100);
          break;
        case 'passages-20':
          progress = Math.min(100, (quizStats.totalQuizzes / 20) * 100);
          break;
        case 'quizzes-100':
          progress = Math.min(100, (quizStats.totalQuizzes / 100) * 100);
          break;
        case 'variety-5':
          progress = Math.min(100, (quizStats.categories / 5) * 100);
          break;
        default:
          // Default to a random progress for other achievements
          progress = Math.floor(Math.random() * 70);
      }
    }
    
    return {
      ...achievement,
      earned: false,
      progress: Math.round(progress)
    };
  });
  
  // Split achievements into earned and in-progress
  const earnedAchievements = processedAchievements.filter(a => a.earned);
  const inProgressAchievements = processedAchievements.filter(a => !a.earned);
  
  return (
    <>
      <SEO 
        title="Achievements | ReadDash - Track Your Reading Milestones"
        description="View your reading accomplishments, track progress towards new achievements, and set goals to improve your reading skills with ReadDash."
        keywords="reading achievements, reading milestones, reading goals, reading progress tracking"
        canonicalUrl="/achievements"
      />
      <MobileHeader user={user} userLevel={userData?.readingLevel || "1A"} notificationCount={3} />
      <DesktopSidebar user={user} userLevel={userData?.readingLevel || "1A"} dailyGoalProgress={2} />
      
      <MainLayout currentRoute="/achievements">
        <div className="p-4 sm:p-6">
          <h2 className="font-heading text-2xl font-bold mb-6">Achievements</h2>
          
          {/* Achievement Stats */}
          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Earned</p>
                  <p className="text-3xl font-bold">{earnedAchievements.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">out of {processedAchievements.length} total</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Completion</p>
                  <p className="text-3xl font-bold">
                    {processedAchievements.length > 0 
                      ? Math.round((earnedAchievements.length / processedAchievements.length) * 100) 
                      : 0}%
                  </p>
                  <Progress 
                    value={processedAchievements.length > 0 
                      ? (earnedAchievements.length / processedAchievements.length) * 100 
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
          
          {/* Achievements Tabs */}
          <Tabs defaultValue="earned" className="mb-6" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="earned">Earned Achievements</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="all">All Achievements</TabsTrigger>
            </TabsList>
            
            {/* Earned Achievements Tab */}
            <TabsContent value="earned">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {earnedAchievements.length > 0 ? (
                  earnedAchievements.map((achievement) => (
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
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No achievements earned yet. Keep reading and taking quizzes!</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* In Progress Achievements Tab */}
            <TabsContent value="in-progress">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {inProgressAchievements.length > 0 ? (
                  inProgressAchievements.map((achievement) => (
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
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 text-gray-500">
                    <Check className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>You've earned all available achievements. Great job!</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* All Achievements Tab */}
            <TabsContent value="all">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {processedAchievements.map((achievement) => (
                  <Card key={achievement.id} className="overflow-hidden relative">
                    <CardContent className="p-4 text-center">
                      <div className={`w-16 h-16 mx-auto mb-3 ${
                        achievement.earned 
                          ? achievement.bgClass 
                          : "bg-gray-200 dark:bg-gray-700"
                      } ${
                        achievement.earned 
                          ? "text-white" 
                          : "text-gray-500 dark:text-gray-400"
                      } rounded-full flex items-center justify-center`}>
                        {achievement.icon}
                      </div>
                      <h4 className="font-medium mb-1">{achievement.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{achievement.description}</p>
                      
                      {achievement.earned ? (
                        <Badge variant="outline" className="mx-auto">
                          Earned: {achievement.date}
                        </Badge>
                      ) : (
                        <div className="absolute top-2 right-2">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </>
  );
}

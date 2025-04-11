import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProgressCharts } from "@/components/dashboard/ProgressCharts";
import { AchievementsList } from "@/components/dashboard/AchievementsList";
import { RecommendedQuizzes } from "@/components/dashboard/RecommendedQuizzes";
import { Flame, Brain, Rocket, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/user/stats'],
    enabled: !!user,
  });
  
  // Fetch achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/user/achievements'],
    enabled: !!user,
  });
  
  // Fetch recommended quizzes
  const { data: recommendedQuizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ['/api/quizzes/recommended'],
    enabled: !!user,
  });
  
  // Default values for when data is loading
  const defaultStats = {
    readingLevel: "1A",
    previousLevel: "1A",
    quizzesCompleted: 0,
    quizzesThisWeek: 0,
    knowledgePoints: 0,
    pointsToNextLevel: 500,
  };
  
  const defaultWeeklyActivity = [
    { day: "Mon", count: 0, isActive: false },
    { day: "Tue", count: 0, isActive: false },
    { day: "Wed", count: 0, isActive: false },
    { day: "Thu", count: 0, isActive: false },
    { day: "Fri", count: 0, isActive: true },
    { day: "Sat", count: 0, isActive: false },
    { day: "Sun", count: 0, isActive: false },
  ];
  
  const defaultReadingLevels = [
    { id: "1", label: "5A", status: "completed" as const },
    { id: "2", label: "6A", status: "completed" as const },
    { id: "3", label: "7B", status: "current" as const },
    { id: "4", label: "8A", status: "upcoming" as const },
    { id: "5", label: "9A", status: "goal" as const },
  ];
  
  const defaultAchievements = [
    {
      id: "1",
      title: "5-Day Streak",
      description: "Completed quizzes for 5 days in a row",
      icon: <Flame className="h-6 w-6" />,
      bgClass: "bg-gradient-to-br from-primary-500 to-secondary-600",
    },
    {
      id: "2",
      title: "Knowledge Master",
      description: "Scored 100% on 5 consecutive quizzes",
      icon: <Brain className="h-6 w-6" />,
      bgClass: "bg-gradient-to-br from-green-500 to-emerald-600",
    },
    {
      id: "3",
      title: "Level Up",
      description: "Advanced to reading level 8B",
      icon: <Rocket className="h-6 w-6" />,
      bgClass: "bg-gradient-to-br from-amber-500 to-orange-600",
    },
    {
      id: "4",
      title: "Bookworm",
      description: "Completed 20 reading passages",
      icon: <BookOpen className="h-6 w-6" />,
      bgClass: "bg-gradient-to-br from-blue-500 to-cyan-600",
    }
  ];
  
  const defaultQuizzes = [
    {
      id: "1",
      title: "The Wonders of Marine Biology",
      description: "Explore the fascinating world beneath the ocean's surface...",
      image: "",
      readingLevel: "8B",
      category: "Science",
    },
    {
      id: "2",
      title: "Space Exploration: Past and Future",
      description: "The history and future prospects of human space travel...",
      image: "",
      readingLevel: "8A",
      category: "History/Science",
    },
    {
      id: "3",
      title: "Modern Architecture and Design",
      description: "Exploring the principles behind contemporary buildings...",
      image: "",
      readingLevel: "8B",
      category: "Arts",
    }
  ];
  
  const stats = userStats || defaultStats;
  
  // Prepare achievements data for the component
  const achievementsData = achievements || defaultAchievements;
  
  // Prepare quizzes data for the component
  const quizzesData = recommendedQuizzes || defaultQuizzes;
  
  // Get weekly activity and levels from user stats
  const weeklyActivity = userStats?.weeklyActivity || defaultWeeklyActivity;
  const readingLevels = userStats?.readingLevels || defaultReadingLevels;
  const currentProgress = userStats?.currentProgress || 78;
  
  return (
    <>
      <MobileHeader user={user} userLevel={stats.readingLevel} notificationCount={3} />
      <DesktopSidebar user={user} userLevel={stats.readingLevel} dailyGoalProgress={2} />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-6">
          <DashboardHeader stats={stats} />
          
          <ProgressCharts 
            weeklyActivity={weeklyActivity} 
            readingLevels={readingLevels} 
            currentProgress={currentProgress} 
          />
          
          <AchievementsList achievements={achievementsData} />
          
          <RecommendedQuizzes quizzes={quizzesData} />
        </div>
      </main>
      
      <MobileNavBar currentRoute="/" />
    </>
  );
}

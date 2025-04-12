import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProgressCharts } from "@/components/dashboard/ProgressCharts";
import { AchievementsList } from "@/components/dashboard/AchievementsList";
import { RecommendedQuizzes } from "@/components/dashboard/RecommendedQuizzes";
import { Flame, Brain, Rocket, BookOpen, Award } from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  doc,
  getDoc  
} from "firebase/firestore";

export default function Dashboard() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [recommendedQuizzes, setRecommendedQuizzes] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch data from Firebase when user is authenticated
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchUserStats(),
          fetchAchievements(),
          fetchRecommendedQuizzes()
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // Fetch user stats from Firestore
  const fetchUserStats = async () => {
    // Get user profile
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error("User document not found");
      return;
    }
    
    const userData = userSnap.data();
    
    // Get completed quizzes for counting
    const quizResultsRef = collection(db, "quizResults");
    const quizResultsQuery = query(
      quizResultsRef,
      where("userId", "==", user.uid)
    );
    const quizResultsSnap = await getDocs(quizResultsQuery);
    
    // Count quizzes completed this week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const quizzesThisWeek = quizResultsSnap.docs.filter(doc => {
      const completedAt = doc.data().completedAt?.toDate();
      return completedAt && completedAt >= startOfWeek;
    }).length;
    
    // Count unique quizzes (excluding retakes)
    const uniqueQuizIds = new Set();
    quizResultsSnap.docs.forEach(doc => {
      uniqueQuizIds.add(doc.data().quizId);
    });
    
    // Get weekly activity data
    const weeklyActivity = getWeeklyActivityData(quizResultsSnap.docs);
    
    // Get reading levels progression
    const readingLevels = getReadingLevelsProgression(userData.readingLevel || "1A");
    
    // Calculate knowledge points and progress to next level
    const knowledgePoints = userData.knowledgePoints || 0;
    const pointsThresholds = {
      "1A": 0, "1B": 100, 
      "2A": 250, "2B": 400, 
      "3A": 600, "3B": 800,
      "4A": 1000, "4B": 1200,
      "5A": 1500, "5B": 1800,
      "6A": 2100, "6B": 2400,
      "7A": 2800, "7B": 3200,
      "8A": 3600, "8B": 4000,
      "9A": 4500, "9B": 5000,
      "10A": 5500, "10B": 6000,
      "11A": 6500, "11B": 7000,
      "12A": 7500, "12B": 8000
    };
    
    const currentLevelPoints = pointsThresholds[userData.readingLevel] || 0;
    const nextLevelKey = getNextReadingLevel(userData.readingLevel);
    const nextLevelPoints = pointsThresholds[nextLevelKey] || (currentLevelPoints + 500);
    const pointsToNextLevel = nextLevelPoints - currentLevelPoints;
    const currentProgress = Math.min(
      Math.round(((knowledgePoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100),
      100
    );
    
    // Get previous reading level
    const previousLevel = getPreviousReadingLevel(userData.readingLevel) || userData.readingLevel;
    
    // Construct user stats object
    const stats = {
      readingLevel: userData.readingLevel || "1A",
      previousLevel,
      quizzesCompleted: uniqueQuizIds.size,
      quizzesThisWeek,
      knowledgePoints,
      pointsToNextLevel,
      weeklyActivity,
      readingLevels,
      currentProgress
    };
    
    setUserStats(stats);
  };
  
  // Helper function to get weekly activity data
  const getWeeklyActivityData = (quizDocs) => {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const currentDayIndex = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Initialize counts for each day of the week
    const dayCounts = Array(7).fill(0);
    
    // Count quizzes completed on each day of the current week
    quizDocs.forEach(doc => {
      const completedAt = doc.data().completedAt?.toDate();
      if (!completedAt) return;
      
      // Check if quiz was completed in the current week
      const daysSinceCompleted = Math.floor((today - completedAt) / (1000 * 60 * 60 * 24));
      if (daysSinceCompleted < 7 && daysSinceCompleted >= 0) {
        const dayIndex = completedAt.getDay();
        dayCounts[dayIndex]++;
      }
    });
    
    // Format data for the component
    return daysOfWeek.map((day, index) => ({
      day,
      count: dayCounts[index],
      isActive: index === currentDayIndex
    }));
  };
  
  // Helper function to get reading levels progression
  const getReadingLevelsProgression = (currentLevel) => {
    const levels = [
      "1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B",
      "6A", "6B", "7A", "7B", "8A", "8B", "9A", "9B", "10A", "10B",
      "11A", "11B", "12A", "12B"
    ];
    
    const currentIndex = levels.indexOf(currentLevel);
    if (currentIndex === -1) return defaultReadingLevels;
    
    // Get two previous levels (if available)
    const previousLevels = levels
      .slice(Math.max(0, currentIndex - 2), currentIndex)
      .map((label, i) => ({
        id: `prev-${i}`,
        label,
        status: 'completed' as const
      }));
    
    // Current level
    const current = {
      id: "current",
      label: currentLevel,
      status: 'current' as const
    };
    
    // Get next level and goal level (two levels ahead)
    const nextLevels = levels
      .slice(currentIndex + 1, Math.min(levels.length, currentIndex + 3))
      .map((label, i) => ({
        id: `next-${i}`,
        label,
        status: i === 0 ? 'upcoming' as const : 'goal' as const
      }));
    
    return [...previousLevels, current, ...nextLevels];
  };
  
  // Helper function to get the next reading level
  const getNextReadingLevel = (currentLevel) => {
    const levels = [
      "1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B",
      "6A", "6B", "7A", "7B", "8A", "8B", "9A", "9B", "10A", "10B",
      "11A", "11B", "12A", "12B"
    ];
    
    const currentIndex = levels.indexOf(currentLevel);
    if (currentIndex === -1 || currentIndex === levels.length - 1) {
      // If current level not found or is already the highest, return current level
      return currentLevel;
    }
    
    return levels[currentIndex + 1];
  };
  
  // Helper function to get the previous reading level
  const getPreviousReadingLevel = (currentLevel) => {
    const levels = [
      "1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B",
      "6A", "6B", "7A", "7B", "8A", "8B", "9A", "9B", "10A", "10B",
      "11A", "11B", "12A", "12B"
    ];
    
    const currentIndex = levels.indexOf(currentLevel);
    if (currentIndex <= 0) {
      // If current level not found or is already the lowest, return current level
      return currentLevel;
    }
    
    return levels[currentIndex - 1];
  };
  
  // Fetch user achievements from Firestore
  const fetchAchievements = async () => {
    const achievementsRef = collection(db, "userAchievements");
    const achievementsQuery = query(
      achievementsRef,
      where("userId", "==", user.uid),
      orderBy("unlockedAt", "desc"),
      limit(4)
    );
    
    const achievementsSnap = await getDocs(achievementsQuery);
    
    if (achievementsSnap.empty) {
      // If no achievements yet, leave default achievements
      return;
    }
    
    // Map achievement types to icons and background colors
    const achievementIcons = {
      'streak': <Flame className="h-6 w-6" />,
      'quiz_master': <Brain className="h-6 w-6" />,
      'level_up': <Rocket className="h-6 w-6" />,
      'passage_count': <BookOpen className="h-6 w-6" />,
      'perfect_score': <Award className="h-6 w-6" />
    };
    
    const achievementBgClasses = {
      'streak': "bg-gradient-to-br from-primary-500 to-secondary-600",
      'quiz_master': "bg-gradient-to-br from-green-500 to-emerald-600",
      'level_up': "bg-gradient-to-br from-amber-500 to-orange-600",
      'passage_count': "bg-gradient-to-br from-blue-500 to-cyan-600",
      'perfect_score': "bg-gradient-to-br from-purple-500 to-pink-600"
    };
    
    const userAchievements = achievementsSnap.docs.map(doc => {
      const data = doc.data();
      const achievementType = data.type || 'streak';
      
      return {
        id: doc.id,
        title: data.title || "Achievement Unlocked",
        description: data.description || "You earned a new achievement!",
        icon: achievementIcons[achievementType] || <Award className="h-6 w-6" />,
        bgClass: achievementBgClasses[achievementType] || "bg-gradient-to-br from-primary-500 to-secondary-600"
      };
    });
    
    setAchievements(userAchievements);
  };
  
  // Fetch recommended quizzes from Firestore
  const fetchRecommendedQuizzes = async () => {
    // First, get user's reading level
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return;
    
    const userReadingLevel = userSnap.data().readingLevel || "1A";
    
    // Query quizzes matching user's reading level
    const quizzesRef = collection(db, "quizzes");
    let quizzesQuery = query(
      quizzesRef,
      where("readingLevel", "==", userReadingLevel),
      limit(3)
    );
    
    let quizzesSnap = await getDocs(quizzesQuery);
    
    // If not enough quizzes at exact level, query one level below or above
    if (quizzesSnap.docs.length < 3) {
      const adjacentLevels = [
        getPreviousReadingLevel(userReadingLevel),
        getNextReadingLevel(userReadingLevel)
      ];
      
      for (const level of adjacentLevels) {
        if (quizzesSnap.docs.length >= 3) break;
        
        const additionalQuery = query(
          quizzesRef,
          where("readingLevel", "==", level),
          limit(3 - quizzesSnap.docs.length)
        );
        
        const additionalSnap = await getDocs(additionalQuery);
        quizzesSnap = {
          docs: [...quizzesSnap.docs, ...additionalSnap.docs]
        };
      }
    }
    
    // Check which quizzes user has already completed
    const quizResultsRef = collection(db, "quizResults");
    const quizResultsQuery = query(
      quizResultsRef,
      where("userId", "==", user.uid)
    );
    const quizResultsSnap = await getDocs(quizResultsQuery);
    
    const completedQuizIds = new Set();
    quizResultsSnap.docs.forEach(doc => {
      completedQuizIds.add(doc.data().quizId);
    });
    
    // Process quiz data
    const recommendedQuizList = quizzesSnap.docs
      .filter(doc => !completedQuizIds.has(doc.id)) // Filter out completed quizzes
      .map(doc => {
        const data = doc.data();
        // Generate description from the passage if none exists
        const description = data.description || 
          (data.passage ? data.passage.substring(0, 120) + "..." : "Take this quiz to test your reading comprehension.");
        
        return {
          id: doc.id,
          title: data.title || "Reading Quiz",
          description,
          image: data.imageUrl || "",
          readingLevel: data.readingLevel || "1A",
          category: data.category || "Reading"
        };
      });
    
    setRecommendedQuizzes(recommendedQuizList);
  };
  
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

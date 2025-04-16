import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProgressCharts } from "@/components/dashboard/ProgressCharts";
import { AchievementsList } from "@/components/dashboard/AchievementsList";
import { RecommendedQuizzes } from "@/components/dashboard/RecommendedQuizzes";
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders";
import { Flame, Brain, Rocket, BookOpen, Award, Clock, Check, Target, TrendingUp, Medal, ThumbsUp, Zap, Heart, Star, Lightbulb } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc, Timestamp } from "firebase/firestore";
import SEO from "@/components/seo/SEO";

// Define all available achievements with their details
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

export default function Dashboard() {
  const { user } = useAuth();
  
  // Default values for weekly activity
  const defaultWeeklyActivity = [
    { day: "Mon", count: 0, isActive: false },
    { day: "Tue", count: 0, isActive: false },
    { day: "Wed", count: 0, isActive: false },
    { day: "Thu", count: 0, isActive: false },
    { day: "Fri", count: 0, isActive: false },
    { day: "Sat", count: 0, isActive: false },
    { day: "Sun", count: 0, isActive: false },
  ];
  
  // State to store real weekly activity data
  const [weeklyActivityData, setWeeklyActivityData] = useState(defaultWeeklyActivity);
  
  // Fetch user data including reading level from Firestore
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['userData'],
    enabled: !!user?.uid,
    queryFn: async () => {
      try {
        console.log("Fetching user data from Firestore...");
        if (!user?.uid) return null;
        
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          console.log("User data:", userDoc.data());
          return userDoc.data();
        } else {
          console.log("No user document found");
          return null;
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
      }
    }
  });
  
  // Fetch weekly activity data from Firestore
  const { data: weeklyActivity, isLoading: weeklyActivityLoading } = useQuery({
    queryKey: ['weeklyActivity', user?.uid],
    enabled: !!user?.uid,
    queryFn: async () => {
      try {
        console.log("Fetching weekly activity data from Firestore...");
        if (!user?.uid) return defaultWeeklyActivity;
        const today = new Date();
        const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
        const weeklyActivity = [...defaultWeeklyActivity];
        weeklyActivity[currentDayIndex].isActive = true;
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDayIndex);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        console.log("Weekly activity range:", { startOfWeek: startOfWeek.toISOString(), endOfWeek: endOfWeek.toISOString() });
        const quizResultsRef = collection(db, "quizResults");
        const weeklyQuery = query(
          quizResultsRef,
          where("userId", "==", user.uid),
          where("completedAt", ">=", Timestamp.fromDate(startOfWeek)),
          where("completedAt", "<=", Timestamp.fromDate(endOfWeek))
        );
        const quizSnapshot = await getDocs(weeklyQuery);
        console.log(`Found ${quizSnapshot.docs.length} quizzes this week (Firestore query)`);
        // Fallback: fetch all user's quizResults if query returns 0, to handle non-Timestamp completedAt
        let allDocs = quizSnapshot.docs;
        if (quizSnapshot.docs.length === 0) {
          const allQuery = query(quizResultsRef, where("userId", "==", user.uid));
          const allSnapshot = await getDocs(allQuery);
          allDocs = allSnapshot.docs;
          console.log(`Fallback: found ${allDocs.length} total quizzes for user`);
        }
        // Count quizzes for each day of the week
        allDocs.forEach(doc => {
          const data = doc.data();
          let completionDate: Date | null = null;
          if (data.completedAt) {
            if (typeof data.completedAt.toDate === "function") {
              completionDate = data.completedAt.toDate();
            } else if (typeof data.completedAt === "string") {
              completionDate = new Date(data.completedAt);
            } else if (data.completedAt instanceof Date) {
              completionDate = data.completedAt;
            }
          }
          if (
            completionDate &&
            completionDate >= startOfWeek &&
            completionDate <= endOfWeek
          ) {
            const dayOfWeek = completionDate.getDay();
            const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            weeklyActivity[dayIndex].count += 1;
          }
        });
        console.log("Weekly activity data (final):", weeklyActivity);
        return weeklyActivity;
      } catch (error) {
        console.error("Error fetching weekly activity data:", error);
        return defaultWeeklyActivity;
      }
    }
  });
  
  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/user/stats'],
    enabled: !!user,
  });
  
  // Fetch real user achievements from Firestore
  const { data: userAchievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['userAchievements', user?.uid],
    enabled: !!user?.uid,
    queryFn: async () => {
      try {
        console.log("Fetching real user achievements from Firestore...");
        
        if (!user?.uid) return [];
        
        const achievementsRef = collection(db, "achievements");
        const achievementsQuery = query(
          achievementsRef,
          where("userId", "==", user.uid),
          orderBy("earnedAt", "desc"),
          limit(4) // Limit to 4 most recent achievements for dashboard
        );
        
        const snapshot = await getDocs(achievementsQuery);
        console.log(`Found ${snapshot.docs.length} achievements for dashboard`);
        
        if (snapshot.empty) {
          console.log("No achievements found for this user");
          return [];
        }
        
        // Map the achievements data to our required format
        return snapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`Achievement data for ${doc.id}:`, data);
          
          // Find the achievement definition in our ALL_ACHIEVEMENTS array
          const achievementDef = ALL_ACHIEVEMENTS.find(a => a.id === data.achievementId);
          
          if (!achievementDef) {
            console.warn(`Achievement definition not found for ${data.achievementId}`);
            return null;
          }
          
          // Format the earned date
          const earnedDate = data.earnedAt?.toDate();
          const formattedDate = earnedDate 
            ? new Date(earnedDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              }) 
            : 'Unknown date';
          
          return {
            id: data.achievementId,
            title: achievementDef.title,
            description: achievementDef.description,
            icon: achievementDef.icon,
            bgClass: achievementDef.bgClass,
            earnedAt: earnedDate,
            date: formattedDate
          };
        }).filter(Boolean); // Remove any null values
      } catch (error) {
        console.error("Error fetching achievements:", error);
        return [];
      }
    }
  });
  
  // Fetch recommended quizzes from Firestore
  const { data: recommendedQuizzes, isLoading: quizzesLoading, error: quizzesError } = useQuery({
    queryKey: ['recommendedQuizzes'],
    enabled: !!user,
    queryFn: async () => {
      try {
        console.log("Fetching recommended quizzes from Firestore...");
        
        // Option 1: First try with where clause and orderBy 
        // (might require composite index)
        try {
          const quizzesRef = collection(db, "quizzes");
          const quizzesQuery = query(
            quizzesRef,
            where("isRecommended", "==", true),
            orderBy("createdAt", "desc"),
            limit(5)
          );
          
          const quizzesSnapshot = await getDocs(quizzesQuery);
          console.log(`Found ${quizzesSnapshot.docs.length} recommended quizzes with where+orderBy`);
          
          if (quizzesSnapshot.docs.length > 0) {
            // Map the documents to the format expected by RecommendedQuizzes
            return quizzesSnapshot.docs.map(doc => {
              const data = doc.data();
              console.log(`Quiz data for ${doc.id}:`, data);
              return {
                id: doc.id,
                title: data.title || "Untitled Quiz",
                description: data.description || (data.passage ? data.passage.substring(0, 120) + "..." : "No description available"),
                image: data.imageUrl || "",
                readingLevel: data.readingLevel || "N/A",
                category: data.category || "Uncategorized",
              };
            });
          }
        } catch (indexError) {
          console.error("Error with first query approach:", indexError);
          // If index error, we'll continue to the next approach
        }
        
        // Option 2: If the first query fails, try without orderBy
        // (in case there's no composite index setup)
        const simpleQuery = query(
          collection(db, "quizzes"),
          where("isRecommended", "==", true),
          limit(5)
        );
        
        const simpleSnapshot = await getDocs(simpleQuery);
        console.log(`Found ${simpleSnapshot.docs.length} recommended quizzes with simple query`);
        
        if (simpleSnapshot.docs.length > 0) {
          return simpleSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log(`Quiz data for ${doc.id}:`, data);
            return {
              id: doc.id,
              title: data.title || "Untitled Quiz",
              description: data.description || (data.passage ? data.passage.substring(0, 120) + "..." : "No description available"),
              image: data.imageUrl || "",
              readingLevel: data.readingLevel || "N/A",
              category: data.category || "Uncategorized",
            };
          });
        }
        
        // Option 3: As a last resort, get all quizzes and filter client-side
        console.log("No results with recommended flag, fetching all quizzes...");
        const allQuizzesQuery = query(
          collection(db, "quizzes"),
          limit(5)
        );
        
        const allQuizzesSnapshot = await getDocs(allQuizzesQuery);
        console.log(`Found ${allQuizzesSnapshot.docs.length} total quizzes`);
        
        // Log all quizzes to see their structure
        allQuizzesSnapshot.docs.forEach(doc => {
          console.log(`Quiz ${doc.id}:`, doc.data());
        });
        
        // If we have any quizzes at all, return them
        if (allQuizzesSnapshot.docs.length > 0) {
          return allQuizzesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title || "Untitled Quiz",
              description: data.description || (data.passage ? data.passage.substring(0, 120) + "..." : "No description available"),
              image: data.imageUrl || "",
              readingLevel: data.readingLevel || "N/A",
              category: data.category || "Uncategorized",
            };
          });
        }
        
        console.log("No quizzes found at all in the database");
        return [];
      } catch (error) {
        console.error("Error fetching recommended quizzes:", error);
        throw error;
      }
    }
  });
  
  // Fetch user quiz completion data from Firestore
  const { data: quizCompletionData, isLoading: quizCompletionLoading } = useQuery({
    queryKey: ['quizCompletionData', user?.uid],
    enabled: !!user?.uid,
    queryFn: async () => {
      try {
        console.log("Fetching quiz completion data from Firestore...");
        if (!user?.uid) return null;
        
        const quizResultsRef = collection(db, "quizResults");
        const quizQuery = query(
          quizResultsRef,
          where("userId", "==", user.uid)
        );
        
        const quizSnapshot = await getDocs(quizQuery);
        console.log(`Found ${quizSnapshot.docs.length} completed quizzes for this user`);
        
        // Get current date and calculate the start of the current week
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Count quizzes completed this week
        let quizzesThisWeek = 0;
        
        // Process quiz results
        quizSnapshot.docs.forEach(doc => {
          const data = doc.data();
          
          // Check if quiz was completed this week
          if (data.completedAt && data.completedAt.toDate() >= startOfWeek) {
            quizzesThisWeek++;
          }
        });
        
        return {
          quizzesCompleted: quizSnapshot.docs.length,
          quizzesThisWeek: quizzesThisWeek
        };
      } catch (error) {
        console.error("Error fetching quiz completion data:", error);
        return null;
      }
    }
  });
  
  // Fetch reading level progress data
  const { data: readingLevelData, isLoading: readingLevelLoading } = useQuery({
    queryKey: ['readingLevelProgress', user?.uid, userData?.readingLevel],
    enabled: !!user?.uid && !!userData?.readingLevel,
    queryFn: async () => {
      try {
        console.log("Generating reading level progress data based on user's level");
        
        if (!userData?.readingLevel) {
          console.log("No reading level in user data, using default");
          return null;
        }
        
        // Parse the current reading level
        const currentLevelRaw = userData.readingLevel;
        console.log("Current reading level:", currentLevelRaw);
        
        // Extract number and letter from reading level (e.g., "5A" -> 5, "A")
        const levelMatch = currentLevelRaw.match(/(\d+)([A-Z])/);
        if (!levelMatch) {
          console.error("Invalid reading level format:", currentLevelRaw);
          return null;
        }
        
        const currentLevelNum = parseInt(levelMatch[1]);
        const currentLevelLetter = levelMatch[2];
        
        console.log("Parsed level:", { num: currentLevelNum, letter: currentLevelLetter });
        
        // Define the level sequence - 2 levels behind, current, 1 level ahead, and goal (2 levels ahead)
        const generateLevelSequence = () => {
          const levels = [];
          let startLevel = currentLevelNum - 2; // Start 2 levels behind
          
          // Ensure we don't go below level 1
          if (startLevel < 1) {
            startLevel = 1;
          }
          
          // Generate previous levels (completed)
          for (let i = startLevel; i < currentLevelNum; i++) {
            levels.push({
              id: `${i}A`,
              label: `${i}A`,
              status: 'completed' as const
            });
            
            // Add B level if we're not at the current level yet
            if (i < currentLevelNum - 1 || (i === currentLevelNum - 1 && currentLevelLetter === 'B')) {
              levels.push({
                id: `${i}B`,
                label: `${i}B`,
                status: 'completed' as const
              });
            }
          }
          
          // Add current level
          levels.push({
            id: currentLevelRaw,
            label: currentLevelRaw,
            status: 'current' as const
          });
          
          // Add next level (upcoming)
          const nextLevel = currentLevelLetter === 'A' 
            ? `${currentLevelNum}B` 
            : `${currentLevelNum + 1}A`;
            
          levels.push({
            id: nextLevel,
            label: nextLevel,
            status: 'upcoming' as const
          });
          
          // Add goal level (2 levels ahead)
          const goalLevelNum = currentLevelLetter === 'A' 
            ? currentLevelNum + 1 
            : currentLevelNum + 2;
            
          const goalLevel = `${goalLevelNum}A`;
          
          levels.push({
            id: goalLevel,
            label: goalLevel,
            status: 'goal' as const
          });
          
          // If we have too many levels, trim to show 5 total
          if (levels.length > 5) {
            return levels.slice(levels.length - 5);
          }
          
          return levels;
        };
        
        const readingLevels = generateLevelSequence();
        console.log("Generated reading level sequence:", readingLevels);
        
        // Calculate current progress
        // For simplicity, we'll use a random value between 50-90% for the progress within the current level
        // In a real app, this would be calculated based on quiz performance or points
        const pointsToNextLevel = userData.pointsToNextLevel || 100;
        const knowledgePoints = userData.knowledgePoints || 0;
        
        // Calculate progress percentage
        let currentProgress;
        if (pointsToNextLevel > 0) {
          // If we have pointsToNextLevel data, calculate real percentage
          const earnedPoints = knowledgePoints % pointsToNextLevel;
          currentProgress = Math.round((earnedPoints / pointsToNextLevel) * 100);
        } else {
          // Fallback to a random percentage if no data available
          currentProgress = Math.floor(Math.random() * 41) + 50; // Random between 50-90%
        }
        
        console.log("Current level progress:", currentProgress + "%");
        
        return {
          readingLevels,
          currentProgress
        };
      } catch (error) {
        console.error("Error generating reading level data:", error);
        return null;
      }
    }
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
  
  const defaultReadingLevels = [
    { id: "1", label: "5A", status: "completed" as const },
    { id: "2", label: "6A", status: "completed" as const },
    { id: "3", label: "7B", status: "current" as const },
    { id: "4", label: "8A", status: "upcoming" as const },
    { id: "5", label: "9A", status: "goal" as const },
  ];
  
  // Default achievements to use when no data is available
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
  
  // Fallback quizzes if no recommended quizzes are found
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
  
  // Use real user data for reading level if available, otherwise fallback to default
  const stats = {
    ...defaultStats,
    // Override with real reading level from Firestore if available
    readingLevel: userData?.readingLevel || defaultStats.readingLevel,
    // For previous level, we could implement logic to determine it based on history
    // or keep the default for now
    previousLevel: userData?.previousLevel || defaultStats.previousLevel,
    // Use real knowledge points if available
    knowledgePoints: userData?.knowledgePoints || defaultStats.knowledgePoints,
    // Use real quizzes completed count from Firestore
    quizzesCompleted: quizCompletionData?.quizzesCompleted || defaultStats.quizzesCompleted,
    // Use real quizzes completed this week count from Firestore
    quizzesThisWeek: quizCompletionData?.quizzesThisWeek || defaultStats.quizzesThisWeek,
  };
  
  // Get reading level progress using real data from Firestore
  const readingLevels = readingLevelData?.readingLevels || defaultReadingLevels;
  const currentProgress = readingLevelData?.currentProgress || 78;
  
  // For testing: add some data to weeklyActivity if needed
  const testWeeklyData = () => {
    const testData = [...defaultWeeklyActivity];
    const today = new Date();
    const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    
    // Mark today as active
    testData[currentDayIndex].isActive = true;
    
    // Add some test counts
    testData[0].count = 2; // Monday
    testData[1].count = 1; // Tuesday
    testData[2].count = 3; // Wednesday
    testData[currentDayIndex].count = 1; // Today
    
    return testData;
  };
  
  // Prepare quizzes data for the component
  const quizzesData = Array.isArray(recommendedQuizzes) && recommendedQuizzes.length > 0 
    ? recommendedQuizzes 
    : quizzesLoading ? [] : defaultQuizzes;

  // Show skeleton loader while data is loading
  const isPageLoading = userLoading || weeklyActivityLoading || achievementsLoading || quizzesLoading || readingLevelLoading;
  
  return (
    <>
      <SEO 
        title="Dashboard | ReadDash - Track Your Reading Progress"
        description="Monitor your reading progress, view achievements, and get personalized quiz recommendations to improve your reading skills with ReadDash."
        keywords="reading dashboard, reading progress, reading achievements, personalized quizzes, reading comprehension"
        canonicalUrl="/"
      />
      <MobileHeader user={user} userLevel={stats.readingLevel} notificationCount={3} />
      <DesktopSidebar user={user} userLevel={stats.readingLevel} dailyGoalProgress={2} />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-6">
          {isPageLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              <DashboardHeader stats={stats} />
              
              <ProgressCharts 
                weeklyActivity={weeklyActivity || testWeeklyData()} 
                readingLevels={readingLevels} 
                currentProgress={currentProgress} 
              />
              
              <AchievementsList 
                achievements={Array.isArray(userAchievements) && userAchievements.length > 0 ? userAchievements : defaultAchievements} 
                loading={achievementsLoading} 
              />
              
              <RecommendedQuizzes quizzes={quizzesData?.length > 0 ? quizzesData : []} />
            </>
          )}
        </div>
      </main>
      
      <MobileNavBar currentRoute="/" />
    </>
  );
}

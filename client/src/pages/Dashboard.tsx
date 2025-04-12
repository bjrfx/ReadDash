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
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from "firebase/firestore";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch user data including reading level from Firestore
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['userData'],
    enabled: !!user?.uid,
    queryFn: async () => {
      try {
        console.log("Fetching user data from Firestore...");
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
    ...userStats,
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
  
  // Prepare achievements data for the component
  const achievementsData = achievements || defaultAchievements;
  
  // Prepare quizzes data for the component - use the fetched data if available
  const quizzesData = recommendedQuizzes?.length > 0 
    ? recommendedQuizzes 
    : quizzesLoading ? [] : defaultQuizzes;
  
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

import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/hooks";
import { useUserData } from "@/lib/userData";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { QuizResults as QuizResultsComponent } from "@/components/quiz/QuizResults";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface QuizResultData {
  title: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  pointsEarned: number;
  timeSpent: number;
  averageTime: number;
  levelImproved: boolean;
  nextLevel?: string;
}

export default function QuizResults() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: userData } = useUserData();
  
  // State for quiz results
  const [results, setResults] = useState<QuizResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Safely parse URL query parameters
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Get score and correct answers from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const score = parseInt(urlParams.get('score') || '0');
        const correctAnswers = parseInt(urlParams.get('correct') || '0');
        const totalQuestions = parseInt(urlParams.get('total') || '0');
        const timeSpent = parseInt(urlParams.get('time') || '120'); // Use the time passed from Quiz page
        
        console.log("URL Parameters:", { score, correctAnswers, totalQuestions, timeSpent });
        
        // Fetch the quiz details from Firestore
        const quizRef = doc(db, "quizzes", id);
        const quizSnap = await getDoc(quizRef);
        
        if (!quizSnap.exists()) {
          throw new Error("Quiz not found");
        }
        
        const quizData = quizSnap.data();
        
        // Calculate points based on score and quiz level
        const readingLevelNum = parseInt(quizData.readingLevel?.replace(/[A-Z]/g, '') || '5');
        
        // Calculate points: base points (10) + level factor + score factor
        const levelFactor = readingLevelNum * 2;
        const scoreFactor = Math.round(score / 10);
        const pointsEarned = 10 + levelFactor + scoreFactor;
        
        // Determine if level improved (simple logic for now)
        const levelImproved = score >= 80;
        
        // Set results data
        setResults({
          title: quizData.title || "Quiz",
          score: score / 100, // Convert percentage back to decimal for component
          correctAnswers,
          totalQuestions: totalQuestions || quizData.questionCount || 5,
          pointsEarned,
          timeSpent,
          averageTime: Math.round(timeSpent * 1.2), // Example average (20% longer than current time)
          levelImproved,
          nextLevel: levelImproved ? (readingLevelNum + 1).toString() + "A" : undefined
        });
        
      } catch (err) {
        console.error("Error fetching quiz results:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch quiz results"));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizData();
  }, [id]);
  
  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <>
        <MobileHeader user={user} userLevel={userData?.readingLevel || "1A"} />
        <DesktopSidebar user={user} userLevel={userData?.readingLevel || "1A"} dailyGoalProgress={2} />
        
        <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading results...</span>
        </main>
      </>
    );
  }
  
  // Show error state
  if (error || !results) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Results Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sorry, we couldn't find the quiz results you were looking for.
        </p>
        <Button onClick={() => setLocation("/quizzes")}>
          Back to Quizzes
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <MobileHeader user={user} userLevel={userData?.readingLevel || "1A"} />
      <DesktopSidebar user={user} userLevel={userData?.readingLevel || "1A"} dailyGoalProgress={2} />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-6 max-w-3xl mx-auto">
          <QuizResultsComponent 
            title={results.title}
            score={results.score}
            correctAnswers={results.correctAnswers}
            totalQuestions={results.totalQuestions}
            pointsEarned={results.pointsEarned}
            timeSpent={formatTime(results.timeSpent)}
            averageTime={formatTime(results.averageTime)}
            levelImproved={results.levelImproved}
            nextLevel={results.nextLevel}
          />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => setLocation(`/quizzes`)}>
              Take Another Quiz
            </Button>
            <Button variant="outline" onClick={() => setLocation(`/history`)}>
              View Quiz History
            </Button>
          </div>
        </div>
      </main>
      
      <MobileNavBar currentRoute="/quizzes" />
    </>
  );
}

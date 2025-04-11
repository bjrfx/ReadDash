import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/hooks";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { QuizResults as QuizResultsComponent } from "@/components/quiz/QuizResults";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuizResults() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Fetch quiz results data
  const { data: results, isLoading, error } = useQuery({
    queryKey: ['/api/quizzes', id, 'results'],
    enabled: !!id,
  });
  
  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2">Loading results...</span>
      </div>
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
      <MobileHeader user={user} userLevel={user?.displayName ? user.displayName.charAt(0) : "U"} />
      <DesktopSidebar user={user} userLevel="8B" dailyGoalProgress={2} />
      
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
        </div>
      </main>
      
      <MobileNavBar currentRoute="/quizzes" />
    </>
  );
}

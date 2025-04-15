import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/hooks";
import { useUserData } from "@/lib/userData";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { QuizResults as QuizResultsComponent } from "@/components/quiz/QuizResults";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

interface QuizResultData {
  title: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  pointsEarned: number;
  timeSpent: number;
  averageTime: number;
  levelImproved: boolean;
  userAnswers?: string[];
  nextLevel?: string;
}

export default function QuizResults() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: userData } = useUserData();
  
  // Feedback state
  const [feedback, setFeedback] = useState<string[]>([]);
  
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  
  // State for quiz results
  const [results, setResults] = useState<QuizResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!id || !user?.uid) {
        // console.log("Missing required parameters:", { id, userId: user?.uid });
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        // console.log("Fetching quiz results for quizId:", id, "and userId:", user.uid);
        
        // First, fetch the quiz details to get title and other quiz metadata
        const quizRef = doc(db, "quizzes", id);
        const quizSnap = await getDoc(quizRef);
        
        if (!quizSnap.exists()) {
          console.error("Quiz not found in Firestore with ID:", id);
          throw new Error("Quiz not found");
        }
        
        const quizData = quizSnap.data();
        // console.log("Quiz data:", quizData);
        
        // Query the quizResults collection
        const quizResultsRef = collection(db, "quizResults");
        const q = query(
          quizResultsRef,
          where("quizId", "==", id),
          where("userId", "==", user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          console.error("No quiz results found for user:", user.uid, "and quiz:", id);
          throw new Error("Quiz results not found");
        }
        
        // Get the most recent result or the one with the highest score
        let bestResult = null;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // console.log("Found quiz result:", data);
          
          // Initialize bestResult if it's the first one or update it if this result has a higher score
          if (!bestResult || data.score > bestResult.score) {
            bestResult = data;
          }
        });
        
        if (!bestResult) {
          throw new Error("Could not process quiz results");
        }
        
        // console.log("Using result data:", bestResult);
        
        // Calculate points based on score and quiz level if not present
        let pointsEarned = bestResult.pointsEarned;
        if (!pointsEarned && pointsEarned !== 0) {
          const readingLevelNum = parseInt(quizData.readingLevel?.replace(/[A-Z]/g, '') || '5');
          const levelFactor = readingLevelNum * 2;
          
          // Make points proportional to score percentage
          // Base points (10) + level factor + score percentage factor
          const scorePercentage = bestResult.score || 0;
          const scoreFactor = Math.round(scorePercentage);
          pointsEarned = 10 + levelFactor + scoreFactor;
          // console.log("Calculated points:", pointsEarned);
        }
        
        // Get correct answers and total questions
        const correctAnswers = bestResult.correctCount || 0;
        const totalQuestions = bestResult.totalQuestions || 0;
        
        // Get time spent
        const timeSpent = bestResult.timeSpent || 0;
        
        // For average time, we could fetch historical data, but use a placeholder for now
        const averageTime = Math.round(timeSpent * 1.2);
        
        // Determine if level improved
        const levelImproved = userData?.previousLevel !== userData?.readingLevel;
        
        // Calculate next level 
        let nextLevel = undefined;
        if (levelImproved && userData?.readingLevel) {
          const currentLevelNum = parseInt(userData.readingLevel.replace(/[A-Z]/g, '') || '1');
          const currentLevelLetter = userData.readingLevel.replace(/[0-9]/g, '') || 'A';
          
          if (currentLevelLetter === 'B') {
            nextLevel = (currentLevelNum + 1).toString() + 'A';
          } else {
            nextLevel = currentLevelNum.toString() + 'B';
          }
        }
        
        // Important: The QuizResultsComponent expects score as a decimal (0-1)
        // but Firestore stores it as a percentage (0-100)
        // Make sure we're properly converting the score
        let scoreForComponent = bestResult.score;
        
        // If score is greater than 1, assume it's a percentage and convert to decimal
        if (scoreForComponent > 1) {
          scoreForComponent = scoreForComponent / 100;
        }
        
        // If score is 0 but we have correct answers, calculate from correct/total
        if (scoreForComponent === 0 && correctAnswers > 0) {
          scoreForComponent = correctAnswers / totalQuestions;
        }
        
        console.log("Setting results:", {
          title: quizData.title || "Quiz",
          originalScore: bestResult.score,
          processedScore: scoreForComponent,
          correctAnswers,
          totalQuestions,
          pointsEarned
        });
        
        // Set the results including userAnswers
        const userAnswers = bestResult.answers || [];
        setResults({
          title: quizData.title || "Quiz",
          score: scoreForComponent,
          correctAnswers,
          totalQuestions,
          pointsEarned,
          timeSpent,
          averageTime,
          levelImproved,
          nextLevel
          
        });
        
      } catch (err) {
        console.error("Error fetching quiz results:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch quiz results"));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizData();
  }, [id, user, userData]);
  
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  useEffect(() => {
    const fetchFeedback = async () => {
      if (!results || !results.userAnswers) {
        return;
      }
      
      try {
        const quizDetailsRef = doc(db, "quizzes", id || "");
        const quizDetailsSnap = await getDoc(quizDetailsRef);
        if (!quizDetailsSnap.exists()) {
          throw new Error("Quiz details not found");
        }
        
        const quizDetails = quizDetailsSnap.data();
        // console.log("Quiz Details : ", quizDetails);
        
        const questions = quizDetails.questions;
        // console.log("Questions : ", questions);
        
        // const feedbackResults = await generateQuizFeedback({ quizResponse : questions, userAnswers : results.userAnswers});
        // setFeedback(feedbackResults);
      } catch (err) {
        console.error("Error fetching feedback: ", err);
      }
    };
    
    // fetchFeedback();
  }, [results, id]);
  
  
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
            feedback={feedback}
          />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => setLocation(`/quizzes/${id}/review`)}>
              Review Answers
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

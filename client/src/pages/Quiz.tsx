import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/hooks";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { QuizReader } from "@/components/quiz/QuizReader";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export default function Quiz() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for quiz interaction
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Fetch quiz data
  const { data: quiz, isLoading: quizLoading, error } = useQuery({
    queryKey: ['/api/quizzes', id],
    enabled: !!id,
  });
  
  // Initialize start time when quiz loads
  useEffect(() => {
    if (quiz && !startTime) {
      setStartTime(new Date());
    }
  }, [quiz, startTime]);
  
  // Handle answer selection
  const handleAnswer = (questionId: string, answerId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };
  
  // Handle navigation
  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      const endTime = new Date();
      const timeSpent = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;
      
      return apiRequest('POST', `/api/quizzes/${id}/submit`, {
        answers: userAnswers,
        timeSpent
      });
    },
    onSuccess: async (response) => {
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/achievements'] });
      setLocation(`/quiz-results/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to submit quiz",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Handle quiz submission
  const handleSubmit = () => {
    // Check if all questions have been answered
    if (quiz) {
      const unansweredQuestions = quiz.questions.filter(q => !userAnswers[q.id]);
      
      if (unansweredQuestions.length > 0) {
        toast({
          title: "Quiz incomplete",
          description: `You have ${unansweredQuestions.length} unanswered questions. Are you sure you want to submit?`,
          variant: "destructive",
          action: (
            <button 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-3 py-2 rounded-md text-xs"
              onClick={() => submitQuizMutation.mutate()}
            >
              Submit Anyway
            </button>
          ),
        });
      } else {
        submitQuizMutation.mutate();
      }
    }
  };
  
  // Show loading state
  if (quizLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2">Loading quiz...</span>
      </div>
    );
  }
  
  // Show error state
  if (error || !quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sorry, we couldn't find the quiz you were looking for.
        </p>
        <button 
          className="px-4 py-2 bg-primary-600 text-white rounded-md"
          onClick={() => setLocation("/quizzes")}
        >
          Back to Quizzes
        </button>
      </div>
    );
  }
  
  return (
    <>
      <MobileHeader user={user} userLevel={user?.displayName ? user.displayName.charAt(0) : "U"} />
      <DesktopSidebar user={user} userLevel="8B" dailyGoalProgress={2} />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-6 max-w-3xl mx-auto">
          <QuizReader 
            quiz={quiz}
            currentQuestionIndex={currentQuestionIndex}
            userAnswers={userAnswers}
            onAnswer={handleAnswer}
            onNextQuestion={handleNextQuestion}
            onPreviousQuestion={handlePreviousQuestion}
            onSubmit={handleSubmit}
          />
        </div>
      </main>
      
      <MobileNavBar currentRoute="/quizzes" />
    </>
  );
}

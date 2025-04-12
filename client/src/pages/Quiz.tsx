import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/hooks";
import { useUserData } from "@/lib/userData";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { QuizReader } from "@/components/quiz/QuizReader";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";

interface Question {
  id?: string;
  text: string;
  type: string;
  options?: { id: string; text: string }[];
  correctAnswer?: string;
  blanks?: { id: string; answer: string }[];
}

interface Quiz {
  id: string;
  title: string;
  passage: string;
  readingLevel: string;
  category: string;
  questions?: Question[];
  components?: any[];
  questionCount?: number;
}

export default function Quiz() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: userData } = useUserData();
  const { toast } = useToast();
  
  // State for quiz data and loading
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // State for quiz interaction
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Fetch quiz data from Firestore
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) return;
      
      try {
        setQuizLoading(true);
        const quizRef = doc(db, "quizzes", id);
        const quizSnap = await getDoc(quizRef);
        
        if (!quizSnap.exists()) {
          throw new Error("Quiz not found");
        }
        
        const quizData = quizSnap.data();
        
        // Process questions from the questions array in Firestore
        let processedQuestions: Question[] = [];
        
        if (quizData.questions && Array.isArray(quizData.questions)) {
          // Use the questions array directly if it exists
          processedQuestions = quizData.questions.map((q, index) => ({
            id: `q-${index}`,
            ...q
          }));
        } else if (quizData.components && Array.isArray(quizData.components)) {
          // Otherwise, extract questions from components
          processedQuestions = quizData.components
            .filter(comp => 
              comp.type === 'multiple-choice' || 
              comp.type === 'fill-blanks' || 
              comp.type === 'true-false-not-given'
            )
            .map((comp, index) => {
              if (comp.type === 'multiple-choice') {
                return {
                  id: comp.id || `q-${index}`,
                  text: comp.question,
                  type: comp.type,
                  options: comp.options,
                  correctAnswer: comp.correctOption
                };
              } else if (comp.type === 'fill-blanks') {
                return {
                  id: comp.id || `q-${index}`,
                  text: comp.question,
                  type: comp.type,
                  blanks: comp.blanks
                };
              } else {
                return {
                  id: comp.id || `q-${index}`,
                  text: comp.question,
                  type: comp.type,
                  correctAnswer: comp.correctAnswer
                };
              }
            });
        }
        
        // Construct the quiz object
        const formattedQuiz: Quiz = {
          id: quizSnap.id,
          title: quizData.title,
          passage: quizData.passage,
          readingLevel: quizData.readingLevel,
          category: quizData.category,
          questions: processedQuestions,
          questionCount: quizData.questionCount || processedQuestions.length
        };
        
        setQuiz(formattedQuiz);
        setStartTime(new Date());
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch quiz"));
      } finally {
        setQuizLoading(false);
      }
    };
    
    fetchQuiz();
  }, [id]);
  
  // Handle answer selection
  const handleAnswer = (questionId: string, answerId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };
  
  // Handle navigation
  const handleNextQuestion = () => {
    if (quiz && quiz.questions && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Handle quiz submission
  const handleSubmit = async () => {
    if (!quiz || !quiz.questions || !user) return;
    
    try {
      // Calculate results
      const endTime = new Date();
      const timeSpent = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;
      
      let correctCount = 0;
      const questionResults = quiz.questions.map(question => {
        const userAnswer = userAnswers[question.id || ''];
        const isCorrect = question.correctAnswer === userAnswer;
        
        if (isCorrect) correctCount++;
        
        return {
          questionId: question.id,
          userAnswer,
          isCorrect
        };
      });
      
      const score = Math.round((correctCount / quiz.questions.length) * 100);
      
      // Save results to Firestore
      const resultData = {
        userId: user.uid,
        quizId: quiz.id,
        title: quiz.title,
        readingLevel: quiz.readingLevel,
        category: quiz.category,
        score,
        timeSpent,
        correctCount,
        totalQuestions: quiz.questions.length,
        questionResults,
        completedAt: serverTimestamp()
      };
      
      const resultRef = await addDoc(collection(db, "quizResults"), resultData);
      console.log("Saved quiz result with ID:", resultRef.id);
      
      // Redirect to results page with necessary query parameters
      setLocation(`/quiz-results/${quiz.id}?score=${score}&correct=${correctCount}&total=${quiz.questions.length}&time=${timeSpent}`);
    } catch (err) {
      console.error("Error submitting quiz:", err);
      toast({
        title: "Failed to submit quiz",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Check if all questions are answered before submitting
  const confirmSubmit = () => {
    if (!quiz || !quiz.questions) return;
    
    const unansweredQuestions = quiz.questions.filter(q => !userAnswers[q.id || '']);
    
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Quiz incomplete",
        description: `You have ${unansweredQuestions.length} unanswered questions. Are you sure you want to submit?`,
        variant: "destructive",
        action: (
          <button 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-3 py-2 rounded-md text-xs"
            onClick={handleSubmit}
          >
            Submit Anyway
          </button>
        ),
      });
    } else {
      handleSubmit();
    }
  };
  
  // Show loading state
  if (quizLoading) {
    return (
      <>
        <MobileHeader user={user} userLevel={userData?.readingLevel || "1A"} />
        <DesktopSidebar user={user} userLevel={userData?.readingLevel || "1A"} dailyGoalProgress={2} />
        
        <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading quiz...</span>
        </main>
      </>
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
      <MobileHeader user={user} userLevel={userData?.readingLevel || "1A"} />
      <DesktopSidebar user={user} userLevel={userData?.readingLevel || "1A"} dailyGoalProgress={2} />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-6 max-w-3xl mx-auto">
          <QuizReader 
            quiz={quiz}
            currentQuestionIndex={currentQuestionIndex}
            userAnswers={userAnswers}
            onAnswer={handleAnswer}
            onNextQuestion={handleNextQuestion}
            onPreviousQuestion={handlePreviousQuestion}
            onSubmit={confirmSubmit}
          />
        </div>
      </main>
      
      <MobileNavBar currentRoute="/quizzes" />
    </>
  );
}

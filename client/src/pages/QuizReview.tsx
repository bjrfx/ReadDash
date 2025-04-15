import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/hooks";
import { useUserData } from "@/lib/userData";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, DocumentData } from "firebase/firestore";

interface QuestionResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
}

interface QuizReviewData {
  quizId: string;
  title: string;
  passage: string;
  questions: {
    id: string;
    text: string;
    type: string;
    options?: { id: string; text: string }[];
    correctAnswer: string;
    reason?: string;
  }[];
  userAnswers: Record<string, string>;
  questionResults: QuestionResult[];
}

interface QuizResultData {
  score: number;
  questionResults: QuestionResult[];
  [key: string]: any;
}

export default function QuizReview() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: userData } = useUserData();
  
  // State for quiz review data
  const [reviewData, setReviewData] = useState<QuizReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!id || !user?.uid) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Fetch the quiz details
        const quizRef = doc(db, "quizzes", id);
        const quizSnap = await getDoc(quizRef);
        
        if (!quizSnap.exists()) {
          throw new Error("Quiz not found");
        }
        
        const quizData = quizSnap.data();
        
        // Query the quizResults collection for this user's results on this quiz
        const quizResultsRef = collection(db, "quizResults");
        const q = query(
          quizResultsRef,
          where("quizId", "==", id),
          where("userId", "==", user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error("Quiz results not found");
        }
        
        // Get the most recent result or the one with the highest score
        let bestResult: QuizResultData | null = null;
        querySnapshot.forEach((doc) => {
          const data = doc.data() as QuizResultData;
          if (!bestResult || data.score > bestResult.score) {
            bestResult = data;
          }
        });
        
        if (!bestResult) {
          throw new Error("Could not process quiz results");
        }
        
        // Extract user answers and question results
        const userAnswers: Record<string, string> = {};
        const questionResults = bestResult.questionResults || [];
        
        questionResults.forEach((result: QuestionResult) => {
          userAnswers[result.questionId] = result.userAnswer;
        });
        
        // Process questions with appropriate data structure
        let questions: {
          id: string;
          text: string;
          type: string;
          options?: { id: string; text: string }[];
          correctAnswer: string;
          reason?: string;
        }[] = [];
        
        if (quizData.questions && Array.isArray(quizData.questions)) {
          questions = quizData.questions.map((q: any) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            reason: q.reason || q.explanation || ""
          }));
        } else if (quizData.components && Array.isArray(quizData.components)) {
          questions = quizData.components
            .filter((comp: any) => 
              comp.type === 'multiple-choice' || 
              comp.type === 'fill-blanks' || 
              comp.type === 'true-false-not-given' ||
              comp.type === 'sentence-completion' ||
              comp.type === 'yes-no-not-given'
            )
            .map((comp: any, index: number) => ({
              id: comp.id || `q-${index}`,
              text: comp.question,
              type: comp.type,
              options: comp.options,
              correctAnswer: comp.correctAnswer || comp.correctOption,
              reason: comp.reason || comp.explanation || ""
            }));
        }
        
        // Set the review data
        setReviewData({
          quizId: id,
          title: quizData.title,
          passage: quizData.passage,
          questions,
          userAnswers,
          questionResults
        });
        
      } catch (err) {
        console.error("Error fetching quiz review data:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch quiz review data"));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizData();
  }, [id, user]);
  
  // Helper function to get the text of an option by its ID
  const getOptionText = (questionId: string, optionId: string): string => {
    if (!reviewData) return "";
    
    const question = reviewData.questions.find(q => q.id === questionId);
    if (!question || !question.options) return "";
    
    const option = question.options.find(opt => opt.id === optionId);
    return option ? option.text : "";
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <>
        <MobileHeader user={user} userLevel={userData?.readingLevel || "1A"} />
        <DesktopSidebar user={user} userLevel={userData?.readingLevel || "1A"} dailyGoalProgress={2} />
        
        <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading review...</span>
        </main>
      </>
    );
  }
  
  // Show error state
  if (error || !reviewData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Review Not Available</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sorry, we couldn't find the quiz review data you were looking for.
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
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation(`/quiz-results/${id}`)}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Quiz Review: {reviewData.title}</h1>
          </div>
          
          {/* Reading passage */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Reading Passage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                {reviewData.passage.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Questions and answers */}
          <div className="space-y-8">
            {reviewData.questions.map((question, index) => {
              const userAnswer = reviewData.userAnswers[question.id] || "";
              const isCorrect = reviewData.questionResults.find(r => r.questionId === question.id)?.isCorrect || false;
              const userOptionText = question.options 
                ? getOptionText(question.id, userAnswer) 
                : userAnswer;
              const correctOptionText = question.options 
                ? getOptionText(question.id, question.correctAnswer) 
                : question.correctAnswer;
              
              return (
                <Card key={question.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-start">
                      <span className="mr-2">Question {index + 1}:</span> 
                      <span>{question.text}</span>
                      {isCorrect 
                        ? <CheckCircle className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" /> 
                        : <XCircle className="h-5 w-5 text-red-500 ml-2 flex-shrink-0" />
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Answer comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* User's answer */}
                      <div className={`p-3 rounded-md ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <p className="font-medium mb-1">Your Answer:</p>
                        <p className={`${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                          {userOptionText || "(No answer provided)"}
                        </p>
                      </div>
                      
                      {/* Correct answer */}
                      <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20">
                        <p className="font-medium mb-1">Correct Answer:</p>
                        <p className="text-green-700 dark:text-green-400">
                          {correctOptionText}
                        </p>
                      </div>
                    </div>
                    
                    {/* Explanation/reason */}
                    {question.reason && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                        <p className="font-medium mb-1">Explanation:</p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {question.reason}
                        </p>
                      </div>
                    )}
                    
                    {/* Answer options (for multiple choice) */}
                    {question.options && question.options.length > 0 && (
                      <div className="mt-4">
                        <p className="font-medium mb-2">All Options:</p>
                        <div className="grid grid-cols-1 gap-2">
                          {question.options.map(option => {
                            const isUserChoice = option.id === userAnswer;
                            const isCorrectChoice = option.id === question.correctAnswer;
                            let bgColor = "bg-gray-50 dark:bg-gray-800/50";
                            
                            if (isUserChoice && isCorrectChoice) {
                              bgColor = "bg-green-100 dark:bg-green-900/30";
                            } else if (isUserChoice) {
                              bgColor = "bg-red-100 dark:bg-red-900/30";
                            } else if (isCorrectChoice) {
                              bgColor = "bg-green-50 dark:bg-green-900/20";
                            }
                            
                            return (
                              <div 
                                key={option.id}
                                className={`p-3 rounded-md ${bgColor} ${(isUserChoice || isCorrectChoice) ? 'font-medium' : ''}`}
                              >
                                <div className="flex items-start">
                                  <span className="mr-2">{option.text}</span>
                                  {isCorrectChoice && <CheckCircle className="h-4 w-4 text-green-500 ml-auto flex-shrink-0" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="mt-8 flex justify-center">
            <Button onClick={() => setLocation(`/quizzes`)}>
              Back to Quizzes
            </Button>
          </div>
        </div>
      </main>
      
      <MobileNavBar currentRoute="/quizzes" />
    </>
  );
}
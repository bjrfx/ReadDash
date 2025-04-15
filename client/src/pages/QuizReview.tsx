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
import { doc, getDoc, collection, query, where, getDocs, DocumentData, orderBy, limit } from "firebase/firestore";

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
  completedAt: any;
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
  const [debugData, setDebugData] = useState<any>(null);
  
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!id || !user?.uid) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        console.log("Fetching quiz review data for quiz ID:", id);
        
        // Fetch the quiz details
        const quizRef = doc(db, "quizzes", id);
        const quizSnap = await getDoc(quizRef);
        
        if (!quizSnap.exists()) {
          console.error("Quiz not found with ID:", id);
          throw new Error("Quiz not found");
        }
        
        const quizData = quizSnap.data();
        console.log("Quiz data retrieved:", { title: quizData.title, hasQuestions: !!quizData.questions, hasComponents: !!quizData.components });
        
        // Query the quizResults collection for this user's results on this quiz
        // Note: The database may store quizId as a string or the actual ID, so we need to check both
        const quizResultsRef = collection(db, "quizResults");
        
        // First try to find results with exact ID match
        let q = query(
          quizResultsRef,
          where("quizId", "==", id),
          where("userId", "==", user.uid)
        );
        
        let querySnapshot = await getDocs(q);
        
        // If no results found, try with alternative formats of the ID
        if (querySnapshot.empty) {
          console.log("No results found with exact ID match, trying alternate formats");
          
          // Try with alternative formats - for example without leading/trailing spaces
          const alternativeIds = [id.trim()];
          
          // For each alternative ID format
          for (const altId of alternativeIds) {
            if (altId === id) continue; // Skip if same as original
            
            q = query(
              quizResultsRef,
              where("quizId", "==", altId),
              where("userId", "==", user.uid)
            );
            
            const altQuerySnapshot = await getDocs(q);
            if (!altQuerySnapshot.empty) {
              console.log("Found results with alternative ID format:", altId);
              querySnapshot = altQuerySnapshot;
              break;
            }
          }
          
          // If still no results, do a more generic query and filter manually
          if (querySnapshot.empty) {
            console.log("Trying without ID filters");
            q = query(
              quizResultsRef,
              where("userId", "==", user.uid)
            );
            
            const allUserResults = await getDocs(q);
            
            if (!allUserResults.empty) {
              console.log("Found user results, checking manually for matching quiz ID");
              // Convert results to array for filtering
              const allResultDocs = allUserResults.docs;
              
              // Filter results manually to find any that might match this quiz ID
              const matchingResults = allResultDocs.filter(doc => {
                const data = doc.data();
                // Try to match quiz ID in different formats
                const resultQuizId = data.quizId;
                return resultQuizId === id || 
                      resultQuizId === id.trim() || 
                      (typeof resultQuizId === 'object' && resultQuizId.id === id);
              });
              
              if (matchingResults.length > 0) {
                console.log("Found matching results through manual filtering");
                // Create a new QuerySnapshot-like object with the filtered results
                querySnapshot = {
                  docs: matchingResults,
                  empty: false
                } as any;
              }
            }
          }
        }
        
        if (querySnapshot.empty) {
          console.error("No quiz results found for user:", user.uid, "and quiz:", id);
          throw new Error("Quiz results not found");
        }
        
        // Sort results by completedAt (most recent first) if possible
        const sortedDocs = querySnapshot.docs.sort((a, b) => {
          const aTime = a.data().completedAt?.toMillis?.() || 0;
          const bTime = b.data().completedAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        
        // Get the most recent result
        let resultDoc = sortedDocs[0];
        const resultData = resultDoc.data() as QuizResultData;
        
        console.log("Quiz result data:", {
          score: resultData.score,
          hasQuestionResults: !!resultData.questionResults,
          questionResultsCount: resultData.questionResults?.length || 0
        });
        
        // For debugging
        setDebugData({
          quizData: {
            title: quizData.title,
            questions: quizData.questions || [],
            components: quizData.components || []
          },
          resultData: {
            score: resultData.score,
            questionResults: resultData.questionResults || []
          }
        });
        
        // Extract user answers and question results
        const userAnswers: Record<string, string> = {};
        const questionResults = resultData.questionResults || [];
        
        console.log("Question results:", questionResults);
        
        questionResults.forEach((result: QuestionResult) => {
          userAnswers[result.questionId] = result.userAnswer;
          console.log(`User answer for question ${result.questionId}: ${result.userAnswer} (correct: ${result.isCorrect})`);
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
        
        // Create a mapping from question index to result ID (q-0, q-1, etc.)
        const indexToResultIdMap: Record<number, string> = {};
        const resultIdToIndexMap: Record<string, number> = {};
        
        questionResults.forEach((result: QuestionResult) => {
          const match = result.questionId.match(/q-(\d+)/);
          if (match) {
            const index = parseInt(match[1]);
            indexToResultIdMap[index] = result.questionId;
            resultIdToIndexMap[result.questionId] = index;
          }
        });
        
        if (quizData.questions && Array.isArray(quizData.questions)) {
          questions = quizData.questions.map((q: any, index: number) => {
            // Use q-index format to match with results
            const resultId = indexToResultIdMap[index] || `q-${index}`;

            // For sentence-completion, extract correct answer from answers array
            let correctAnswer = q.correctAnswer;
            if (q.type === 'sentence-completion' && q.answers && q.answers.length > 0) {
              correctAnswer = q.answers[0].text;
            }

            return {
              id: resultId, // Use the ID format from results
              text: q.text,
              type: q.type,
              options: q.options,
              correctAnswer,
              reason: q.reason || q.explanation || ""
            };
          });
        } else if (quizData.components && Array.isArray(quizData.components)) {
          // Filter out question components and get their indexes
          const questionComponents = quizData.components
            .filter((comp: any) => 
              comp.type === 'multiple-choice' || 
              comp.type === 'fill-blanks' || 
              comp.type === 'true-false-not-given' ||
              comp.type === 'sentence-completion' ||
              comp.type === 'yes-no-not-given'
            );
            
          questions = questionComponents.map((comp: any, index: number) => {
            const resultId = indexToResultIdMap[index] || `q-${index}`;
            
            // Handle correctAnswer differently based on question type
            let correctAnswer = comp.correctAnswer || comp.correctOption;
            
            // For sentence completion questions, get the answer from the answers array
            if (comp.type === 'sentence-completion' && comp.answers && comp.answers.length > 0) {
              correctAnswer = comp.answers[0].text;
            }
            
            // Log each component for debugging
            console.log("Processing component:", {
              id: comp.id,
              resultId,
              type: comp.type,
              question: comp.question || "No question text",
              correctAnswer,
              hasOptions: !!comp.options,
              hasAnswers: !!comp.answers,
              answersLength: comp.answers?.length,
              index
            });
            
            return {
              id: resultId, // Use the resultId to ensure it matches with the results
              text: comp.question || comp.content || "Question text not found",
              type: comp.type,
              options: comp.options,
              correctAnswer,
              reason: comp.reason || comp.explanation || ""
            };
          });
        }
        
        console.log("Processed questions:", questions.length);
        questions.forEach((q, index) => {
          console.log(`Question ${index}: ${q.id} - ${q.text.substring(0, 30)}... (correct: ${q.correctAnswer})`);
          if (q.options) {
            q.options.forEach(opt => console.log(`  Option ${opt.id}: ${opt.text.substring(0, 20)}...`));
          }
        });
        
        // Create a special mapping for questions where IDs might not match directly
        const questionResultsById = questionResults.reduce((map: any, result: QuestionResult) => {
          map[result.questionId] = result;
          return map;
        }, {});
        
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
    if (!optionId) return "(No answer selected)";
    
    // Special handling for yes-no-not-given questions
    const question = reviewData.questions.find(q => q.id === questionId);
    if (!question) return optionId;
    
    if (question.type === 'yes-no-not-given' || question.type === 'true-false-not-given') {
      // For these question types, the optionId is the direct answer (yes, no, not-given)
      return optionId.charAt(0).toUpperCase() + optionId.slice(1).replace('-', ' ');
    }
    
    // Special handling for sentence completion questions
    if (question.type === 'sentence-completion') {
      // For sentence completion, the answer is stored directly
      return optionId;
    }
    
    if (!question.options) return optionId; // Return the raw ID if options aren't found
    
    const option = question.options.find(opt => opt.id === optionId);
    if (!option) {
      console.log(`Option not found: questionId=${questionId}, optionId=${optionId}`);
      console.log("Available options:", question.options.map(o => o.id).join(", "));
      return optionId; // Return the raw ID if the specific option isn't found
    }
    
    return option.text;
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
        
        {debugData && (
          <div className="mb-6 w-full max-w-2xl overflow-auto bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <p className="font-mono text-xs">{JSON.stringify(debugData, null, 2)}</p>
          </div>
        )}
        
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
              
              // Get the text of the selected option or the raw answer
              const userOptionText = question.options 
                ? getOptionText(question.id, userAnswer) 
                : userAnswer;
              
              // Get the text of the correct option or the raw correct answer
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
                    {/* Debug info (for development only) */}
                    {/* <div className="bg-gray-100 dark:bg-gray-800 p-2 mb-4 rounded text-xs font-mono">
                      <p>Question ID: {question.id}</p>
                      <p>User answer ID: {userAnswer}</p>
                      <p>Correct answer ID: {question.correctAnswer}</p>
                    </div> */}
                    
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
                          {correctOptionText || "No correct answer provided"}
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
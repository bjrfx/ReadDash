import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/hooks";
import { useUserData } from "@/lib/userData";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, SearchIcon, FilterIcon, BookPlus, RotateCcw } from "lucide-react";
import { db, resetQuiz, resetAllQuizzes } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SEO from "@/components/seo/SEO";

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passage: string;
  category: string;
  readingLevel: string;
  estimatedTime?: number;
  questionCount: number;
  isRecommended?: boolean;
  createdAt: any;
  imageUrl?: string;
  completed?: boolean; // Flag to indicate if the quiz has been completed by the user
  score?: number; // Optional score if completed
}

export default function Quizzes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  
  // State for reset confirmation dialogs
  const [quizToReset, setQuizToReset] = useState<string | null>(null);
  const [showResetAllDialog, setShowResetAllDialog] = useState(false);
  
  // Fetch quizzes from Firestore
  const fetchQuizzes = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Fetch all quizzes
      const quizzesRef = collection(db, "quizzes");
      const quizzesSnapshot = await getDocs(quizzesRef);
      
      // Fetch completed quizzes for the current user
      const quizResultsRef = collection(db, "quizResults");
      const quizResultsQuery = query(quizResultsRef, where("userId", "==", user.uid));
      const quizResultsSnapshot = await getDocs(quizResultsQuery);
      
      // Create a map of completed quizzes with their scores
      const completedQuizzes = new Map();
      quizResultsSnapshot.docs.forEach(doc => {
        const resultData = doc.data();
        completedQuizzes.set(resultData.quizId, {
          completed: true,
          score: resultData.score
        });
      });
      
      const quizzesData = quizzesSnapshot.docs.map(doc => {
        const data = doc.data();
        // Generate a description from the passage if none exists
        const description = data.description || data.passage.substring(0, 120) + "...";
        
        const quizId = doc.id;
        const completionInfo = completedQuizzes.get(quizId);
        
        return {
          id: quizId,
          ...data,
          description,
          // Convert Firestore timestamp to Date if it exists
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          // Default estimated time based on content length if not provided
          estimatedTime: data.estimatedTime || Math.ceil(data.passage.length / 1000),
          // Add completion status and score if available
          completed: completionInfo ? true : false,
          score: completionInfo ? completionInfo.score : undefined
        } as Quiz;
      });
      
      setQuizzes(quizzesData);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast({
        title: "Error",
        description: "Failed to load quizzes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchQuizzes();
  }, [user]);
  
  // Handler to reset a single quiz
  const handleResetQuiz = async (quizId: string) => {
    if (!user || !quizId) return;
    
    try {
      setIsResetting(true);
      await resetQuiz(user.uid, quizId);
      
      // Refresh quizzes
      await fetchQuizzes();
      
      toast({
        title: "Quiz reset",
        description: "Quiz progress has been reset successfully.",
      });
    } catch (error) {
      console.error("Error resetting quiz:", error);
      toast({
        title: "Reset failed",
        description: "Failed to reset quiz progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
      setQuizToReset(null);
    }
  };
  
  // Handler to reset all quizzes
  const handleResetAllQuizzes = async () => {
    if (!user) return;
    
    try {
      setIsResetting(true);
      await resetAllQuizzes(user.uid);
      
      // Refresh quizzes
      await fetchQuizzes();
      
      toast({
        title: "All quizzes reset",
        description: "All quiz progress has been reset successfully.",
      });
    } catch (error) {
      console.error("Error resetting all quizzes:", error);
      toast({
        title: "Reset failed",
        description: "Failed to reset all quiz progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
      setShowResetAllDialog(false);
    }
  };
  
  // Format estimated time
  const formatTime = (minutes: number) => {
    return minutes < 1 ? "< 1 min" : `${minutes} min`;
  };
  
  // Apply filters and search
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = (quiz.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         quiz.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || quiz.category?.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesLevel = levelFilter === "all" || quiz.readingLevel === levelFilter;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });
  
  // Get recommended quizzes
  const recommendedQuizzes = quizzes.filter(quiz => quiz.isRecommended === true);
  
  // Recent quizzes (based on createdAt timestamp)
  const recentQuizzes = [...quizzes]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);
  
  // Get unique categories from all quizzes
  const categories = [...new Set(quizzes.map(quiz => quiz.category))];
  
  // Get unique reading levels from all quizzes
  const readingLevels = [...new Set(quizzes.map(quiz => quiz.readingLevel))].sort();
  
  if (isLoading) {
    return (
      <MainLayout currentRoute="/quizzes">
        <SEO 
          title="Reading Quizzes | ReadDash - Improve Your Comprehension"
          description="Browse and take interactive reading quizzes to improve your comprehension skills. Filter by category, reading level, and difficulty."
          keywords="reading quizzes, reading comprehension, interactive quizzes, educational quizzes, reading practice"
          canonicalUrl="/quizzes"
        />
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading quizzes...</span>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout currentRoute="/quizzes">
      <SEO 
        title="Reading Quizzes | ReadDash - Improve Your Comprehension"
        description="Browse and take interactive reading quizzes to improve your comprehension skills. Filter by category, reading level, and difficulty."
        keywords="reading quizzes, reading comprehension, interactive quizzes, educational quizzes, reading practice"
        canonicalUrl="/quizzes"
      />
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-heading text-2xl font-bold">Reading Quizzes</h2>
          
          {/* Reset All Button */}
          {quizzes.some(quiz => quiz.completed) && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2 text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
              onClick={() => setShowResetAllDialog(true)}
              disabled={isResetting}
            >
              <RotateCcw className="h-4 w-4" />
              Reset All Progress
            </Button>
          )}
        </div>
        
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search quizzes..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={levelFilter}
                onValueChange={setLevelFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Reading Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {readingLevels.map(level => (
                    <SelectItem key={level} value={level}>
                      Level {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Quiz Tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Quizzes</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="recent">Recently Added</TabsTrigger>
          </TabsList>
          
          {/* All Quizzes Tab */}
          <TabsContent value="all">
            {filteredQuizzes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQuizzes.map((quiz) => (
                  <QuizCard 
                    key={quiz.id} 
                    quiz={quiz} 
                    onReset={quiz.completed ? (quizId) => setQuizToReset(quizId) : undefined} 
                  />
                ))}
              </div>
            ) : (
              <EmptyQuizzesState searchQuery={searchQuery} />
            )}
          </TabsContent>
          
          {/* Recommended Tab */}
          <TabsContent value="recommended">
            {recommendedQuizzes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedQuizzes.map((quiz) => (
                  <QuizCard 
                    key={quiz.id} 
                    quiz={quiz} 
                    onReset={quiz.completed ? (quizId) => setQuizToReset(quizId) : undefined} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FilterIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No recommended quizzes</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  We don't have any quizzes matching your current reading level and filters.
                </p>
                <Button onClick={() => {
                  setLevelFilter("all");
                  setCategoryFilter("all");
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Recent Tab */}
          <TabsContent value="recent">
            {recentQuizzes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentQuizzes.map((quiz) => (
                  <QuizCard 
                    key={quiz.id} 
                    quiz={quiz} 
                    onReset={quiz.completed ? (quizId) => setQuizToReset(quizId) : undefined} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No recent quizzes</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Check back soon for new reading materials.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Single Quiz Reset Confirmation Dialog */}
      <AlertDialog open={!!quizToReset} onOpenChange={(open) => !open && setQuizToReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Quiz Progress</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset your progress for this quiz? 
              This will remove all scores, points earned, and any progress related to this quiz. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => quizToReset && handleResetQuiz(quizToReset)}
              disabled={isResetting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Quiz"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset All Quizzes Confirmation Dialog */}
      <AlertDialog open={showResetAllDialog} onOpenChange={setShowResetAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Quiz Progress</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset progress for all quizzes? 
              This will reset all your scores, remove all knowledge points, and erase all completion status. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetAllQuizzes}
              disabled={isResetting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset All Quizzes"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

// Quiz Card Component
function QuizCard({ quiz, onReset }: { quiz: Quiz; onReset?: (quizId: string) => void }) {
  // Local formatTime function
  const formatEstimatedTime = (minutes: number) => {
    if (!minutes || isNaN(minutes)) return "Unknown";
    return minutes < 1 ? "< 1 min" : `${minutes} min`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="h-32 bg-gradient-to-r from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            className="w-12 h-12 text-primary-500/50 dark:text-primary-400/50"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <Badge variant="secondary" className="absolute top-2 right-2 bg-primary-500 text-white">
          Level {quiz.readingLevel}
        </Badge>
        {quiz.isRecommended && (
          <Badge variant="secondary" className="absolute top-2 left-2 bg-amber-500 text-white">
            Recommended
          </Badge>
        )}
        {quiz.completed && (
          <Badge variant="secondary" className="absolute bottom-2 right-2 bg-green-500 text-white">
            Scored {quiz.score ? `${quiz.score}%` : ''}
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h4 className="font-medium mb-1 line-clamp-1">{quiz.title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{quiz.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {quiz.category}
            </Badge>
            <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {formatEstimatedTime(quiz.estimatedTime || 5)}
            </Badge>
            <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {quiz.questionCount} questions
            </Badge>
          </div>
        </div>
        <div className="flex flex-col mt-3 gap-2">
          <Button 
            className="w-full"
            size="sm"
            asChild
          >
            <Link href={`/quiz/${quiz.id}`}>{quiz.completed ? 'Retake Quiz' : 'Start Quiz'}</Link>
          </Button>
          
          {quiz.completed && onReset && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-red-500 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
              onClick={(e) => {
                e.preventDefault();
                onReset(quiz.id);
              }}
            >
              Reset Quiz Progress
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyQuizzesState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="text-center py-8">
      <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No quizzes found</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        {searchQuery 
          ? `No quizzes match "${searchQuery}". Try a different search term or clear your filters.` 
          : "No quizzes match your current filters."}
      </p>
      <Button onClick={() => window.location.reload()}>
        Reset All Filters
      </Button>
    </div>
  );
}

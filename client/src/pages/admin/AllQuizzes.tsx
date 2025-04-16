import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/hooks";
import { useAdmin } from "@/lib/hooks";
import { useUserData } from "@/lib/userData";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PencilIcon, TrashIcon, ArrowLeft, Search, Filter } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  readingLevel: string;
  category: string;
  questionCount: number;
  createdAt?: any;
}

export default function AllQuizzes() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const { data: userData } = useUserData();
  
  // State for quizzes and filters
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Fetch quizzes from Firestore
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!isAdmin) return;
      
      try {
        setLoading(true);
        
        // Fetch quizzes from Firebase
        const quizzesSnapshot = await getDocs(collection(db, "quizzes"));
        const quizzesData = quizzesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Format dates if they exist
          createdAt: doc.data().createdAt ? doc.data().createdAt.toDate().toLocaleDateString('en-US') : 'Unknown'
        }));
        
        setQuizzes(quizzesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast({
          title: "Error loading quizzes",
          description: error instanceof Error ? error.message : "Failed to load quizzes",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    
    fetchQuizzes();
  }, [isAdmin, toast]);
  
  // Filter quizzes based on search query and category
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || quiz.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Quiz actions
  const handleEditQuiz = (quizId: string) => {
    setLocation(`/admin/quizzes/${quizId}/edit`);
  };
  
  const handleDeleteQuiz = async (quizId: string) => {
    try {
      // Delete the quiz from Firestore
      await deleteDoc(doc(db, "quizzes", quizId));
      
      // Update local state
      setQuizzes(prevQuizzes => prevQuizzes.filter(quiz => quiz.id !== quizId));
      
      toast({
        title: "Quiz deleted",
        description: "The quiz has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete quiz",
        variant: "destructive",
      });
    }
  };
  
  const handleAddQuiz = () => {
    setLocation('/admin/quizzes/new');
  };
  
  const handleBackToAdmin = () => {
    setLocation('/admin');
  };
  
  // Redirect if not admin
  if (!adminLoading && !isAdmin) {
    setLocation('/');
    return null;
  }
  
  // Show loading state
  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2">Loading quizzes...</span>
      </div>
    );
  }
  
  return (
    <>
      <MobileHeader 
        user={user} 
        userLevel={userData?.readingLevel || "1A"} 
        notificationCount={0} 
      />
      <DesktopSidebar 
        user={user} 
        userLevel={userData?.readingLevel || "1A"} 
        dailyGoalProgress={2} 
      />
      <MobileNavBar currentRoute="/admin" />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBackToAdmin}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">All Quizzes</h1>
            </div>
            <Button onClick={handleAddQuiz}>Add New Quiz</Button>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-64 flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Literature">Literature</SelectItem>
                  <SelectItem value="Social Studies">Social Studies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Quizzes List */}
          <Card>
            <CardHeader className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-heading text-lg font-medium">
                {filteredQuizzes.length} {filteredQuizzes.length === 1 ? 'Quiz' : 'Quizzes'}
              </h3>
            </CardHeader>
            
            <CardContent className="p-0">
              {filteredQuizzes.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredQuizzes.map((quiz) => (
                    <li key={quiz.id} className="p-5 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{quiz.title}</h4>
                        <div className="flex flex-wrap gap-x-2 text-xs mt-1">
                          <span className="text-gray-500 dark:text-gray-400">Level {quiz.readingLevel}</span>
                          <span className="text-gray-500 dark:text-gray-400">•</span>
                          <span className="text-gray-500 dark:text-gray-400">{quiz.category}</span>
                          <span className="text-gray-500 dark:text-gray-400">•</span>
                          <span className="text-gray-500 dark:text-gray-400">{quiz.questionCount} questions</span>
                          {quiz.createdAt && (
                            <>
                              <span className="text-gray-500 dark:text-gray-400">•</span>
                              <span className="text-gray-500 dark:text-gray-400">Created: {quiz.createdAt}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          onClick={() => handleEditQuiz(quiz.id)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-5 text-center text-gray-500">
                  {searchQuery || categoryFilter !== "all" ? 
                    "No quizzes match your search criteria." : 
                    "No quizzes available. Create your first quiz!"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
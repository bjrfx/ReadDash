import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/hooks";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, Calendar, ChevronRight, ArrowUpRight, Bookmark } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

interface QuizHistoryItem {
  id: string;
  quizId: string;
  title: string;
  date: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  readingLevel: string;
  category: string;
  timeSpent: number;
}

export default function History() {
  const { user } = useAuth();
  const [historyData, setHistoryData] = useState<QuizHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user quiz history from Firestore
  useEffect(() => {
    const fetchQuizHistory = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const quizResultsRef = collection(db, "quizResults");
        const quizResultsQuery = query(
          quizResultsRef,
          where("userId", "==", user.uid),
          orderBy("completedAt", "desc")
        );

        const quizResultsSnapshot = await getDocs(quizResultsQuery);
        const quizHistoryItems = quizResultsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            quizId: data.quizId,
            title: data.title || "Untitled Quiz",
            date: data.completedAt ? data.completedAt.toDate().toISOString() : new Date().toISOString(),
            score: data.score || 0,
            correctAnswers: data.correctCount || 0,
            totalQuestions: data.totalQuestions || 0,
            readingLevel: data.readingLevel || "N/A",
            category: data.category || "Uncategorized",
            timeSpent: data.timeSpent || 0
          };
        });

        setHistoryData(quizHistoryItems);
      } catch (error) {
        console.error("Error fetching quiz history:", error);
        setHistoryData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizHistory();
  }, [user]);

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Group by month function
  const groupByMonth = (items: QuizHistoryItem[]) => {
    const grouped: Record<string, QuizHistoryItem[]> = {};
    
    items.forEach(item => {
      const date = new Date(item.date);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      
      grouped[monthYear].push(item);
    });
    
    return grouped;
  };

  // Get unique quizzes count (exclude retakes)
  const getUniqueQuizzesCount = (items: QuizHistoryItem[]) => {
    const uniqueQuizIds = new Set(items.map(item => item.quizId));
    return uniqueQuizIds.size;
  };

  // Get average score using best attempt for each unique quiz
  const getAverageScore = (items: QuizHistoryItem[]) => {
    if (items.length === 0) return 0;
    
    // Group attempts by quizId
    const quizAttempts: Record<string, QuizHistoryItem[]> = {};
    items.forEach(item => {
      if (!quizAttempts[item.quizId]) {
        quizAttempts[item.quizId] = [];
      }
      quizAttempts[item.quizId].push(item);
    });
    
    // Get best score for each quiz
    const bestScores = Object.values(quizAttempts).map(attempts => {
      return Math.max(...attempts.map(a => a.score));
    });
    
    // Calculate average of best scores
    const sum = bestScores.reduce((total, score) => total + score, 0);
    return Math.round(sum / bestScores.length);
  };

  // Get current month unique quiz count
  const getCurrentMonthQuizCount = (items: QuizHistoryItem[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filter to current month items
    const currentMonthItems = items.filter(item => {
      const date = new Date(item.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    // Get unique quiz count for current month
    return getUniqueQuizzesCount(currentMonthItems);
  };
  
  // Use fetched data or default while loading
  const quizHistory = historyData;
  
  // Group history items by month
  const groupedHistory = groupByMonth(quizHistory);
  
  if (isLoading) {
    return (
      <MainLayout currentRoute="/history" userLevel="8B">
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading history...</span>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout currentRoute="/history" userLevel="8B">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold">Quiz History</h2>
          <Button variant="outline" asChild>
            <Link href="/quizzes">
              <Bookmark className="mr-2 h-4 w-4" />
              Find New Quizzes
            </Link>
          </Button>
        </div>
        
        {/* History Summary Card */}
        <Card className="mb-8">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Quizzes</p>
                <p className="text-3xl font-bold">{getUniqueQuizzesCount(quizHistory)}</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Average Score</p>
                <p className="text-3xl font-bold">
                  {getAverageScore(quizHistory)}%
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">This Month</p>
                <p className="text-3xl font-bold">
                  {getCurrentMonthQuizCount(quizHistory)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* History By Month */}
        {Object.entries(groupedHistory).map(([month, items]) => (
          <div key={month} className="mb-8">
            <div className="flex items-center mb-4">
              <Calendar className="mr-2 h-5 w-5 text-primary-500" />
              <h3 className="font-heading text-lg font-medium">{month}</h3>
            </div>
            
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="hidden md:table-cell">Level</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden md:table-cell">Time</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            item.score >= 90 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                            item.score >= 70 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" :
                            "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                          }
                        >
                          {item.score}% ({item.correctAnswers}/{item.totalQuestions})
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{item.readingLevel}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.category}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatTime(item.timeSpent)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/quiz-results/${item.quizId}`}>
                            <span className="sr-only">View details</span>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        ))}
        
        {quizHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">No quizzes completed yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Start taking quizzes to build your history</p>
            <Button asChild>
              <Link href="/quizzes">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Browse Quizzes
              </Link>
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

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
import { 
  Loader2, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight, 
  Bookmark, 
  ChevronDown,
  RefreshCw
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  retakeCount?: number;
  allAttempts?: QuizHistoryItem[];
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

        // Process retakes - group by quizId and keep only highest score as main entry
        const processedItems = processQuizRetakes(quizHistoryItems);
        setHistoryData(processedItems);
      } catch (error) {
        console.error("Error fetching quiz history:", error);
        setHistoryData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizHistory();
  }, [user]);

  // Process quiz retakes - group by quizId, keep highest score attempt as main
  const processQuizRetakes = (items: QuizHistoryItem[]): QuizHistoryItem[] => {
    const quizMap = new Map<string, QuizHistoryItem[]>();
    
    // Group attempts by quizId
    items.forEach(item => {
      if (!quizMap.has(item.quizId)) {
        quizMap.set(item.quizId, []);
      }
      quizMap.get(item.quizId)?.push(item);
    });
    
    // For each quizId, find the highest score attempt and mark it as main
    const processedItems: QuizHistoryItem[] = [];
    
    quizMap.forEach(attempts => {
      if (attempts.length === 1) {
        // Only one attempt, no retakes
        processedItems.push(attempts[0]);
      } else {
        // Sort attempts by score (highest first)
        const sortedAttempts = [...attempts].sort((a, b) => b.score - a.score);
        const bestAttempt = { ...sortedAttempts[0] };
        
        // Add retake count and other attempts
        bestAttempt.retakeCount = attempts.length - 1;
        bestAttempt.allAttempts = sortedAttempts.slice(1);
        processedItems.push(bestAttempt);
      }
    });
    
    // Sort by date (most recent first)
    return processedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

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

  // Get current month quiz count
  const getCurrentMonthQuizCount = (items: QuizHistoryItem[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return items.filter(item => {
      const date = new Date(item.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
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
                <p className="text-3xl font-bold">{quizHistory.length}</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Average Score</p>
                <p className="text-3xl font-bold">
                  {quizHistory.length > 0 
                    ? Math.round(quizHistory.reduce((sum, item) => sum + item.score, 0) / quizHistory.length)
                    : 0}%
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
                    <Collapsible key={item.id} className="w-full">
                      <TableRow>
                        <TableCell className="font-medium">
                          {item.title}
                          {item.retakeCount && item.retakeCount > 0 && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              <RefreshCw className="mr-1 h-3 w-3" />
                              {item.retakeCount} retake{item.retakeCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </TableCell>
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
                        <TableCell className="flex items-center">
                          {item.allAttempts && item.allAttempts.length > 0 && (
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="mr-2">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </CollapsibleTrigger>
                          )}
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/quiz-results/${item.quizId}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {item.allAttempts && item.allAttempts.length > 0 && (
                        <CollapsibleContent>
                          {item.allAttempts.map((attempt, index) => (
                            <TableRow key={attempt.id} className="bg-gray-50 dark:bg-gray-800/50">
                              <TableCell className="pl-8 text-sm text-gray-500">
                                Retake {index + 1}
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(attempt.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline"
                                  className={
                                    attempt.score >= 90 ? "bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-300" :
                                    attempt.score >= 70 ? "bg-blue-50 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" :
                                    "bg-orange-50 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300"
                                  }
                                >
                                  {attempt.score}% ({attempt.correctAnswers}/{attempt.totalQuestions})
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{attempt.readingLevel}</TableCell>
                              <TableCell className="hidden md:table-cell">{attempt.category}</TableCell>
                              <TableCell className="hidden md:table-cell">{formatTime(attempt.timeSpent)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/quiz-results/${attempt.quizId}?attempt=${attempt.id}`}>
                                    <ChevronRight className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </CollapsibleContent>
                      )}
                    </Collapsible>
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

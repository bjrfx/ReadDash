import React, { useEffect, useState } from "react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, Calendar, ChevronRight, ArrowUpRight, Bookmark, ChevronDown, CheckCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/seo/SEO";

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
  pointsEarned: number; // Add pointsEarned to track points per quiz
}

export default function History() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [historyData, setHistoryData] = useState<QuizHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingPoints, setSyncingPoints] = useState(false);
  const [pointsSynced, setPointsSynced] = useState(false);

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
          // Debug log to inspect data
          // console.log(`Quiz result data for ${doc.id}:`, data);
          
          // Convert pointsEarned to a number - sometimes it might be stored as string
          let points = 0;
          if (data.pointsEarned !== undefined) {
            points = Number(data.pointsEarned);
          } else if (data.points !== undefined) {
            // Some documents might use "points" instead of "pointsEarned"
            points = Number(data.points);
          } else {
            // If no points are stored, calculate an estimate based on score and reading level
            const readingLevelNum = parseInt(data.readingLevel?.replace(/[A-Z]/g, '') || '5');
            const scoreFactor = Math.round((data.score || 0) / 10);
            const levelFactor = readingLevelNum * 2;
            points = 10 + levelFactor + scoreFactor;
            // console.log(`Estimated points for quiz ${doc.id}: ${points}`);
          }

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
            timeSpent: data.timeSpent || 0,
            pointsEarned: points
          };
        });

        setHistoryData(quizHistoryItems);
        
        // After fetching history, check and sync points
        if (quizHistoryItems.length > 0) {
          checkAndSyncPoints(quizHistoryItems);
        }
      } catch (error) {
        console.error("Error fetching quiz history:", error);
        setHistoryData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizHistory();
  }, [user]);

  // Check if total points from history match Firestore and sync if needed
  const checkAndSyncPoints = async (historyItems: QuizHistoryItem[]) => {
    if (!user?.uid) return;
    
    try {
      // Get current user data from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log("User document not found in Firestore");
        return;
      }
      
      const userData = userDoc.data();
      const storedPoints = userData.knowledgePoints || 0;
      
      // Calculate correct total points from history (best attempt for each quiz)
      const calculatedPoints = calculateTotalPointsFromHistory(historyItems);
      
      // console.log("Points check:", { 
      //   storedInFirestore: storedPoints, 
      //   calculatedFromHistory: calculatedPoints 
      // });
      
      // If there's a mismatch, update Firestore
      if (storedPoints !== calculatedPoints) {
        // console.log("Points mismatch detected. Updating Firestore...");
        setSyncingPoints(true);
        
        // Update user document with correct points
        await updateDoc(userDocRef, {
          knowledgePoints: calculatedPoints,
          lastPointsSync: new Date()
        });
        
        setSyncingPoints(false);
        setPointsSynced(true);
        
        // Show success toast
        toast({
          title: "Points synchronized",
          description: `Your knowledge points have been updated to ${calculatedPoints}`,
          variant: "default",
        });
        
        console.log("Points successfully synchronized");
      } else {
        console.log("Points are already in sync");
      }
    } catch (error) {
      console.error("Error synchronizing points:", error);
      setSyncingPoints(false);
      
      // Show error toast
      toast({
        title: "Synchronization failed",
        description: "There was an error updating your knowledge points",
        variant: "destructive",
      });
    }
  };
  
  // Calculate total points from history considering only best attempts
  const calculateTotalPointsFromHistory = (items: QuizHistoryItem[]) => {
    // Group all attempts by quizId
    const quizAttempts: Record<string, QuizHistoryItem[]> = {};
    
    items.forEach(item => {
      if (!quizAttempts[item.quizId]) {
        quizAttempts[item.quizId] = [];
      }
      quizAttempts[item.quizId].push(item);
    });
    
    // Sum up the points from best attempts only
    let totalPoints = 0;
    
    Object.values(quizAttempts).forEach(attempts => {
      // Find the attempt with the highest score
      const bestAttempt = attempts.reduce((best, current) => {
        return current.score > best.score ? current : best;
      }, attempts[0]);
      
      // Add points from best attempt
      totalPoints += bestAttempt.pointsEarned || 0;
    });
    
    return totalPoints;
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

  // Get total knowledge points (from best attempts only)
  const getTotalKnowledgePoints = (items: QuizHistoryItem[]) => {
    return calculateTotalPointsFromHistory(items);
  };

  // Group quizzes by quizId and find best attempt
  const groupQuizzesByIdWithBestAttempt = (items: QuizHistoryItem[]) => {
    const grouped: Record<string, {
      bestAttempt: QuizHistoryItem,
      allAttempts: QuizHistoryItem[]
    }> = {};
    
    // Group all attempts by quizId
    items.forEach(item => {
      if (!grouped[item.quizId]) {
        grouped[item.quizId] = {
          bestAttempt: item,
          allAttempts: [item]
        };
      } else {
        grouped[item.quizId].allAttempts.push(item);
        // Update best attempt if this attempt has higher score
        if (item.score > grouped[item.quizId].bestAttempt.score) {
          grouped[item.quizId].bestAttempt = item;
        }
      }
    });
    
    return grouped;
  };
  
  // Use fetched data or default while loading
  const quizHistory = historyData;
  
  // Group history items by month
  const groupedHistory = groupByMonth(quizHistory);
  
  if (isLoading) {
    return (
      <MainLayout currentRoute="/history">
        <SEO 
          title="Quiz History | ReadDash - Track Your Reading Progress"
          description="Review your quiz history, track your performance over time, and see your improvement in reading comprehension with detailed statistics."
          keywords="reading history, quiz history, reading progress, learning analytics, reading statistics"
          canonicalUrl="/history"
        />
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading history...</span>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout currentRoute="/history">
      <SEO 
        title="Quiz History | ReadDash - Track Your Reading Progress"
        description="Review your quiz history, track your performance over time, and see your improvement in reading comprehension with detailed statistics."
        keywords="reading history, quiz history, reading progress, learning analytics, reading statistics"
        canonicalUrl="/history"
      />
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Knowledge Points</p>
                <div className="flex items-center justify-center">
                  <p className="text-3xl font-bold mr-2">
                    {getTotalKnowledgePoints(quizHistory)}
                  </p>
                  {pointsSynced && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {isSyncingPoints && (
                    <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* History By Month */}
        {Object.entries(groupedHistory).map(([month, items]) => {
          // Group items by quizId
          const groupedQuizzes = groupQuizzesByIdWithBestAttempt(items);
          
          return (
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
                    <TableHead className="hidden md:table-cell">Points</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(groupedQuizzes).map(({ bestAttempt, allAttempts }) => (
                    <React.Fragment key={bestAttempt.id}>
                      <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell className="font-medium">{bestAttempt.title}</TableCell>
                        <TableCell>{new Date(bestAttempt.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              bestAttempt.score >= 90 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                              bestAttempt.score >= 70 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" :
                              "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                            }
                          >
                            {bestAttempt.score}% ({bestAttempt.correctAnswers}/{bestAttempt.totalQuestions})
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{bestAttempt.readingLevel}</TableCell>
                        <TableCell className="hidden md:table-cell">{bestAttempt.category}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatTime(bestAttempt.timeSpent)}</TableCell>
                        <TableCell className="hidden md:table-cell">{bestAttempt.pointsEarned}</TableCell>
                        <TableCell>
                          <div className="flex">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/quiz-results/${bestAttempt.quizId}`}>
                                <span className="sr-only">View details</span>
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {allAttempts.length > 1 && (
                        <TableRow className="border-t-0">
                          <TableCell colSpan={7} className="p-0">
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="attempts" className="border-b-0">
                                <AccordionTrigger className="py-2 px-4 text-xs text-gray-500">
                                  View all {allAttempts.length} attempts
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="overflow-hidden">
                                    <Table>
                                      <TableBody>
                                        {allAttempts
                                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                          .map((attempt, index) => (
                                            <TableRow key={attempt.id} className={
                                              attempt.id === bestAttempt.id 
                                                ? "bg-gray-50 dark:bg-gray-800" 
                                                : ""
                                            }>
                                              <TableCell className="font-medium pl-6">
                                                {index === 0 && allAttempts.length > 1 ? "Latest attempt" : 
                                                 attempt.id === bestAttempt.id ? "High score" : `Attempt ${allAttempts.length - index}`}
                                              </TableCell>
                                              <TableCell>{new Date(attempt.date).toLocaleDateString()}</TableCell>
                                              <TableCell>
                                                <Badge 
                                                  className={
                                                    attempt.score >= 90 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                                                    attempt.score >= 70 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" :
                                                    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                                                  }
                                                >
                                                  {attempt.score}% ({attempt.correctAnswers}/{attempt.totalQuestions})
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="hidden md:table-cell">{attempt.readingLevel}</TableCell>
                                              <TableCell className="hidden md:table-cell">{attempt.category}</TableCell>
                                              <TableCell className="hidden md:table-cell">{formatTime(attempt.timeSpent)}</TableCell>
                                              <TableCell className="hidden md:table-cell">{attempt.pointsEarned}</TableCell>
                                              <TableCell>
                                                <Button variant="ghost" size="sm" asChild>
                                                  <Link href={`/quiz-results/${attempt.quizId}`}>
                                                    <span className="sr-only">View details</span>
                                                    <ChevronRight className="h-4 w-4" />
                                                  </Link>
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
          );
        })}
        
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

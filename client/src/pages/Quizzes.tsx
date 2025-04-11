import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/hooks";
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
import { Loader2, SearchIcon, FilterIcon, BookPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  readingLevel: string;
  estimatedTime: number;
  imageUrl?: string;
}

export default function Quizzes() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  
  // Fetch quizzes
  const { data: quizzesData, isLoading } = useQuery({
    queryKey: ['/api/quizzes'],
    enabled: !!user,
  });
  
  // Format estimated time
  const formatTime = (minutes: number) => {
    return minutes < 1 ? "< 1 min" : `${minutes} min`;
  };
  
  // Default quizzes data
  const defaultQuizzes: Quiz[] = [
    {
      id: "q1",
      title: "The Wonders of Marine Biology",
      description: "Explore the fascinating world beneath the ocean's surface and discover the complex ecosystems of coral reefs.",
      category: "Science",
      readingLevel: "8B",
      estimatedTime: 5
    },
    {
      id: "q2",
      title: "Space Exploration: Past and Future",
      description: "The history and future prospects of human space travel, from the first moon landing to Mars missions.",
      category: "History/Science",
      readingLevel: "8A",
      estimatedTime: 7
    },
    {
      id: "q3",
      title: "Modern Architecture and Design",
      description: "Exploring the principles behind contemporary buildings and how they shape our cities and lives.",
      category: "Arts",
      readingLevel: "8B",
      estimatedTime: 4
    },
    {
      id: "q4",
      title: "The American Civil War",
      description: "A comprehensive look at the causes, key battles, and aftermath of the American Civil War.",
      category: "History",
      readingLevel: "7A",
      estimatedTime: 8
    },
    {
      id: "q5",
      title: "Understanding Climate Change",
      description: "Learn about the science behind climate change, its effects, and what we can do to mitigate its impact.",
      category: "Science",
      readingLevel: "6B",
      estimatedTime: 6
    },
    {
      id: "q6",
      title: "Great American Literature",
      description: "Explore the works of classic American authors and their impact on literature and culture.",
      category: "Literature",
      readingLevel: "9A",
      estimatedTime: 10
    }
  ];
  
  // Use fetched data or default
  const quizzes = quizzesData || defaultQuizzes;
  
  // Apply filters and search
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         quiz.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || quiz.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesLevel = levelFilter === "all" || quiz.readingLevel === levelFilter;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });
  
  // Get recommended quizzes (based on user's level)
  const recommendedQuizzes = filteredQuizzes.filter(quiz => quiz.readingLevel === "8B");
  
  // Recent quizzes (could be based on creation date in real app)
  const recentQuizzes = [...filteredQuizzes].sort(() => 0.5 - Math.random()).slice(0, 3);
  
  if (isLoading) {
    return (
      <MainLayout currentRoute="/quizzes" userLevel="8B">
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading quizzes...</span>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout currentRoute="/quizzes" userLevel="8B">
      <div className="p-4 sm:p-6">
        <h2 className="font-heading text-2xl font-bold mb-6">Reading Quizzes</h2>
        
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
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="literature">Literature</SelectItem>
                  <SelectItem value="arts">Arts</SelectItem>
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
                  <SelectItem value="5A">Level 5A</SelectItem>
                  <SelectItem value="6B">Level 6B</SelectItem>
                  <SelectItem value="7A">Level 7A</SelectItem>
                  <SelectItem value="8A">Level 8A</SelectItem>
                  <SelectItem value="8B">Level 8B</SelectItem>
                  <SelectItem value="9A">Level 9A</SelectItem>
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
                  <QuizCard key={quiz.id} quiz={quiz} />
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
                  <QuizCard key={quiz.id} quiz={quiz} />
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
                  <QuizCard key={quiz.id} quiz={quiz} />
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
    </MainLayout>
  );
}

// Quiz Card Component
function QuizCard({ quiz }: { quiz: Quiz }) {
  // Local formatTime function
  const formatEstimatedTime = (minutes: number) => {
    if (!minutes || isNaN(minutes)) return "Unknown";
    return minutes < 1 ? "< 1 min" : `${minutes} min`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-gray-200 dark:bg-gray-700 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            className="w-12 h-12 text-gray-400 dark:text-gray-500"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <Badge variant="secondary" className="absolute top-2 right-2 bg-primary-500 text-white">
          Level {quiz.readingLevel}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h4 className="font-medium mb-1">{quiz.title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{quiz.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {quiz.category}
            </Badge>
            <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {formatEstimatedTime(quiz.estimatedTime)}
            </Badge>
          </div>
          <Button 
            variant="link" 
            className="text-primary-600 dark:text-primary-400 text-sm font-medium p-0"
            asChild
          >
            <Link href={`/quiz/${quiz.id}`}>Start Quiz</Link>
          </Button>
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

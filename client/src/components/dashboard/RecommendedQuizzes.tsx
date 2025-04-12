import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuizCardSkeleton } from "@/components/ui/skeleton-loaders";

interface Quiz {
  id: string;
  title: string;
  description: string;
  image: string;
  readingLevel: string;
  category: string;
}

interface RecommendedQuizzesProps {
  quizzes: Quiz[];
  isLoading?: boolean;
}

export function RecommendedQuizzes({ quizzes, isLoading = false }: RecommendedQuizzesProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-medium">Recommended Quizzes</h3>
        <Link href="/quizzes" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          See all quizzes
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          // Show skeleton loaders when loading
          <>
            {[1, 2, 3].map((i) => (
              <QuizCardSkeleton key={i} />
            ))}
          </>
        ) : quizzes.map((quiz) => (
          <Card key={quiz.id} className="overflow-hidden">
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{quiz.description}</p>
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {quiz.category}
                </Badge>
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
        ))}
      </div>
    </div>
  );
}

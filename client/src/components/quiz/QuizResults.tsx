import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon, ChartLine } from "lucide-react";

interface QuizResultsProps {
  title: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  pointsEarned: number;
  timeSpent: string;
  averageTime: string;
  levelImproved: boolean;
  nextLevel?: string;
}

export function QuizResults({
  title,
  score,
  correctAnswers,
  totalQuestions,
  pointsEarned,
  timeSpent,
  averageTime,
  levelImproved,
  nextLevel,
}: QuizResultsProps) {
  // Ensure score is a valid number between 0-1 before converting to percentage
  const validScore = typeof score === 'number' && !isNaN(score) 
    ? score 
    : correctAnswers && totalQuestions 
      ? correctAnswers / totalQuestions 
      : 0;
      
  // Calculate score percentage (0-100)
  const scorePercentage = Math.round(validScore * 100);
  
  return (
    <Card className="mb-6">
      <CardContent className="p-5">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
            <CheckIcon className="w-8 h-8" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-1">Quiz Complete!</h2>
          <p className="text-gray-500 dark:text-gray-400">{title || "Quiz"}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Score</p>
            <p className="text-2xl font-bold">{scorePercentage}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {correctAnswers || 0} out of {totalQuestions || 0} correct
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Points Earned</p>
            <p className="text-2xl font-bold">+{pointsEarned || 0}</p>
            <p className="text-xs text-green-600 dark:text-green-400">
              <span className="inline-block mr-1">↑</span> Knowledge Points
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Time Spent</p>
            <p className="text-2xl font-bold">{timeSpent || "0:00"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Average: {averageTime || "0:00"}</p>
          </div>
        </div>
        
        {levelImproved && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0 mr-3">
                <ChartLine className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-green-800 dark:text-green-300 mb-1">
                  Your reading level has improved!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  You're making great progress. Keep it up{nextLevel ? ` to reach level ${nextLevel}!` : "!"}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild>
            <Link href="/history">Review Answers</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/history">View Quiz History</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

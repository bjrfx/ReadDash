import { GraduationCap, CheckCheck, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface UserStats {
  readingLevel: string;
  previousLevel: string;
  quizzesCompleted: number;
  quizzesThisWeek: number;
  knowledgePoints: number;
  pointsToNextLevel: number;
}

interface DashboardHeaderProps {
  stats: UserStats;
}

export function DashboardHeader({ stats }: DashboardHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="font-heading text-2xl font-bold mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reading Level Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-primary-100 dark:bg-primary-900/30 p-3 mr-4">
                <GraduationCap className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Reading Level</p>
                <p className="text-xl font-bold">Level {stats.readingLevel}</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  <span className="inline-block mr-1">↑</span> Up from {stats.previousLevel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Quizzes Completed Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-secondary-100 dark:bg-secondary-900/30 p-3 mr-4">
                <CheckCheck className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Quizzes Completed</p>
                <p className="text-xl font-bold">{stats.quizzesCompleted}</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  <span className="inline-block mr-1">↑</span> {stats.quizzesThisWeek} this week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Knowledge Points Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-3 mr-4">
                <Zap className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Knowledge Points</p>
                <p className="text-xl font-bold">{stats.knowledgePoints.toLocaleString()}</p>
                <div className="flex items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Next level: </span>
                  <span className="ml-1 font-medium">{stats.pointsToNextLevel.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
    <div className="mb-6 fade-in">
      <h2 className="font-heading text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent inline-block">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reading Level Card */}
        <Card className="overflow-hidden border-primary/10 glow-primary">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-primary/10 p-3 mr-4 scale-on-hover">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reading Level</p>
                <p className="text-xl font-bold">Level {stats.readingLevel}</p>
                <p className="text-xs text-green-500 font-medium">
                  <span className="inline-block mr-1">↑</span> Up from {stats.previousLevel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Quizzes Completed Card */}
        <Card className="overflow-hidden border-secondary/10 glow-primary">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-secondary/10 p-3 mr-4 scale-on-hover">
                <CheckCheck className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quizzes Completed</p>
                <p className="text-xl font-bold">{stats.quizzesCompleted}</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  <span className="inline-block mr-1">↑</span> {stats.quizzesThisWeek} this week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Knowledge Points Card */}
        <Card className="overflow-hidden border-yellow-400/10 glow-primary">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-400/10 p-3 mr-4 scale-on-hover">
                <Zap className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Knowledge Points</p>
                <p className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{stats.knowledgePoints.toLocaleString()}</p>
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

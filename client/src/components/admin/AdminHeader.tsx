import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, GraduationCap, AlertCircle, Plus } from "lucide-react";

interface AdminStats {
  activeUsers: number;
  userChangePercentage: number;
  quizzesTaken: number;
  quizChangePercentage: number;
  averageLevel: string;
  mostCommonRange: string;
  issuesReported: number;
  newIssues: number;
}

interface AdminHeaderProps {
  stats: AdminStats;
  onAddQuiz: () => void;
}

export function AdminHeader({ stats, onAddQuiz }: AdminHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold">Admin Dashboard</h2>
        <Button onClick={onAddQuiz}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Quiz
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Users Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 mr-4">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Active Users</p>
                <p className="text-xl font-bold">{stats.activeUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  <span className="inline-block mr-1">↑</span> {stats.userChangePercentage}% this week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Quizzes Taken Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 mr-4">
                <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Quizzes Taken</p>
                <p className="text-xl font-bold">{stats.quizzesTaken.toLocaleString()}</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  <span className="inline-block mr-1">↑</span> {stats.quizChangePercentage}% this week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Avg. Level Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3 mr-4">
                <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Avg. Level</p>
                <p className="text-xl font-bold">{stats.averageLevel}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Most common: {stats.mostCommonRange}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Issues Reported Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3 mr-4">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Issues Reported</p>
                <p className="text-xl font-bold">{stats.issuesReported}</p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  <span className="inline-block mr-1">↑</span> {stats.newIssues} new today
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

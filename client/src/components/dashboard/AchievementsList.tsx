import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgClass: string;
  earnedAt?: Date;
  date?: string;
}

interface AchievementsListProps {
  achievements: Achievement[];
  loading?: boolean;
}

export function AchievementsList({ achievements, loading = false }: AchievementsListProps) {
  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-medium">Recent Achievements</h3>
        </div>
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2">Loading achievements...</span>
        </div>
      </div>
    );
  }
  
  if (!achievements || achievements.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-medium">Recent Achievements</h3>
          <Link href="/achievements" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            View all
          </Link>
        </div>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-gray-500 dark:text-gray-400 py-4">No achievements earned yet. Keep reading and completing quizzes!</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-medium">Recent Achievements</h3>
        <Link href="/achievements" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          View all
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {achievements.map((achievement) => (
          <Card key={achievement.id}>
            <CardContent className="p-4 text-center">
              <div className={`w-16 h-16 mx-auto mb-3 ${achievement.bgClass} text-white rounded-full flex items-center justify-center`}>
                {achievement.icon}
              </div>
              <h4 className="font-medium mb-1">{achievement.title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{achievement.description}</p>
              {achievement.date && (
                <Badge variant="outline" className="mx-auto">
                  Earned: {achievement.date}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

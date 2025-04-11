import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgClass: string;
}

interface AchievementsListProps {
  achievements: Achievement[];
}

export function AchievementsList({ achievements }: AchievementsListProps) {
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
              <p className="text-xs text-gray-500 dark:text-gray-400">{achievement.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface WeeklyActivity {
  day: string;
  count: number;
  isActive: boolean;
}

interface ReadingLevel {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming' | 'goal';
}

interface ProgressChartsProps {
  weeklyActivity: WeeklyActivity[];
  readingLevels: ReadingLevel[];
  currentProgress: number;
}

export function ProgressCharts({ 
  weeklyActivity, 
  readingLevels, 
  currentProgress,
}: ProgressChartsProps) {
  // Find max value to calculate relative heights
  const maxActivity = Math.max(...weeklyActivity.map(day => day.count));
  // Check if all counts are zero
  const noActivity = weeklyActivity.every(day => day.count === 0);

  // Debug log for troubleshooting
  console.log('ProgressCharts weeklyActivity:', weeklyActivity);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Weekly Activity Chart */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-heading text-lg font-medium mb-4">Weekly Activity</h3>
          {noActivity ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-base">
              No activity this week
            </div>
          ) : (
            <div className="h-64 flex items-end space-x-2">
              {weeklyActivity.map((day) => (
                <div key={day.day} className="flex flex-col items-center flex-1">
                  <div 
                    className={`w-full ${
                      day.isActive 
                        ? "bg-primary-500 dark:bg-primary-600" 
                        : "bg-primary-100 dark:bg-primary-900/20"
                    } rounded-t-md`} 
                    style={{ height: `${maxActivity ? (day.count / maxActivity) * 100 : 0}%` }}
                  />
                  <span className={`text-xs mt-2 ${
                    day.isActive 
                      ? "font-medium text-primary-500" 
                      : "text-gray-500"
                  }`}>
                    {day.day}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Reading Level Progress */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-heading text-lg font-medium mb-4">Reading Level Progress</h3>
          <div className="relative pt-4">
            <div className="mb-8">
              <div className="flex justify-between mb-2 text-sm">
                <span>Current Progress</span>
                <span className="font-medium">{currentProgress}%</span>
              </div>
              <Progress 
                value={currentProgress} 
                className="h-3 bg-gray-100 dark:bg-gray-700" 
              />
            </div>
            
            <div className="relative">
              <div className="absolute h-1 bg-gray-200 dark:bg-gray-700 inset-x-0 top-5" />
              
              <div className="relative flex justify-between">
                {readingLevels.map((level) => (
                  <div key={level.id} className="flex flex-col items-center">
                    <div className={`rounded-full w-10 h-10 flex items-center justify-center ${
                      level.status === 'completed' 
                        ? "bg-green-500 text-white" 
                        : level.status === 'current' 
                          ? "bg-primary-500 text-white" 
                          : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                    }`}>
                      {level.status === 'completed' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">{level.label}</span>
                      )}
                    </div>
                    <span className={`text-xs mt-2 ${
                      level.status === 'current' 
                        ? "font-medium" 
                        : level.status === 'upcoming' || level.status === 'goal' 
                          ? "text-gray-400" 
                          : ""
                    }`}>
                      {level.status === 'current' ? 'Current' : level.status === 'upcoming' ? 'Next' : level.status === 'goal' ? 'Goal' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

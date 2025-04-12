import { ReactNode } from "react";
import { useAuth } from "@/lib/hooks";
import { useUserData } from "@/lib/userData";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { DailyGoalDialog } from "@/components/dashboard/DailyGoalDialog"; 

interface MainLayoutProps {
  children: ReactNode;
  currentRoute: string;
  dailyGoalProgress?: number;
  notificationCount?: number;
}

export function MainLayout({ 
  children, 
  currentRoute,
  dailyGoalProgress = 0,
  notificationCount = 0
}: MainLayoutProps) {
  const { user } = useAuth();
  const { data: userData, isLoading } = useUserData();
  
  // Use real reading level from Firestore or fallback to default
  const userLevel = userData?.readingLevel || "1A";

  return (
    <>
      <MobileHeader 
        user={user} 
        userLevel={userLevel} 
        notificationCount={notificationCount} 
      />
      <DesktopSidebar 
        user={user} 
        userLevel={userLevel} 
        dailyGoalProgress={dailyGoalProgress} 
      />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        {children}
      </main>
      
      <MobileNavBar currentRoute={currentRoute} />
      
      {/* Daily Goal Dialog - will automatically handle its visibility */}
      {user && <DailyGoalDialog />}
    </>
  );
}

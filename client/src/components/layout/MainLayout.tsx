import { ReactNode } from "react";
import { useAuth } from "@/lib/hooks";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";

interface MainLayoutProps {
  children: ReactNode;
  currentRoute: string;
  userLevel?: string;
  dailyGoalProgress?: number;
  notificationCount?: number;
}

export function MainLayout({ 
  children, 
  currentRoute,
  userLevel = "1A",
  dailyGoalProgress = 0,
  notificationCount = 0
}: MainLayoutProps) {
  const { user } = useAuth();

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
    </>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { useAdmin, useAuth } from "@/lib/hooks";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { UsersList } from "@/components/admin/UsersList";
import { ContentManagement } from "@/components/admin/ContentManagement";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GenerateQuizRequest } from "@/lib/gemini";
import { Loader2 } from "lucide-react";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  
  // Fetch admin stats
  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: !!isAdmin,
  });
  
  // Fetch users for admin
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: !!isAdmin,
  });
  
  // Fetch passages for content management
  const { data: passages, isLoading: passagesLoading } = useQuery({
    queryKey: ['/api/admin/passages'],
    enabled: !!isAdmin,
  });
  
  // Quiz generation mutation
  const generateQuizMutation = useMutation({
    mutationFn: async (request: GenerateQuizRequest) => {
      return apiRequest('POST', '/api/admin/generate-quiz', request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/passages'] });
    },
    onError: (error) => {
      toast({
        title: "Quiz generation failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // User actions
  const handleViewUser = (userId: string) => {
    setLocation(`/admin/users/${userId}`);
  };
  
  const handleEditUser = (userId: string) => {
    setLocation(`/admin/users/${userId}/edit`);
  };
  
  // Passage actions
  const handleEditPassage = (passageId: string) => {
    setLocation(`/admin/passages/${passageId}/edit`);
  };
  
  const handleDeletePassage = async (passageId: string) => {
    try {
      await apiRequest('DELETE', `/api/admin/passages/${passageId}`);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/passages'] });
      toast({
        title: "Passage deleted",
        description: "The passage has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete passage",
        variant: "destructive",
      });
    }
  };
  
  const handleAddQuiz = () => {
    setLocation('/admin/quizzes/new');
  };
  
  const handleViewAllPassages = () => {
    setLocation('/admin/passages');
  };
  
  // Generate quiz handler
  const handleGenerateQuiz = async (request: GenerateQuizRequest) => {
    await generateQuizMutation.mutateAsync(request);
  };
  
  // Redirect if not admin
  if (!adminLoading && !isAdmin) {
    setLocation('/');
    return null;
  }
  
  // Show loading state
  if (adminLoading || statsLoading || usersLoading || passagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2">Loading admin panel...</span>
      </div>
    );
  }
  
  // Default data for when API requests fail
  const defaultStats = {
    activeUsers: 1245,
    userChangePercentage: 12,
    quizzesTaken: 8376,
    quizChangePercentage: 8,
    averageLevel: "6B",
    mostCommonRange: "5A-7B",
    issuesReported: 12,
    newIssues: 3,
  };
  
  const defaultUsers = Array(3).fill(null).map((_, index) => ({
    id: `user-${index + 1}`,
    name: ["Sophie Taylor", "Michael Roberts", "David Kim"][index],
    email: [`sophie.t@example.com`, `michael.r@example.com`, `david.k@example.com`][index],
    photoURL: "",
    joinDate: ["Jan 2023", "Mar 2023", "Nov 2022"][index],
    readingLevel: ["9A", "6B", "5A"][index],
    levelCategory: ["Advanced", "Intermediate", "Basic"][index],
    quizzesCompleted: [42, 18, 10][index],
    correctPercentage: [87, 72, 64][index],
    lastActive: ["2 hours ago", "1 day ago", "3 days ago"][index],
  }));
  
  const defaultPassages = [
    {
      id: "passage-1",
      title: "The Mysteries of Deep Space",
      level: "8A",
      category: "Science",
      questionCount: 5,
    },
    {
      id: "passage-2",
      title: "Ancient Civilizations: Maya",
      level: "7B",
      category: "History",
      questionCount: 4,
    },
    {
      id: "passage-3",
      title: "The Biology of Trees",
      level: "6A",
      category: "Science",
      questionCount: 5,
    },
  ];
  
  // Use fetched data or defaults
  const stats = adminStats || defaultStats;
  const userData = users || defaultUsers;
  const passageData = passages || defaultPassages;
  
  return (
    <>
      <MobileHeader user={user} userLevel={user?.displayName ? user.displayName.charAt(0) : "U"} />
      <DesktopSidebar user={user} userLevel="8B" dailyGoalProgress={2} />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-6">
          <AdminHeader stats={stats} onAddQuiz={handleAddQuiz} />
          
          <UsersList 
            users={userData} 
            onViewUser={handleViewUser} 
            onEditUser={handleEditUser} 
          />
          
          <ContentManagement 
            passages={passageData} 
            onEditPassage={handleEditPassage} 
            onDeletePassage={handleDeletePassage} 
            onGenerateQuiz={handleGenerateQuiz}
            onViewAllPassages={handleViewAllPassages}
          />
        </div>
      </main>
    </>
  );
}

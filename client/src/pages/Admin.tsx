import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdmin, useAuth } from "@/lib/hooks";
import { useUserData } from "@/lib/userData";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { UsersList } from "@/components/admin/UsersList";
import { ContentManagement } from "@/components/admin/ContentManagement";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GenerateQuizRequest } from "@/lib/gemini";
import { Loader2, UserPlus, PlusCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc, query, where, orderBy, limit, addDoc, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const { data: userData } = useUserData();
  
  // State to hold Firebase data
  const [adminStats, setAdminStats] = useState(null);
  const [users, setUsers] = useState(null);
  const [passages, setPassages] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch data from Firebase
  useEffect(() => {
    const fetchFirebaseData = async () => {
      if (!isAdmin) return;
      
      try {
        setLoading(true);
        
        // Fetch users from Firebase
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Format join date
          joinDate: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'short'
          }) : 'Unknown',
          // Format last active
          lastActive: doc.data().lastLogin ? formatTimeAgo(doc.data().lastLogin.toDate()) : 'Unknown'
        }));
        setUsers(usersData);
        
        // Fetch passages from Firebase
        const passagesSnapshot = await getDocs(collection(db, "passages"));
        const passagesData = passagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPassages(passagesData);
        
        // Calculate admin stats
        const stats = {
          activeUsers: usersData.length,
          userChangePercentage: 0, // You would calculate this from historical data
          quizzesTaken: 0,
          quizChangePercentage: 0,
          averageLevel: calculateAverageLevel(usersData),
          mostCommonRange: calculateMostCommonRange(usersData),
          issuesReported: 0,
          newIssues: 0
        };
        
        // Count quizzes taken
        const quizzesSnapshot = await getDocs(collection(db, "quizResults"));
        stats.quizzesTaken = quizzesSnapshot.size;
        
        // Count issues reported
        const issuesSnapshot = await getDocs(collection(db, "issues"));
        stats.issuesReported = issuesSnapshot.size;
        
        // Count new issues (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const newIssuesQuery = query(
          collection(db, "issues"),
          where("createdAt", ">=", yesterday)
        );
        const newIssuesSnapshot = await getDocs(newIssuesQuery);
        stats.newIssues = newIssuesSnapshot.size;
        
        setAdminStats(stats);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Firebase data:", error);
        toast({
          title: "Error loading data",
          description: error instanceof Error ? error.message : "Failed to load admin data",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    
    fetchFirebaseData();
  }, [isAdmin, toast]);
  
  // Helper functions for stats calculations
  const calculateAverageLevel = (users) => {
    if (!users || users.length === 0) return "N/A";
    
    const validUsers = users.filter(user => user.readingLevel);
    if (validUsers.length === 0) return "N/A";
    
    // This is a simplified calculation - you would need to implement your own logic
    // based on how your reading levels are structured
    return validUsers[Math.floor(validUsers.length / 2)].readingLevel || "6B";
  };
  
  const calculateMostCommonRange = (users) => {
    if (!users || users.length === 0) return "N/A";
    
    // This is a placeholder - implement your own logic based on your level structure
    return "5A-7B";
  };
  
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return `${Math.round(diffHours)} hours ago`;
    } else if (diffHours < 48) {
      return "1 day ago";
    } else {
      return `${Math.floor(diffHours / 24)} days ago`;
    }
  };
  
  // Quiz generation mutation
  const generateQuizMutation = useMutation({
    mutationFn: async (request: GenerateQuizRequest) => {
      return apiRequest('POST', '/api/admin/generate-quiz', request);
    },
    onSuccess: () => {
      // Refresh passages data after generating a new quiz
      getDocs(collection(db, "passages")).then(snapshot => {
        const passagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPassages(passagesData);
      });
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
      // Delete the passage from Firestore
      await deleteDoc(doc(db, "passages", passageId));
      
      // Update local state to reflect the deletion
      setPassages(prevPassages => 
        prevPassages.filter(passage => passage.id !== passageId)
      );
      
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
  
  // Add this new function for creating test users
  const createTestUsers = async () => {
    try {
      setLoading(true);
      
      const testUsers = [
        {
          displayName: "Sarah Johnson",
          email: "sarah.j@example.com",
          photoURL: "",
          createdAt: Timestamp.fromDate(new Date("2024-01-15")),
          lastLogin: Timestamp.fromDate(new Date("2025-04-10")),
          readingLevel: "7A",
          knowledgePoints: 860,
          role: "user",
          quizzesCompleted: 24,
          correctPercentage: 82,
          levelCategory: "Intermediate"
        },
        {
          displayName: "Mike Davidson",
          email: "mike.d@example.com",
          photoURL: "",
          createdAt: Timestamp.fromDate(new Date("2024-02-22")),
          lastLogin: Timestamp.fromDate(new Date("2025-04-11")),
          readingLevel: "9B",
          knowledgePoints: 1250,
          role: "user",
          quizzesCompleted: 31,
          correctPercentage: 89,
          levelCategory: "Advanced"
        },
        {
          displayName: "Emma Wilson",
          email: "emma.w@example.com",
          photoURL: "",
          createdAt: Timestamp.fromDate(new Date("2024-03-10")),
          lastLogin: Timestamp.fromDate(new Date("2025-04-05")),
          readingLevel: "5B",
          knowledgePoints: 420,
          role: "user",
          quizzesCompleted: 12,
          correctPercentage: 71,
          levelCategory: "Basic"
        },
        {
          displayName: "Alex Nguyen",
          email: "alex.n@example.com",
          photoURL: "",
          createdAt: Timestamp.fromDate(new Date("2024-04-01")),
          lastLogin: Timestamp.fromDate(new Date("2025-04-09")),
          readingLevel: "8A",
          knowledgePoints: 940,
          role: "user",
          quizzesCompleted: 28,
          correctPercentage: 85,
          levelCategory: "Advanced"
        }
      ];
      
      // Add each test user to Firestore
      for (const userData of testUsers) {
        await addDoc(collection(db, "users"), userData);
      }
      
      // Refresh users data
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toLocaleDateString('en-US', {
          year: 'numeric', 
          month: 'short'
        }) : 'Unknown',
        lastActive: doc.data().lastLogin ? formatTimeAgo(doc.data().lastLogin.toDate()) : 'Unknown'
      }));
      
      setUsers(usersData);
      
      // Update stats
      if (adminStats) {
        setAdminStats({
          ...adminStats,
          activeUsers: usersData.length
        });
      }
      
      setLoading(false);
      toast({
        title: "Test users created",
        description: `Successfully added ${testUsers.length} test users to the database.`,
      });
    } catch (error) {
      console.error("Error creating test users:", error);
      toast({
        title: "Error creating test users",
        description: error instanceof Error ? error.message : "Failed to create test users",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Redirect if not admin
  if (!adminLoading && !isAdmin) {
    setLocation('/');
    return null;
  }
  
  // Show loading state
  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2">Loading admin panel...</span>
      </div>
    );
  }
  
  // Default data for when Firebase requests fail
  const defaultStats = {
    activeUsers: 0,
    userChangePercentage: 0,
    quizzesTaken: 0, 
    quizChangePercentage: 0,
    averageLevel: "N/A",
    mostCommonRange: "N/A",
    issuesReported: 0,
    newIssues: 0,
  };
  
  const defaultUsers = [];
  const defaultPassages = [];
  
  // Use fetched data or defaults
  const stats = adminStats || defaultStats;
  const usersData = users || defaultUsers;
  const passageData = passages || defaultPassages;
  
  return (
    <>
      <MobileHeader 
        user={user} 
        userLevel={userData?.readingLevel || "1A"} 
        notificationCount={stats.newIssues} 
      />
      <DesktopSidebar 
        user={user} 
        userLevel={userData?.readingLevel || "1A"} 
        dailyGoalProgress={2} 
      />
      <MobileNavBar currentRoute="/admin" />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={createTestUsers}
                className="flex items-center gap-1"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Test Users</span>
              </Button>
              <Button 
                onClick={handleAddQuiz}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add New Quiz</span>
              </Button>
            </div>
          </div>
          
          <AdminHeader stats={stats} />
          
          <UsersList 
            users={usersData} 
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

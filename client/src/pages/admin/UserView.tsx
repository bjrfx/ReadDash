import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAdmin, useAuth } from "@/lib/hooks";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, ArrowLeft, BookOpen, TrendingUp, Award, 
  Calendar, Clock, Mail, CheckCircle, BarChart, 
  Edit, AlertTriangle
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserView() {
  const params = useParams();
  const userId = params.id;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  
  const [userData, setUserData] = useState(null);
  const [userQuizzes, setUserQuizzes] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAdmin || !userId) return;
      
      try {
        setLoading(true);
        
        // Fetch user data from Firestore
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const user = {
            id: userSnap.id,
            ...userSnap.data(),
            joinDate: userSnap.data().createdAt ? new Date(userSnap.data().createdAt.toDate()).toLocaleDateString('en-US', {
              year: 'numeric', 
              month: 'short',
              day: 'numeric'
            }) : 'Unknown',
            lastLogin: userSnap.data().lastLogin ? new Date(userSnap.data().lastLogin.toDate()).toLocaleDateString('en-US', {
              year: 'numeric', 
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Unknown'
          };
          
          setUserData(user);
          
          // Fetch user's quizzes
          const quizzesQuery = query(
            collection(db, "quizResults"), 
            where("userId", "==", userId),
            orderBy("completedAt", "desc"),
            limit(10)
          );
          
          const quizzesSnapshot = await getDocs(quizzesQuery);
          const quizzesData = quizzesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            completedAt: doc.data().completedAt ? new Date(doc.data().completedAt.toDate()).toLocaleDateString('en-US', {
              year: 'numeric', 
              month: 'short',
              day: 'numeric'
            }) : 'Unknown'
          }));
          
          setUserQuizzes(quizzesData);
          
          // Fetch user's achievements
          const achievementsQuery = query(
            collection(db, "achievements"), 
            where("userId", "==", userId),
            orderBy("earnedAt", "desc")
          );
          
          const achievementsSnapshot = await getDocs(achievementsQuery);
          const achievementsData = achievementsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            earnedAt: doc.data().earnedAt ? new Date(doc.data().earnedAt.toDate()).toLocaleDateString('en-US', {
              year: 'numeric', 
              month: 'short',
              day: 'numeric'
            }) : 'Unknown'
          }));
          
          setUserAchievements(achievementsData);
        } else {
          toast({
            title: "User not found",
            description: "The user you're looking for doesn't exist.",
            variant: "destructive",
          });
          setLocation('/admin');
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error loading user data",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [isAdmin, userId, setLocation, toast]);
  
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
        <span className="ml-2">Loading user details...</span>
      </div>
    );
  }
  
  // Show not found message if user data couldn't be loaded
  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The user you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => setLocation('/admin')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <MobileHeader user={user} userLevel={user?.displayName ? user.displayName.charAt(0) : "U"} />
      <DesktopSidebar user={user} userLevel="8B" dailyGoalProgress={2} />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/admin')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">User Details</h1>
            </div>
            <Button 
              onClick={() => setLocation(`/admin/users/${userId}/edit`)}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              Edit User
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <Card className="lg:col-span-1">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  {userData.photoURL ? (
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={userData.photoURL} alt={userData.displayName || 'User'} />
                      <AvatarFallback className="text-2xl">
                        {(userData.displayName || 'U').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="text-2xl bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-300">
                        {(userData.displayName || 'U').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <CardTitle className="text-xl mb-1">{userData.displayName || 'Unknown User'}</CardTitle>
                <div className="flex items-center justify-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <CardDescription className="text-sm">{userData.email || 'No email'}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" /> 
                        Joined
                      </p>
                      <p className="font-medium">{userData.joinDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                        <Clock className="h-4 w-4 mr-1" /> 
                        Last Active
                      </p>
                      <p className="font-medium">{userData.lastLogin}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-medium mb-2">Reading Level</h3>
                    <div className="flex items-center justify-between">
                      <Badge className="font-bold text-lg py-2 px-3">
                        {userData.readingLevel || 'N/A'}
                      </Badge>
                      <span className={`text-sm font-medium ${
                        userData.levelCategory === 'Advanced' 
                          ? 'text-green-600 dark:text-green-400' 
                          : userData.levelCategory === 'Intermediate' 
                            ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {userData.levelCategory || 'Unclassified'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" /> 
                        Quizzes Completed
                      </p>
                      <p className="font-medium">{userData.quizzesCompleted || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                        <BarChart className="h-4 w-4 mr-1" /> 
                        Success Rate
                      </p>
                      <p className="font-medium">{userData.correctPercentage || 0}%</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                      <Award className="h-4 w-4 mr-1" /> 
                      Knowledge Points
                    </p>
                    <p className="font-medium text-xl">{userData.knowledgePoints || 0}</p>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Account Role</p>
                    <Badge variant={userData.role === 'admin' ? 'destructive' : 'outline'} className="font-medium">
                      {userData.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Tabs for Activity and Achievements */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="activity" className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Recent Activity
                  </TabsTrigger>
                  <TabsTrigger value="achievements" className="flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    Achievements
                  </TabsTrigger>
                  <TabsTrigger value="progress" className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Progress
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="activity" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Quiz Activity</CardTitle>
                      <CardDescription>
                        The user's most recent quiz completions and results
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userQuizzes.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <th className="px-4 py-3">Quiz Title</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Score</th>
                                <th className="px-4 py-3">Points</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {userQuizzes.map((quiz) => (
                                <tr key={quiz.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                  <td className="px-4 py-3 whitespace-nowrap">{quiz.title || 'Untitled Quiz'}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">{quiz.completedAt}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <Badge variant={quiz.score >= 0.7 ? 'success' : quiz.score >= 0.5 ? 'warning' : 'destructive'}>
                                      {Math.round(quiz.score * 100)}%
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">{quiz.pointsEarned || 0}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                          No quiz activity found for this user.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="achievements" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Earned Achievements</CardTitle>
                      <CardDescription>
                        Badges and milestones this user has reached
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userAchievements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userAchievements.map((achievement) => (
                            <Card key={achievement.id} className="flex p-4 items-center">
                              <div className={`rounded-full p-3 mr-4 ${achievement.bgClass || 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                <Award className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-medium">{achievement.title || 'Unnamed Achievement'}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {achievement.description || 'No description'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Earned: {achievement.earnedAt}
                                </p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                          No achievements earned yet.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="progress" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Learning Progress</CardTitle>
                      <CardDescription>
                        Reading level progression and performance metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Reading Level History</h4>
                          <div className="h-20 flex items-center">
                            {/* This is a simplified visualization - in a real app, you would plot actual level progress */}
                            <div className="w-full flex items-center">
                              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary-500 rounded-full"
                                  style={{ width: '60%' }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Started: 4A</span>
                            <span>Current: {userData.readingLevel || 'N/A'}</span>
                            <span>Goal: 10A</span>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <h4 className="text-sm font-medium mb-2">Performance Metrics</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="border p-3 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Avg. Quiz Time</p>
                              <p className="text-lg font-medium">5m 24s</p>
                            </div>
                            <div className="border p-3 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Avg. Score</p>
                              <p className="text-lg font-medium">{userData.correctPercentage || 0}%</p>
                            </div>
                            <div className="border p-3 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Quizzes/Week</p>
                              <p className="text-lg font-medium">3.2</p>
                            </div>
                            <div className="border p-3 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Points/Quiz</p>
                              <p className="text-lg font-medium">78</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
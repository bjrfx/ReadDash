import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAdmin, useAuth } from "@/lib/hooks";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, Save, Trash2, AlertTriangle
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function UserEdit() {
  const params = useParams();
  const userId = params.id;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // User form state
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    readingLevel: '',
    levelCategory: '',
    knowledgePoints: 0,
    quizzesCompleted: 0,
    correctPercentage: 0,
    role: 'user'
  });
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAdmin || !userId) return;
      
      try {
        setLoading(true);
        
        // Fetch user data from Firestore
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          setFormData({
            displayName: userData.displayName || '',
            email: userData.email || '',
            readingLevel: userData.readingLevel || '',
            levelCategory: userData.levelCategory || '',
            knowledgePoints: userData.knowledgePoints || 0,
            quizzesCompleted: userData.quizzesCompleted || 0,
            correctPercentage: userData.correctPercentage || 0,
            role: userData.role || 'user'
          });
        } else {
          toast({
            title: "User not found",
            description: "The user you're trying to edit doesn't exist.",
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
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle number input changes with validation
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, [name]: numValue }));
    }
  };
  
  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle switch toggle for admin role
  const handleRoleToggle = (checked) => {
    setFormData(prev => ({ ...prev, role: checked ? 'admin' : 'user' }));
  };
  
  // Save user data
  const handleSave = async () => {
    if (!isAdmin || !userId) return;
    
    try {
      setSaving(true);
      
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        ...formData,
        lastUpdated: serverTimestamp()
      });
      
      toast({
        title: "User updated",
        description: "User information has been successfully updated.",
      });
      
      setSaving(false);
      
      // Redirect back to user view
      setLocation(`/admin/users/${userId}`);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update user information",
        variant: "destructive",
      });
      setSaving(false);
    }
  };
  
  // Delete user
  const handleDelete = async () => {
    if (!isAdmin || !userId) return;
    
    try {
      setDeleting(true);
      
      const userDocRef = doc(db, "users", userId);
      await deleteDoc(userDocRef);
      
      toast({
        title: "User deleted",
        description: "User has been permanently deleted.",
      });
      
      setDeleting(false);
      
      // Redirect back to admin dashboard
      setLocation('/admin');
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
      setDeleting(false);
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
        <span className="ml-2">Loading user data...</span>
      </div>
    );
  }
  
  return (
    <>
      <MobileHeader user={user} userLevel={user?.displayName ? user.displayName.charAt(0) : "U"} />
      <DesktopSidebar user={user} userLevel="8B" dailyGoalProgress={2} />
      <MobileNavBar currentRoute="/admin" />
      
      <main className="sm:ml-64 pt-16 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation(`/admin/users/${userId}`)}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">Edit User</h1>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the user account
                      and all associated data, including quiz results and achievements.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete} 
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete User'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Edit the user's profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="Enter user's name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter user's email"
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="isAdmin">Admin Privileges</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isAdmin"
                      checked={formData.role === 'admin'}
                      onCheckedChange={handleRoleToggle}
                    />
                    <Label htmlFor="isAdmin" className="text-sm font-normal">
                      {formData.role === 'admin' ? 'Admin' : 'User'}
                    </Label>
                  </div>
                </div>
                
                {formData.role === 'admin' && (
                  <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-md text-sm flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p>
                      Warning: Admin users have full access to the admin dashboard and can manage all content, users, and settings.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Reading Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Reading Progress</CardTitle>
                <CardDescription>
                  Modify the user's reading level and progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="readingLevel">Reading Level</Label>
                    <Select
                      value={formData.readingLevel}
                      onValueChange={(value) => handleSelectChange('readingLevel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4A">4A</SelectItem>
                        <SelectItem value="4B">4B</SelectItem>
                        <SelectItem value="5A">5A</SelectItem>
                        <SelectItem value="5B">5B</SelectItem>
                        <SelectItem value="6A">6A</SelectItem>
                        <SelectItem value="6B">6B</SelectItem>
                        <SelectItem value="7A">7A</SelectItem>
                        <SelectItem value="7B">7B</SelectItem>
                        <SelectItem value="8A">8A</SelectItem>
                        <SelectItem value="8B">8B</SelectItem>
                        <SelectItem value="9A">9A</SelectItem>
                        <SelectItem value="9B">9B</SelectItem>
                        <SelectItem value="10A">10A</SelectItem>
                        <SelectItem value="10B">10B</SelectItem>
                        <SelectItem value="11A">11A</SelectItem>
                        <SelectItem value="11B">11B</SelectItem>
                        <SelectItem value="12A">12A</SelectItem>
                        <SelectItem value="12B">12B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="levelCategory">Level Category</Label>
                    <Select
                      value={formData.levelCategory}
                      onValueChange={(value) => handleSelectChange('levelCategory', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="knowledgePoints">Knowledge Points</Label>
                  <Input
                    id="knowledgePoints"
                    name="knowledgePoints"
                    type="number"
                    min="0"
                    value={formData.knowledgePoints}
                    onChange={handleNumberChange}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quizzesCompleted">Quizzes Completed</Label>
                    <Input
                      id="quizzesCompleted"
                      name="quizzesCompleted"
                      type="number"
                      min="0"
                      value={formData.quizzesCompleted}
                      onChange={handleNumberChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="correctPercentage">Correct Percentage</Label>
                    <Input
                      id="correctPercentage"
                      name="correctPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.correctPercentage}
                      onChange={handleNumberChange}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm p-4 italic">
                Note: Changing these values may affect the user's personalized learning experience 
                and quiz recommendations.
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
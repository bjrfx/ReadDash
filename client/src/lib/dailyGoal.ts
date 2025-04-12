import { useQuery, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, updateDoc, setDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./hooks";

// Interface for user preferences
interface UserPreferences {
  dailyGoal: number;
  dailyGoalSet: boolean;
  hideDailyGoalDialog: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for daily goal progress
interface DailyGoalProgress {
  currentProgress: number;
  targetGoal: number;
  date: string; // ISO string for the current day
}

/**
 * Hook to fetch and manage user daily goal data
 */
export function useDailyGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  // Query to get the user's daily goal settings
  const { data: goalSettings, isLoading: goalSettingsLoading } = useQuery({
    queryKey: ['userDailyGoal', user?.uid],
    enabled: !!user?.uid,
    queryFn: async (): Promise<{ dailyGoal: number; dailyGoalSet: boolean; hideDailyGoalDialog: boolean }> => {
      try {
        // First check userPreferences collection
        const userPrefsRef = doc(db, "userPreferences", user!.uid);
        const userPrefsDoc = await getDoc(userPrefsRef);
        
        if (userPrefsDoc.exists()) {
          const data = userPrefsDoc.data();
          return {
            dailyGoal: data?.dailyGoal || 3,
            dailyGoalSet: data?.dailyGoalSet || false,
            hideDailyGoalDialog: data?.hideDailyGoalDialog || false
          };
        }
        
        // If not in preferences, check user document
        const userDocRef = doc(db, "users", user!.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data()?.dailyGoal) {
          return {
            dailyGoal: userDoc.data()?.dailyGoal || 3,
            dailyGoalSet: true,
            hideDailyGoalDialog: false
          };
        }
        
        // Default values if not found
        return {
          dailyGoal: 3,
          dailyGoalSet: false,
          hideDailyGoalDialog: false
        };
      } catch (error) {
        console.error("Error fetching user daily goal settings:", error);
        // Return default values in case of error
        return {
          dailyGoal: 3,
          dailyGoalSet: false,
          hideDailyGoalDialog: false
        };
      }
    }
  });

  // Query to get the user's progress toward their daily goal
  const { data: goalProgress, isLoading: goalProgressLoading } = useQuery({
    queryKey: ['dailyGoalProgress', user?.uid, today],
    enabled: !!user?.uid,
    queryFn: async (): Promise<DailyGoalProgress> => {
      try {
        // Get the target goal
        const targetGoal = goalSettings?.dailyGoal || 3;
        
        // Check today's quizzes/activities to determine progress
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of day
        
        const quizzesRef = collection(db, "quizResults");
        const todayQuizzesQuery = query(
          quizzesRef,
          where("userId", "==", user!.uid),
          where("completedAt", ">=", today),
          orderBy("completedAt", "desc")
        );
        
        const snapshot = await getDocs(todayQuizzesQuery);
        const completedToday = snapshot.docs.length;
        
        return {
          currentProgress: completedToday,
          targetGoal,
          date: today.toISOString().split('T')[0]
        };
      } catch (error) {
        console.error("Error fetching daily goal progress:", error);
        // Return default values in case of error
        return {
          currentProgress: 0,
          targetGoal: goalSettings?.dailyGoal || 3,
          date: today
        };
      }
    },
    // Depend on goalSettings to ensure we have the correct target
    dependencies: [goalSettings]
  });

  // Function to update the user's daily goal
  const updateDailyGoal = async (newGoal: number, hideDialog: boolean = false): Promise<boolean> => {
    if (!user?.uid) return false;
    
    try {
      const userPrefsRef = doc(db, "userPreferences", user.uid);
      const userRef = doc(db, "users", user.uid);
      
      // Check if prefs document exists
      const prefsDoc = await getDoc(userPrefsRef);
      
      if (prefsDoc.exists()) {
        // Update existing preferences
        await updateDoc(userPrefsRef, {
          dailyGoal: newGoal,
          dailyGoalSet: true,
          hideDailyGoalDialog: hideDialog,
          updatedAt: new Date()
        });
      } else {
        // Create new preferences document
        await setDoc(userPrefsRef, {
          dailyGoal: newGoal,
          dailyGoalSet: true,
          hideDailyGoalDialog: hideDialog,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Also update user document
      await updateDoc(userRef, {
        dailyGoal: newGoal
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['userDailyGoal', user.uid] });
      queryClient.invalidateQueries({ queryKey: ['dailyGoalProgress', user.uid] });
      
      return true;
    } catch (error) {
      console.error("Error updating daily goal:", error);
      return false;
    }
  };

  // Function to update the "do not show again" preference
  const updateDailyGoalDialogPreference = async (hideDialog: boolean): Promise<boolean> => {
    if (!user?.uid) return false;
    
    try {
      const userPrefsRef = doc(db, "userPreferences", user.uid);
      
      // Check if prefs document exists
      const prefsDoc = await getDoc(userPrefsRef);
      
      if (prefsDoc.exists()) {
        // Update existing preferences
        await updateDoc(userPrefsRef, {
          hideDailyGoalDialog: hideDialog,
          updatedAt: new Date()
        });
      } else {
        // Create new preferences document with default values
        await setDoc(userPrefsRef, {
          dailyGoal: 3,
          dailyGoalSet: false,
          hideDailyGoalDialog: hideDialog,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['userDailyGoal', user.uid] });
      
      return true;
    } catch (error) {
      console.error("Error updating dialog preference:", error);
      return false;
    }
  };

  return {
    goalSettings,
    goalProgress,
    isLoading: goalSettingsLoading || goalProgressLoading,
    updateDailyGoal,
    updateDailyGoalDialogPreference
  };
}
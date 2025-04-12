import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks";
import { useDailyGoal } from "@/lib/dailyGoal";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { BookOpen } from "lucide-react";

export function DailyGoalDialog() {
  const { user } = useAuth();
  const { goalSettings, updateDailyGoal } = useDailyGoal();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [goalValue, setGoalValue] = useState(3);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Check if we should show the dialog
  useEffect(() => {
    if (!user?.uid || initialized) return;

    const checkDialogVisibility = async () => {
      try {
        // Check user preferences
        const userPrefsRef = doc(db, "userPreferences", user.uid);
        const prefsDoc = await getDoc(userPrefsRef);

        if (prefsDoc.exists()) {
          const prefs = prefsDoc.data();
          
          // If user explicitly set to hide the dialog, respect that
          if (prefs.hideDailyGoalDialog) {
            setOpen(false);
          }
          // If user has never set a daily goal, show the dialog
          else if (!prefs.dailyGoalSet) {
            setOpen(true);
          }
          // Set initial goal value if available
          if (prefs.dailyGoal) {
            setGoalValue(prefs.dailyGoal);
          }
        } else {
          // No preferences found, show the dialog for new users
          setOpen(true);
        }
        
        setInitialized(true);
      } catch (error) {
        console.error("Error checking dialog visibility:", error);
        // In case of error, default to showing the dialog
        setOpen(true);
        setInitialized(true);
      }
    };

    checkDialogVisibility();
  }, [user, initialized]);

  // Update goal value when goalSettings changes after initial load
  useEffect(() => {
    if (goalSettings && !loading) {
      setGoalValue(goalSettings.dailyGoal);
    }
  }, [goalSettings, loading]);

  const handleSave = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Update the daily goal
      await updateDailyGoal(goalValue);

      // If user checked "don't show again", update that preference
      if (dontShowAgain) {
        const userPrefsRef = doc(db, "userPreferences", user.uid);
        const prefsDoc = await getDoc(userPrefsRef);
        
        if (prefsDoc.exists()) {
          await updateDoc(userPrefsRef, {
            hideDailyGoalDialog: true,
            updatedAt: new Date()
          });
        } else {
          await setDoc(userPrefsRef, {
            dailyGoal: goalValue,
            dailyGoalSet: true,
            hideDailyGoalDialog: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      
      toast({
        title: "Daily goal saved",
        description: `Your daily goal has been set to ${goalValue} quizzes per day.`,
      });
      
      setOpen(false);
    } catch (error) {
      console.error("Error saving daily goal:", error);
      toast({
        title: "Error saving goal",
        description: "There was a problem setting your daily goal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Set Your Daily Reading Goal</DialogTitle>
          <DialogDescription className="pt-2">
            How many quizzes would you like to complete each day to improve your reading skills?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <BookOpen className="h-7 w-7 text-primary-500" />
            <span className="text-4xl font-bold text-primary-600">{goalValue}</span>
            <span className="text-lg text-gray-600 dark:text-gray-400">quizzes/day</span>
          </div>
          
          <div className="px-4">
            <Slider
              value={[goalValue]}
              min={1}
              max={10}
              step={1}
              onValueChange={(vals) => setGoalValue(vals[0])}
              className="mb-6"
            />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Easy</span>
              <span className="text-sm text-gray-500">Challenging</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-8">
            <Checkbox 
              id="dontShowAgain" 
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label 
              htmlFor="dontShowAgain" 
              className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
            >
              Don't show this dialog again
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Skip for now
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Set Goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
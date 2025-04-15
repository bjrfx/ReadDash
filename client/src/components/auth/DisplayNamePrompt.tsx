import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

interface DisplayNamePromptProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function DisplayNamePrompt({ isOpen, onClose, userId }: DisplayNamePromptProps) {
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Display name required",
        description: "Please enter a display name to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update display name in Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
        });
      }

      // Update display name in Firestore
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, {
        displayName: displayName.trim(),
        hasSetDisplayName: true,
      }, { merge: true });

      toast({
        title: "Display name set",
        description: "Your display name has been saved successfully.",
      });

      onClose();
    } catch (error) {
      console.error("Error setting display name:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your display name. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to ReadDash!</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Please set a display name that will be shown to other users.
          </p>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Saving..." : "Save & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
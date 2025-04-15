import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks";
import { useUserData } from "@/lib/userData";
import { DisplayNamePrompt } from "./DisplayNamePrompt";

/**
 * Component that detects users with empty displayName and shows the display name prompt
 * This component should be included in the App component to ensure it's available throughout the application
 */
export function FirstTimeLoginHandler() {
  const { user } = useAuth();
  const { data: userData, isLoading } = useUserData();
  const [showDisplayNamePrompt, setShowDisplayNamePrompt] = useState(false);

  useEffect(() => {
    // Check if user exists and has empty displayName
    if (
      user && 
      !isLoading && 
      userData && 
      // Check if displayName is empty in both Auth and Firestore
      (!user.displayName || !userData.displayName || userData.displayName === "")
    ) {
      setShowDisplayNamePrompt(true);
    }
  }, [user, userData, isLoading]);


  const handleClosePrompt = () => {
    setShowDisplayNamePrompt(false);
  };

  if (!user || !showDisplayNamePrompt) {
    return null;
  }

  return (
    <DisplayNamePrompt 
      isOpen={showDisplayNamePrompt} 
      onClose={handleClosePrompt} 
      userId={user.uid} 
    />
  );
}
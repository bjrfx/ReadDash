import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Hook to fetch and return user data from Firestore
 * @returns User data including reading level and other profile information
 */
export function useUserData() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userData', user?.uid],
    enabled: !!user?.uid,
    queryFn: async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          return userDoc.data();
        } else {
          console.log("No user document found");
          return null;
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
      }
    }
  });
}
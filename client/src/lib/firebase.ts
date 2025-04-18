import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD3oeUxVZzp9YtgqS8cBDqnNTekq_ZIqn4",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "readdash-7a9f3"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "readdash-7a9f3",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "readdash-7a9f3"}.appspot.com`,
  messagingSenderId: "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:996454744807:web:cb84d64d712d251dbc9842",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set persistence to LOCAL (survives browser restarts)
// This helps with the redirect flow on mobile devices
setPersistence(auth, browserLocalPersistence)
  .catch(error => {
    console.error("Error setting auth persistence:", error);
  });

export const googleProvider = new GoogleAuthProvider();

// Handle redirect result
export const handleRedirectResult = async () => {
  try {
    console.log("Checking for redirect result...");
    
    // Special handling for mobile browsers that might be failing to process the redirect properly
    const isReturningFromRedirect = sessionStorage.getItem('googleAuthAttempt') === 'true';
    // Check if user is already authenticated even if redirect result is missing
    if (isReturningFromRedirect && auth.currentUser) {
      console.log("User already authenticated, returning current user");
      const user = auth.currentUser;
      await createOrUpdateUser(user);
      sessionStorage.removeItem('googleAuthAttempt');
      return user;
    }
    
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("Redirect result found, user authenticated successfully");
      // After successful login, create or update user in our database
      const user = result.user;
      await createOrUpdateUser(user);
      sessionStorage.removeItem('googleAuthAttempt');
      return user;
    }
    
    console.log("No redirect result found");
    return null;
  } catch (error) {
    const errorObj = error as { code?: string, message?: string };
    if (errorObj.code === "auth/unauthorized-domain") {
      console.error("Error: This domain is not authorized in Firebase. Add your domain to the authorized domains in Firebase Console.");
    } else {
      console.error("Error handling auth redirect:", errorObj.code, errorObj.message);
    }
    throw error;
  }
};

// Sign in with Google (popup version)
export const signInWithGooglePopup = async () => {
  try {
    // Configure provider for better user experience
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, googleProvider);
    // After successful login, create or update user in our database
    const user = result.user;
    await createOrUpdateUser(user);
    return user;
  } catch (error) {
    const errorObj = error as { code?: string, message?: string };
    if (errorObj.code === "auth/unauthorized-domain") {
      console.error("Error: This domain is not authorized in Firebase. Add your domain to the authorized domains in Firebase Console.");
    } else {
      console.error("Error signing in with Google popup:", errorObj.code, errorObj.message);
    }
    throw error;
  }
};

// Check if third-party cookies are allowed before attempting sign-in
const checkCookieConsent = (): boolean => {
  const cookieConsent = localStorage.getItem('cookieConsent');
  const thirdPartyCookiesAllowed = localStorage.getItem('thirdPartyCookiesAllowed');
  
  // If user has explicitly accepted cookies, return true
  if (cookieConsent === 'accepted' || thirdPartyCookiesAllowed === 'true') {
    return true;
  }
  
  // If we're on a platform that typically has issues with cookies
  if (/iPhone|iPad|iPod|Safari/i.test(navigator.userAgent)) {
    console.warn('Third-party cookies may be blocked on this device. Authentication might fail.');
  }
  
  // Default to allowing the attempt even without explicit consent
  return true;
};

// Sign in with Google (redirect version)
export const signInWithGoogle = async () => {
  try {
    // First check if cookies are allowed
    if (!checkCookieConsent()) {
      throw new Error('Cookie consent is required for Google Sign-in. Please accept cookies first.');
    }
    
    // Configure provider for better user experience
    googleProvider.setCustomParameters({
      // Force account selection even if user was previously logged in
      prompt: 'select_account',
      // Cookie-less authentication mode for better compatibility with mobile privacy settings
      ux_mode: 'redirect'
    });
    
    // For debugging
    console.log("Current URL before redirect:", window.location.href);
    
    // Clear any existing error state and set auth attempt flag
    sessionStorage.setItem('googleAuthAttempt', 'true');
    
    // Set a custom parameter to handle iOS/Safari cookie restrictions
    // This helps with browsers that block third-party cookies
    if (/iPhone|iPad|iPod|Safari/i.test(navigator.userAgent)) {
      console.log("iOS/Safari device detected - applying special auth parameters");
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        // Add additional parameters for iOS/Safari
        auth_type: 'rerequest',
        include_granted_scopes: 'true'
      });
    }
    
    // Redirect to Google sign-in page
    console.log("Redirecting to Google sign-in page...");
    await signInWithRedirect(auth, googleProvider);
    // Control will return after redirect and will be handled by handleRedirectResult
  } catch (error) {
    const errorObj = error as { code?: string, message?: string };
    console.error("Error in signInWithGoogle:", errorObj.code, errorObj.message);
    
    if (errorObj.code === "auth/unauthorized-domain") {
      console.error("Error: This domain is not authorized in Firebase. Add your domain to the authorized domains in Firebase Console.");
    } else {
      console.error("Error redirecting to Google sign-in:", errorObj);
    }
    throw error;
  }
};

// Create or update user in our database
const createOrUpdateUser = async (user: FirebaseUser) => {
  try {
    const userData = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
    };

    console.log("Creating or updating user in Firestore:", user.uid);
    
    // Check if user already exists in Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userDocRef);
    
    if (userSnapshot.exists()) {
      // User exists, update their information
      await setDoc(userDocRef, {
        ...userData,
        lastLogin: serverTimestamp(),
      }, { merge: true });
      console.log("User document updated in Firestore");
    } else {
      // User doesn't exist, create a new user document
      await setDoc(userDocRef, {
        ...userData,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        readingLevel: "5A", // Default starting level
        knowledgePoints: 0,
        role: "user",
        quizzesCompleted: 0,
        correctPercentage: 0,
        levelCategory: "Basic"
      });
      console.log("New user document created in Firestore");
    }
    
    // Also send request to our backend API for any server-side processing
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });
    } catch (apiError) {
      console.error("Error sending user data to API (continuing anyway):", apiError);
      // Continue even if API request fails - user data is already in Firestore
    }
  } catch (error) {
    console.error("Error creating/updating user in Firestore:", error);
    throw error; // Re-throw to allow calling functions to handle the error
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Add this utility function to help debug redirect issues

// This function must be called BEFORE initiating the redirect
export const prepareForRedirect = () => {
  try {
    // Save timestamp to track the redirect process
    const timestamp = new Date().toISOString();
    sessionStorage.setItem('redirectStarted', timestamp);
    
    // Save the current URL to ensure we return to the same page
    sessionStorage.setItem('redirectOriginUrl', window.location.href);
    
    // Check if firebase is properly initialized
    const isFirebaseInitialized = !!auth && !!googleProvider;
    sessionStorage.setItem('firebaseInitialized', String(isFirebaseInitialized));
    
    // Log the auth domain for debugging
    sessionStorage.setItem('authDomain', firebaseConfig.authDomain);
    
    console.log("Redirect preparation complete:", {
      timestamp,
      originUrl: window.location.href,
      firebaseInitialized: isFirebaseInitialized,
      authDomain: firebaseConfig.authDomain
    });
    
    return true;
  } catch (error) {
    console.error("Error preparing for redirect:", error);
    return false;
  }
};

// This function should be called when returning from redirect
export const checkRedirectStatus = () => {
  try {
    const redirectStarted = sessionStorage.getItem('redirectStarted');
    const originUrl = sessionStorage.getItem('redirectOriginUrl');
    const firebaseInitialized = sessionStorage.getItem('firebaseInitialized');
    const authDomain = sessionStorage.getItem('authDomain');
    
    console.log("Redirect status check:", {
      redirectStarted,
      originUrl,
      currentUrl: window.location.href,
      firebaseInitialized,
      authDomain,
      returnTime: new Date().toISOString()
    });
    
    // Clear storage but keep redirect attempt flag
    const redirectAttempt = sessionStorage.getItem('googleAuthAttempt');
    sessionStorage.removeItem('redirectStarted');
    sessionStorage.removeItem('redirectOriginUrl');
    sessionStorage.removeItem('firebaseInitialized');
    sessionStorage.removeItem('authDomain');
    
    if (redirectAttempt) {
      sessionStorage.setItem('googleAuthAttempt', redirectAttempt);
    }
    
    return {
      redirectStarted,
      originUrl,
      currentUrl: window.location.href,
      firebaseInitialized: firebaseInitialized === 'true',
      authDomain
    };
  } catch (error) {
    console.error("Error checking redirect status:", error);
    return null;
  }
};

// Email/password auth methods
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Create user in our database
    await createOrUpdateUser(user);
    return user;
  } catch (error) {
    const errorObj = error as { code?: string, message?: string };
    console.error("Error signing up with email:", errorObj.code, errorObj.message);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Update user info in our database
    await createOrUpdateUser(user);
    return user;
  } catch (error) {
    const errorObj = error as { code?: string, message?: string };
    console.error("Error signing in with email:", errorObj.code, errorObj.message);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    const errorObj = error as { code?: string, message?: string };
    console.error("Error sending password reset email:", errorObj.code, errorObj.message);
    throw error;
  }
};

// Reset a specific quiz for a user
export const resetQuiz = async (userId: string, quizId: string) => {
  try {
    console.log(`Resetting quiz ${quizId} for user ${userId}`);
    
    // Query for all quiz results for this specific quiz and user
    const quizResultsRef = collection(db, "quizResults");
    const q = query(
      quizResultsRef,
      where("userId", "==", userId),
      where("quizId", "==", quizId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Delete all quiz results for this quiz
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Get user document to update knowledge points
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      let pointsToDeduct = 0;
      
      // Calculate points to deduct (use the maximum score from all attempts)
      let maxPoints = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const points = data.pointsEarned || 0;
        if (points > maxPoints) {
          maxPoints = points;
        }
      });
      
      pointsToDeduct = maxPoints;
      
      // Update user's knowledge points
      if (pointsToDeduct > 0) {
        const currentPoints = userData.knowledgePoints || 0;
        const newPoints = Math.max(0, currentPoints - pointsToDeduct);
        batch.update(userDocRef, { knowledgePoints: newPoints });
      }
    }
    
    // Commit the batch
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error resetting quiz:", error);
    throw error;
  }
};

// Reset all quizzes for a user
export const resetAllQuizzes = async (userId: string) => {
  try {
    console.log(`Resetting all quizzes for user ${userId}`);
    
    // Query for all quiz results for this user
    const quizResultsRef = collection(db, "quizResults");
    const q = query(quizResultsRef, where("userId", "==", userId));
    
    const querySnapshot = await getDocs(q);
    
    // Delete all quiz results
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Reset user's knowledge points to 0
    const userDocRef = doc(db, "users", userId);
    batch.update(userDocRef, { knowledgePoints: 0 });
    
    // Commit the batch
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error resetting all quizzes:", error);
    throw error;
  }
};

// Export db and auth already done at initialization

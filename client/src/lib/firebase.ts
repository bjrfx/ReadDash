import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const googleProvider = new GoogleAuthProvider();

// Handle redirect result
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // After successful login, create or update user in our database
      const user = result.user;
      await createOrUpdateUser(user);
      return user;
    }
    return null;
  } catch (error) {
    const errorObj = error as { code?: string, message?: string };
    if (errorObj.code === "auth/unauthorized-domain") {
      console.error("Error: This domain is not authorized in Firebase. Add your Replit URL to the authorized domains in Firebase Console.");
    } else {
      console.error("Error handling auth redirect", error);
    }
    throw error;
  }
};

// Sign in with Google (popup version)
export const signInWithGooglePopup = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // After successful login, create or update user in our database
    const user = result.user;
    await createOrUpdateUser(user);
    return user;
  } catch (error) {
    const errorObj = error as { code?: string, message?: string };
    if (errorObj.code === "auth/unauthorized-domain") {
      console.error("Error: This domain is not authorized in Firebase. Add your Replit URL to the authorized domains in Firebase Console.");
    } else {
      console.error("Error signing in with Google popup", error);
    }
    throw error;
  }
};

// Sign in with Google (redirect version)
export const signInWithGoogle = async () => {
  try {
    // Add custom parameters to provider if needed
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Redirect to Google sign-in page
    await signInWithRedirect(auth, googleProvider);
    // Control will return after redirect and will be handled by handleRedirectResult
  } catch (error) {
    const errorObj = error as { code?: string, message?: string };
    if (errorObj.code === "auth/unauthorized-domain") {
      console.error("Error: This domain is not authorized in Firebase. Add your Replit URL to the authorized domains in Firebase Console.");
    } else {
      console.error("Error redirecting to Google sign-in", error);
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

    // Send request to our backend API to create or update user
    await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include',
    });
  } catch (error) {
    console.error("Error creating/updating user in database", error);
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

// Export db and auth already done at initialization

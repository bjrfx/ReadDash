import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { useLocation } from 'wouter';
import { doc, getDoc } from 'firebase/firestore';

// Custom hook to manage authentication state
export const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, loading };
};

// Custom hook to check if user is admin
export const useAdmin = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      try {
        // Check if user is admin by getting their role from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading, setLocation]);

  return { isAdmin, loading: loading || adminLoading };
};

// Custom hook for theme (dark/light mode)
export const useTheme = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Check for stored theme preference or default to light mode
    if (typeof window !== 'undefined') {
      // If theme is explicitly set in localStorage, use that
      if (localStorage.theme === 'dark') {
        return 'dark';
      } else if (localStorage.theme === 'light') {
        return 'light';
      }
      // Otherwise default to light mode instead of system preference
      return 'light';
    }
    return 'light'; // Default to light if window not available
  });

  // Update theme class on document root
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    localStorage.theme = theme;
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
};

// Custom hook for mobile detection
export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Check initially
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

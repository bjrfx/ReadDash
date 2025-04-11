import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Quiz from "@/pages/Quiz";
import QuizResults from "@/pages/QuizResults";
import Achievements from "@/pages/Achievements";
import Admin from "@/pages/Admin";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import Quizzes from "@/pages/Quizzes";
import AuthTest from "@/pages/AuthTest";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { useEffect } from "react";
import { handleRedirectResult } from "./lib/firebase";
import CookieConsent from "@/components/ui/cookie-consent/CookieConsent";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/auth-test" component={AuthTest} />
      
      {/* Protected routes */}
      <Route path="/">
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      </Route>
      <Route path="/quizzes">
        <RequireAuth>
          <Quizzes />
        </RequireAuth>
      </Route>
      <Route path="/quiz/:id">
        {params => (
          <RequireAuth>
            <Quiz />
          </RequireAuth>
        )}
      </Route>
      <Route path="/quiz-results/:id">
        {params => (
          <RequireAuth>
            <QuizResults />
          </RequireAuth>
        )}
      </Route>
      <Route path="/achievements">
        <RequireAuth>
          <Achievements />
        </RequireAuth>
      </Route>
      <Route path="/history">
        <RequireAuth>
          <History />
        </RequireAuth>
      </Route>
      <Route path="/settings">
        <RequireAuth>
          <Settings />
        </RequireAuth>
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin">
        <RequireAdmin>
          <Admin />
        </RequireAdmin>
      </Route>
      <Route path="/admin/users/:id">
        {params => (
          <RequireAdmin>
            <Admin />
          </RequireAdmin>
        )}
      </Route>
      <Route path="/admin/users/:id/edit">
        {params => (
          <RequireAdmin>
            <Admin />
          </RequireAdmin>
        )}
      </Route>
      <Route path="/admin/passages">
        <RequireAdmin>
          <Admin />
        </RequireAdmin>
      </Route>
      <Route path="/admin/passages/:id/edit">
        {params => (
          <RequireAdmin>
            <Admin />
          </RequireAdmin>
        )}
      </Route>
      <Route path="/admin/quizzes/new">
        <RequireAdmin>
          <Admin />
        </RequireAdmin>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Handle Firebase redirect result globally
  useEffect(() => {
    // Handle any Firebase auth redirects
    const checkRedirectResult = async () => {
      try {
        await handleRedirectResult();
      } catch (error) {
        console.error("Error handling redirect result:", error);
      }
    };
    
    checkRedirectResult();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <CookieConsent />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

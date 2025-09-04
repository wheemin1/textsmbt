
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Game from "./pages/Game";
import Settings from "./pages/Settings";
import Leaderboard from "./pages/Leaderboard";
import GameHistory from "./pages/GameHistory";
import AuthNavigation from "@/components/AuthNavigation";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/game/:gameId" component={Game} />
          <Route path="/settings" component={Settings} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/game-history" component={GameHistory} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          {/* Navigation Header */}
          <header className="bg-card border-b border-border">
            <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <i className="fas fa-sword text-primary-foreground text-lg"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">한국어 텍스트 배틀</h1>
                  <p className="text-xs text-muted-foreground">의미 유사도 경쟁 게임</p>
                </div>
              </div>
              <AuthNavigation />
            </div>
          </header>

          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

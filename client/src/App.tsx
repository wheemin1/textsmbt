import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Game from "./pages/Game";
import { useEffect, useState } from "react";

function Router() {
  const [hasNickname, setHasNickname] = useState(false);
  
  useEffect(() => {
    const nickname = localStorage.getItem('userNickname');
    setHasNickname(!!nickname);
  }, []);

  // Show onboarding if no nickname is set
  if (!hasNickname) {
    return <Onboarding onComplete={() => setHasNickname(true)} />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game/:gameId" component={Game} />
      <Route path="/game" component={Game} />
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
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                  <i className="fas fa-user"></i>
                  <span>{localStorage.getItem('userNickname') || '플레이어'}</span>
                </div>
                <button className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                  <i className="fas fa-cog text-secondary-foreground"></i>
                </button>
              </div>
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

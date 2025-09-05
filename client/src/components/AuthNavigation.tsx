import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AuthNavigation() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <i className="fas fa-user text-xs text-white"></i>
        </div>
        <span>{user?.nickname || '플레이어'}</span>
        <div className="flex items-center space-x-4 text-xs">
          <span>승: {user?.gamesWon || 0}</span>
          <span>플레이: {user?.gamesPlayed || 0}</span>
          <span>점수: {user?.bestScore || 0}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Link href="/leaderboard">
          <Button variant="ghost" size="sm">
            <i className="fas fa-trophy mr-1"></i>
            리더보드
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <i className="fas fa-cog mr-1"></i>
            설정
          </Button>
        </Link>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleLogout}
        >
          <i className="fas fa-sign-out-alt mr-1"></i>
          로그아웃
        </Button>
      </div>
    </div>
  );
}
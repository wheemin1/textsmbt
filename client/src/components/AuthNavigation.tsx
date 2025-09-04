import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AuthNavigation() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div className="flex items-center space-x-4">
      <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
        <img 
          src={user?.profileImageUrl || '/api/placeholder/32/32'} 
          alt="프로필" 
          className="w-6 h-6 rounded-full object-cover"
        />
        <span>{user?.nickname || user?.firstName || '플레이어'}</span>
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
          onClick={() => window.location.href = "/api/logout"}
        >
          <i className="fas fa-sign-out-alt mr-1"></i>
          로그아웃
        </Button>
      </div>
    </div>on>
      </div>
    </div>
  );
}
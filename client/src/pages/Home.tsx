import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import MatchBanner from "@/components/MatchBanner";
import { useAuth } from "@/hooks/useAuth";

interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  bestScore: number;
  totalScore: number;
  currentStreak: number;
  bestStreak: number;
  averageScore: number;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingSeconds, setMatchmakingSeconds] = useState(0);
  const [canStartBot, setCanStartBot] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const { toast } = useToast();
  const { user, logout } = useAuth(); // Added for user authentication status

  const handleQuickMatch = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      setIsMatchmaking(true);
      setMatchmakingSeconds(0);
      setCanStartBot(false);

      // Start matchmaking timer
      const timer = setInterval(() => {
        setMatchmakingSeconds(prev => {
          const newSeconds = prev + 1;

          // Show bot option after 6 seconds
          if (newSeconds >= 6) {
            setCanStartBot(true);
          }

          // Auto-start bot match after 12 seconds
          if (newSeconds >= 12) {
            clearInterval(timer);
            handleBotMatch();
          }

          return newSeconds;
        });
      }, 1000);

      const result = await api.joinQueue(userId);

      if (result.gameId) {
        // Found immediate match
        clearInterval(timer);
        toast({
          title: "매칭 성공!",
          description: result.isBot ? "봇과의 대전이 시작됩니다" : "상대방을 찾았습니다!",
        });
        setLocation(`/game/${result.gameId}`);
      }
    } catch (error: any) {
      console.error('Matchmaking error:', error);
      setIsMatchmaking(false);
      toast({
        variant: "destructive",
        title: "매칭 실패",
        description: "매칭 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    }
  };

  const handleBotMatch = async () => {
    let userId = localStorage.getItem('userId');

    // Validate user exists - first check current user endpoint
    try {
      const currentUser = await api.getCurrentUser();
      if (currentUser?.id) {
        userId = currentUser.id;
        localStorage.setItem('userId', currentUser.id);
      } else {
        // No session user, try to use localStorage userId if available
        if (!userId) {
          toast({
            variant: "destructive",
            title: "로그인 필요",
            description: "먼저 로그인해주세요.",
          });
          setLocation('/');
          return;
        }
        // Continue with localStorage userId
      }
    } catch (error: any) {
      console.error('Current user check failed:', error);
      // If API fails, try to use localStorage userId if available
      if (!userId) {
        localStorage.removeItem('userId');
        toast({
          variant: "destructive",
          title: "로그인 필요",
          description: "먼저 로그인해주세요.",
        });
        setLocation('/');
        return;
      }
    }

    if (!userId) return;

    try {
      setIsMatchmaking(false);

      // Join queue which will automatically create bot game after timeout
      const result = await api.joinQueue(userId);

      if (result.gameId) {
        toast({
          title: "봇 매칭 성공",
          description: "AI 봇과의 대전이 시작됩니다!",
        });
        setLocation(`/game/${result.gameId}`);
      } else {
        // If no immediate game, the server will create a bot game via timeout
        toast({
          title: "봇 대전 준비 중",
          description: "잠시 후 봇과의 대전이 시작됩니다.",
        });
      }
    } catch (error: any) {
      console.error('Bot match error:', error);
      setIsMatchmaking(false);

      if (error.message?.includes('USER_NOT_FOUND')) {
        localStorage.removeItem('userId');
        toast({
          variant: "destructive",
          title: "사용자 정보 오류",
          description: "다시 로그인해주세요.",
        });
        setLocation('/');
      } else {
        toast({
          variant: "destructive",
          title: "봇 매칭 실패",
          description: "봇과의 대전 생성에 실패했습니다.",
        });
      }
    }
  };

  const handlePracticeGame = () => {
    handleBotMatch();
  };

  // Load user statistics
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) {
        setIsLoadingStats(false);
        return;
      }

      try {
        setIsLoadingStats(true);
        const stats = await api.getUserStats(user.id);
        setUserStats(stats);
      } catch (error: any) {
        console.error('Failed to load user stats:', error);
        // Set default stats if API fails or user not found
        setUserStats({
          gamesPlayed: 0,
          gamesWon: 0,
          gamesLost: 0,
          winRate: 0,
          bestScore: 0,
          totalScore: 0,
          currentStreak: 0,
          bestStreak: 0,
          averageScore: 0
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadUserStats();
  }, [user?.id]); // Depend on user?.id to refetch stats when user changes

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "로그아웃 완료",
        description: "성공적으로 로그아웃되었습니다.",
      });
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
      });
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Main Content */}
      <div className="flex-1 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            안녕하세요, {user?.nickname || "플레이어"}님! 👋
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            단어의 의미적 유사성을 겨루는 흥미진진한 게임에 참여하세요
          </p>
        </div>

        {/* User Statistics */}
        {user && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">승률</CardTitle>
                <i className="fas fa-trophy h-4 w-4 text-muted-foreground"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? "..." : `${userStats?.winRate || 0}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? "로딩 중..." : `${userStats?.gamesPlayed || 0}게임 중 ${userStats?.gamesWon || 0}승`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 게임</CardTitle>
                <i className="fas fa-gamepad h-4 w-4 text-muted-foreground"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? "..." : userStats?.gamesPlayed || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? "로딩 중..." : `${userStats?.gamesWon || 0}승 ${userStats?.gamesLost || 0}패`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">최고 점수</CardTitle>
                <i className="fas fa-star h-4 w-4 text-muted-foreground"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? "..." : userStats?.bestScore || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? "로딩 중..." : `평균 ${userStats?.averageScore || 0}점`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">연승 기록</CardTitle>
                <i className="fas fa-fire h-4 w-4 text-muted-foreground"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? "..." : userStats?.bestStreak || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? "로딩 중..." : `현재 ${userStats?.currentStreak || 0}연승`}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Quick Match Card */}
      <Card className="bg-card shadow-lg game-glow mb-8">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <i className="fas fa-bolt text-2xl text-primary-foreground"></i>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-card-foreground">빠른 매칭</h2>
            <p className="text-muted-foreground">실시간으로 다른 플레이어와 대전하거나 봇과 연습해보세요</p>

            {/* Match Banner */}
            {isMatchmaking && (
              <MatchBanner
                isActive={isMatchmaking}
                secondsElapsed={matchmakingSeconds}
                canStartBot={canStartBot}
                onStartBot={handleBotMatch}
              />
            )}

            <Button
              size="lg"
              className="w-full h-14 rounded-full font-semibold"
              onClick={handleQuickMatch}
              disabled={isMatchmaking}
              data-testid="button-quick-match"
            >
              {isMatchmaking ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  매칭 중...
                </>
              ) : (
                <>
                  <i className="fas fa-play mr-2"></i>
                  매칭 시작
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Statistics (Old Display, kept for reference but new one above is primary) */}
      {/*
      {userStats && (
        <Card className="bg-card shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-chart-bar text-primary"></i>
              <span>나의 게임 통계</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">{userStats.gamesPlayed}</div>
                <div className="text-sm text-muted-foreground">총 게임</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-500">{userStats.winRate}%</div>
                <div className="text-sm text-muted-foreground">승률</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-accent">{userStats.bestScore}</div>
                <div className="text-sm text-muted-foreground">최고 점수</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-secondary">{userStats.currentStreak}</div>
                <div className="text-sm text-muted-foreground">연승</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">승리</span>
                  <span className="font-semibold text-green-500">{userStats.gamesWon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">패배</span>
                  <span className="font-semibold text-red-500">{userStats.gamesLost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">평균 점수</span>
                  <span className="font-semibold text-foreground">{userStats.averageScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">총 점수</span>
                  <span className="font-semibold text-foreground">{userStats.totalScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">최고 연승</span>
                  <span className="font-semibold text-accent">{userStats.bestStreak}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">현재 연승</span>
                  <span className="font-semibold text-secondary">{userStats.currentStreak}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoadingStats && (
        <Card className="bg-card shadow-lg mb-8">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <i className="fas fa-spinner animate-spin text-2xl text-muted-foreground"></i>
              <p className="text-muted-foreground">통계를 불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      )}
      */}

      {/* Additional Options */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                <i className="fas fa-robot text-secondary-foreground"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">봇과 연습전</h3>
                <p className="text-sm text-muted-foreground">AI 상대와 실력을 향상시켜보세요</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handlePracticeGame}
              data-testid="button-practice-game"
            >
              연습 시작
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <i className="fas fa-history text-muted-foreground"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">게임 기록</h3>
                <p className="text-sm text-muted-foreground">지난 대전 결과 확인</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/game-history'}
              data-testid="button-game-history"
            >
              기록 보기
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
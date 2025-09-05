import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
  const { user } = useAuth();

  // Load user stats from localStorage
  useEffect(() => {
    if (user) {
      const stats: UserStats = {
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        gamesLost: user.gamesPlayed - user.gamesWon,
        winRate: user.gamesPlayed > 0 ? (user.gamesWon / user.gamesPlayed) * 100 : 0,
        bestScore: user.bestScore,
        totalScore: user.totalScore,
        currentStreak: user.currentStreak,
        bestStreak: user.bestStreak || 0,
        averageScore: user.gamesPlayed > 0 ? user.totalScore / user.gamesPlayed : 0,
      };
      setUserStats(stats);
    }
  }, [user]);

  const handleQuickMatch = async () => {
    toast({
      title: "매칭 기능 준비 중",
      description: "현재 정적 배포 버전에서는 실시간 매칭이 지원되지 않습니다.",
      variant: "default",
    });
  };

  const handleBotGame = async (difficulty: string) => {
    toast({
      title: "봇 게임 준비 중", 
      description: "AI 봇과의 게임 기능을 준비 중입니다.",
      variant: "default",
    });
  };

  const cancelMatchmaking = () => {
    setIsMatchmaking(false);
    setMatchmakingSeconds(0);
    setCanStartBot(false);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          안녕하세요, {user?.nickname || '플레이어'}님!
        </h1>
        <p className="text-lg text-muted-foreground">
          단어 유사도 배틀에 오신 것을 환영합니다
        </p>
      </div>

      {/* Game Modes */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Match Card */}
        <Card className="bg-card shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-users text-2xl text-primary-foreground"></i>
            </div>
            <CardTitle className="text-2xl">빠른 매칭</CardTitle>
            <p className="text-muted-foreground">다른 플레이어와 실시간 대전</p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {!isMatchmaking ? (
              <Button
                size="lg"
                className="w-full h-14 rounded-full font-semibold"
                onClick={handleQuickMatch}
              >
                <i className="fas fa-play mr-2"></i>
                빠른 매칭 시작
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">매칭 중... {matchmakingSeconds}초</span>
                </div>
                <Button
                  variant="outline"
                  onClick={cancelMatchmaking}
                  className="w-full"
                >
                  매칭 취소
                </Button>
                {canStartBot && (
                  <div className="pt-4 border-t space-y-2">
                    <p className="text-sm text-muted-foreground mb-3">
                      매칭이 오래 걸리네요. AI 봇과 연습해보세요!
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBotGame("easy")}
                        className="text-green-600"
                      >
                        <i className="fas fa-robot mr-1"></i>
                        쉬움
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBotGame("medium")}
                        className="text-yellow-600"
                      >
                        <i className="fas fa-robot mr-1"></i>
                        보통
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBotGame("hard")}
                        className="text-red-600"
                      >
                        <i className="fas fa-robot mr-1"></i>
                        어려움
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Bot Card */}
        <Card className="bg-card shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-robot text-2xl text-secondary-foreground"></i>
            </div>
            <CardTitle className="text-2xl">AI 봇 연습</CardTitle>
            <p className="text-muted-foreground">다양한 난이도의 AI와 연습</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              size="lg"
              variant="outline"
              className="w-full h-12 rounded-full font-semibold text-green-600 border-green-200"
              onClick={() => handleBotGame("easy")}
            >
              <i className="fas fa-robot mr-2"></i>
              쉬운 봇과 연습
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full h-12 rounded-full font-semibold text-yellow-600 border-yellow-200"
              onClick={() => handleBotGame("medium")}
            >
              <i className="fas fa-robot mr-2"></i>
              보통 봇과 연습
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full h-12 rounded-full font-semibold text-red-600 border-red-200"
              onClick={() => handleBotGame("hard")}
            >
              <i className="fas fa-robot mr-2"></i>
              어려운 봇과 연습
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* User Stats */}
      {userStats && (
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              <i className="fas fa-chart-bar mr-2"></i>
              게임 통계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">{userStats.gamesPlayed}</div>
                <div className="text-sm text-muted-foreground">총 게임</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-600">{userStats.gamesWon}</div>
                <div className="text-sm text-muted-foreground">승리</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-accent">{userStats.winRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">승률</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-secondary">{userStats.bestScore}</div>
                <div className="text-sm text-muted-foreground">최고 점수</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">{userStats.currentStreak}</div>
                <div className="text-sm text-muted-foreground">현재 연승</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-accent">{userStats.bestStreak}</div>
                <div className="text-sm text-muted-foreground">최대 연승</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-secondary">{userStats.totalScore}</div>
                <div className="text-sm text-muted-foreground">총 점수</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-600">{userStats.averageScore.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">평균 점수</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Rules */}
      <Card className="bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            <i className="fas fa-info-circle mr-2"></i>
            게임 규칙
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <i className="fas fa-clock text-primary text-lg"></i>
              </div>
              <h3 className="font-semibold">5라운드 15초</h3>
              <p className="text-sm text-muted-foreground">
                각 라운드마다 15초 안에 단어를 입력하세요
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
                <i className="fas fa-brain text-accent text-lg"></i>
              </div>
              <h3 className="font-semibold">의미 유사도</h3>
              <p className="text-sm text-muted-foreground">
                목표 단어와 유사한 의미의 단어일수록 높은 점수
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto">
                <i className="fas fa-trophy text-secondary text-lg"></i>
              </div>
              <h3 className="font-semibold">높은 점수 승리</h3>
              <p className="text-sm text-muted-foreground">
                5라운드 총합 점수가 높은 플레이어가 승리
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

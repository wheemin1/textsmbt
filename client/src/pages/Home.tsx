import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import MatchBanner from "@/components/MatchBanner";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingSeconds, setMatchmakingSeconds] = useState(0);
  const [canStartBot, setCanStartBot] = useState(false);
  const { toast } = useToast();

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
        localStorage.setItem('userId', userId);
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-12 animate-fade-in">
        <div className="relative">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            텍스트 배틀
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl -z-10"></div>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          단어의 의미 유사도로 승부하는 실시간 대전 게임<br />
          <span className="text-accent font-medium">5라운드 동안 가장 높은 점수를 획득하세요!</span>
        </p>
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
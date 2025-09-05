import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { StaticGameEngine } from "@/lib/staticGameEngine";

// 게임 엔진에서 가져온 타입들
interface StaticGameState {
  gameId: string;
  currentRound: number;
  timeRemaining: number;
  isBot: boolean;
  opponent: {
    nickname: string;
    type: "human" | "bot";
  };
  rounds: StaticRoundData[];
  myBestScore: number;
  opponentBestScore: number;
  status: "waiting" | "active" | "completed";
  winnerId?: string;
  targetWords: string[];
}

interface StaticRoundData {
  round: number;
  player1Word?: string;
  player1Score?: number;
  player2Word?: string;
  player2Score?: number;
  completed: boolean;
  completedAt?: string;
  targetWord: string;
}

interface GameResult {
  gameId: string;
  round: number;
  myScore: number;
  myWord: string;
  opponentScore: number;
  opponentWord: string;
  roundComplete: boolean;
  gameComplete: boolean;
  winner?: string;
  targetWord: string;
}

export default function StaticGame({ params }: { params: { gameId: string } }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<StaticGameState | null>(null);
  const [currentWord, setCurrentWord] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  useEffect(() => {
    const state = StaticGameEngine.getGameState(params.gameId);
    if (!state) {
      toast({
        title: "게임을 찾을 수 없습니다",
        description: "게임이 존재하지 않거나 만료되었습니다.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }
    setGameState(state);

    // 게임 상태 업데이트 리스너
    const interval = setInterval(() => {
      const updatedState = StaticGameEngine.getGameState(params.gameId);
      if (updatedState) {
        setGameState(updatedState);
        
        // 게임 완료 시 자동으로 결과 업데이트
        if (updatedState.status === "completed" && !gameResult) {
          const lastRound = updatedState.rounds[updatedState.rounds.length - 1];
          if (lastRound && lastRound.completed) {
            setGameResult({
              gameId: params.gameId,
              round: lastRound.round,
              myScore: lastRound.player1Score || 0,
              myWord: lastRound.player1Word || "",
              opponentScore: lastRound.player2Score || 0,
              opponentWord: lastRound.player2Word || "",
              roundComplete: true,
              gameComplete: true,
              winner: updatedState.winnerId,
              targetWord: lastRound.targetWord
            });
          }
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [params.gameId, toast, setLocation, gameResult]);

  const handleSubmitWord = async () => {
    if (!currentWord.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const result = await StaticGameEngine.submitWord(params.gameId, currentWord);
      setGameResult(result);
      setCurrentWord("");
      
      toast({
        title: "단어 제출 완료!",
        description: `"${result.myWord}"로 ${result.myScore}점을 획득했습니다.`,
        variant: "default",
      });
      
      // 게임 완료 시 결과 표시
      if (result.gameComplete) {
        setTimeout(() => {
          if (result.winner === "player") {
            toast({
              title: "🎉 승리!",
              description: "축하합니다! 봇을 이겼습니다!",
              variant: "default",
            });
          } else if (result.winner === "opponent") {
            toast({
              title: "😅 패배",
              description: "아쉽지만 봇이 이겼습니다. 다시 도전해보세요!",
              variant: "default",
            });
          } else {
            toast({
              title: "🤝 무승부",
              description: "박빙의 승부였습니다!",
              variant: "default",
            });
          }
        }, 1000);
      }
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error?.message || "단어 제출 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      handleSubmitWord();
    }
  };

  const quitGame = () => {
    StaticGameEngine.cleanupGame(params.gameId);
    setLocation("/");
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentRoundData = gameState.rounds[gameState.rounds.length - 1];
  const targetWord = gameState.targetWords[gameState.currentRound - 1];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          vs {gameState.opponent.nickname}
        </h1>
        <div className="flex justify-center items-center space-x-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{user?.nickname}</div>
            <div className="text-sm text-muted-foreground">최고: {gameState.myBestScore}</div>
          </div>
          <div className="text-center">
            <div className="text-lg text-muted-foreground">vs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">{gameState.opponent.nickname}</div>
            <div className="text-sm text-muted-foreground">최고: {gameState.opponentBestScore}</div>
          </div>
        </div>
      </div>

      {/* Round Info */}
      <Card className="bg-card shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            라운드 {gameState.currentRound}/5
          </CardTitle>
          <div className="text-3xl font-bold text-primary">
            남은 시간: {gameState.timeRemaining}초
          </div>
        </CardHeader>
      </Card>

      {/* Game Status */}
      {gameState.status === "active" && (
        <Card className="bg-card shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">목표 단어와 유사한 단어를 입력하세요!</h2>
              <p className="text-muted-foreground">목표 단어: <span className="font-bold text-primary">"{targetWord}"</span></p>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <Input
                type="text"
                placeholder="한글 단어 입력 (2-10자)"
                value={currentWord}
                onChange={(e) => setCurrentWord(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-center text-lg h-14"
                maxLength={10}
                disabled={isSubmitting}
                autoFocus
              />
              
              <Button
                size="lg"
                className="w-full h-14 rounded-full font-semibold"
                onClick={handleSubmitWord}
                disabled={!currentWord.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    제출 중...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    단어 제출
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Round Results */}
      {gameResult && (
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">라운드 {gameResult.round} 결과</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <h3 className="font-bold text-primary mb-2">{user?.nickname}</h3>
                <div className="text-2xl font-bold">{gameResult.myWord || "(시간 초과)"}</div>
                <div className="text-xl text-primary">{gameResult.myScore}점</div>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <h3 className="font-bold text-accent mb-2">{gameState.opponent.nickname}</h3>
                <div className="text-2xl font-bold">{gameResult.opponentWord}</div>
                <div className="text-xl text-accent">{gameResult.opponentScore}점</div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                목표 단어: <span className="font-bold">"{gameResult.targetWord}"</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Complete */}
      {gameState.status === "completed" && (
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl">게임 완료!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              {gameState.winnerId === "player" && (
                <div className="text-3xl font-bold text-green-600">🎉 승리!</div>
              )}
              {gameState.winnerId === "opponent" && (
                <div className="text-3xl font-bold text-red-600">😅 패배</div>
              )}
              {gameState.winnerId === "tie" && (
                <div className="text-3xl font-bold text-yellow-600">🤝 무승부</div>
              )}
            </div>

            {/* Final Scores */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <h3 className="font-bold text-primary mb-2">{user?.nickname}</h3>
                <div className="text-2xl font-bold">
                  {gameState.rounds.reduce((sum, r) => sum + (r.player1Score || 0), 0)}점
                </div>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <h3 className="font-bold text-accent mb-2">{gameState.opponent.nickname}</h3>
                <div className="text-2xl font-bold">
                  {gameState.rounds.reduce((sum, r) => sum + (r.player2Score || 0), 0)}점
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                onClick={() => setLocation("/")}
                className="w-full md:w-auto"
              >
                <i className="fas fa-home mr-2"></i>
                메인으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Round History */}
      {gameState.rounds.length > 0 && (
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">라운드 기록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gameState.rounds.map((round, index) => (
                <div key={index} className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="font-bold">라운드 {round.round}</div>
                    <div className="text-sm text-muted-foreground">"{round.targetWord}"</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-primary">{round.player1Word || "-"}</div>
                    <div className="text-lg font-bold">{round.player1Score || 0}점</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-accent">{round.player2Word || "-"}</div>
                    <div className="text-lg font-bold">{round.player2Score || 0}점</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quit Game */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={quitGame}
          className="text-muted-foreground"
        >
          <i className="fas fa-times mr-2"></i>
          게임 종료
        </Button>
      </div>
    </main>
  );
}

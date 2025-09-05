import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// 간단한 게임 상태 타입
interface SimpleGameState {
  gameId: string;
  difficulty: string;
  opponent: string;
  currentRound: number;
  maxRounds: number;
  timeRemaining: number;
  status: "active" | "completed";
  playerScore: number;
  botScore: number;
  currentTarget?: string;
  roundResults: Array<{
    round: number;
    target: string;
    playerWord: string;
    playerScore: number;
    botWord: string;
    botScore: number;
  }>;
}

const TARGET_WORDS = [
  "사랑", "행복", "친구", "가족", "자연", "음악", "여행", "꿈", "평화", "희망"
];

const BOT_WORDS = {
  easy: ["좋아", "친절", "사람", "집", "나무", "소리", "길", "마음", "시간", "빛"],
  medium: ["애정", "기쁨", "동료", "혈족", "환경", "선율", "모험", "이상", "화합", "기대"],
  hard: ["연애", "즐거움", "벗", "혈연", "생태", "멜로디", "탐험", "포부", "조화", "염원"]
};

// 간단한 유사도 계산
const calculateSimilarity = (word1: string, word2: string): number => {
  if (word1 === word2) return 100;
  
  // 글자 포함 여부로 간단한 유사도 계산
  let score = 0;
  for (let char of word1) {
    if (word2.includes(char)) score += 20;
  }
  
  // 길이 유사성
  const lengthSimilarity = Math.max(0, 20 - Math.abs(word1.length - word2.length) * 5);
  
  return Math.min(100, score + lengthSimilarity + Math.random() * 30);
};

export default function StaticGame({ params }: { params: { gameId: string } }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<SimpleGameState | null>(null);
  const [currentWord, setCurrentWord] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 게임 상태 로드
    const savedGame = localStorage.getItem(`game_${params.gameId}`);
    if (!savedGame) {
      toast({
        title: "게임을 찾을 수 없습니다",
        description: "게임이 존재하지 않거나 만료되었습니다.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }

    const gameInfo = JSON.parse(savedGame);
    const newGameState: SimpleGameState = {
      gameId: params.gameId,
      difficulty: gameInfo.difficulty,
      opponent: gameInfo.opponent,
      currentRound: 1,
      maxRounds: 5,
      timeRemaining: 15,
      status: "active",
      playerScore: 0,
      botScore: 0,
      currentTarget: TARGET_WORDS[0],
      roundResults: []
    };

    setGameState(newGameState);

    // 타이머 시작
    const timer = setInterval(() => {
      setGameState(prev => {
        if (!prev || prev.status !== "active") return prev;
        
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          // 시간 초과 시 자동 제출
          handleAutoSubmit(prev);
          return prev;
        }
        
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [params.gameId, toast, setLocation]);

  const handleAutoSubmit = (currentGameState: SimpleGameState) => {
    // 시간 초과 시 빈 단어로 처리
    submitRound(currentGameState, "");
  };

  const submitRound = (currentGameState: SimpleGameState, word: string) => {
    const target = currentGameState.currentTarget || "";
    const playerScore = word ? calculateSimilarity(word, target) : 0;
    
    // 봇 단어 선택
    const botWordList = BOT_WORDS[currentGameState.difficulty as keyof typeof BOT_WORDS] || BOT_WORDS.easy;
    const botWord = botWordList[currentGameState.currentRound - 1] || botWordList[0];
    let botScore = calculateSimilarity(botWord, target);
    
    // 난이도별 봇 점수 조정
    switch (currentGameState.difficulty) {
      case "easy":
        botScore = Math.min(botScore, 60 + Math.random() * 20);
        break;
      case "medium":
        botScore = Math.min(botScore, 75 + Math.random() * 15);
        break;
      case "hard":
        botScore = Math.min(botScore, 85 + Math.random() * 10);
        break;
    }
    botScore = Math.round(botScore);

    const roundResult = {
      round: currentGameState.currentRound,
      target,
      playerWord: word || "(시간 초과)",
      playerScore: Math.round(playerScore),
      botWord,
      botScore
    };

    const newRoundResults = [...currentGameState.roundResults, roundResult];
    const newPlayerScore = currentGameState.playerScore + roundResult.playerScore;
    const newBotScore = currentGameState.botScore + roundResult.botScore;

    if (currentGameState.currentRound >= currentGameState.maxRounds) {
      // 게임 종료
      const winner = newPlayerScore > newBotScore ? "player" : 
                    newBotScore > newPlayerScore ? "bot" : "tie";
      
      setGameState({
        ...currentGameState,
        status: "completed",
        playerScore: newPlayerScore,
        botScore: newBotScore,
        roundResults: newRoundResults
      });

      setTimeout(() => {
        if (winner === "player") {
          toast({
            title: "🎉 승리!",
            description: `축하합니다! ${newPlayerScore}점으로 봇을 이겼습니다!`,
            variant: "default",
          });
        } else if (winner === "bot") {
          toast({
            title: "😅 패배",
            description: `아쉽지만 봇이 ${newBotScore}점으로 이겼습니다.`,
            variant: "default",
          });
        } else {
          toast({
            title: "🤝 무승부",
            description: `${newPlayerScore}점으로 박빙의 승부였습니다!`,
            variant: "default",
          });
        }
      }, 1000);
    } else {
      // 다음 라운드
      setGameState({
        ...currentGameState,
        currentRound: currentGameState.currentRound + 1,
        timeRemaining: 15,
        playerScore: newPlayerScore,
        botScore: newBotScore,
        currentTarget: TARGET_WORDS[currentGameState.currentRound],
        roundResults: newRoundResults
      });

      toast({
        title: "라운드 완료!",
        description: `"${word || '(시간 초과)'}"로 ${roundResult.playerScore}점 획득!`,
        variant: "default",
      });
    }
  };

  const handleSubmitWord = async () => {
    if (!currentWord.trim() || isSubmitting || !gameState) return;
    
    setIsSubmitting(true);
    try {
      submitRound(gameState, currentWord.trim());
      setCurrentWord("");
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
    localStorage.removeItem(`game_${params.gameId}`);
    setLocation("/");
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          vs {gameState.opponent}
        </h1>
        <div className="flex justify-center items-center space-x-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{user?.nickname}</div>
            <div className="text-lg text-primary">{gameState.playerScore}점</div>
          </div>
          <div className="text-center">
            <div className="text-lg text-muted-foreground">vs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">{gameState.opponent}</div>
            <div className="text-lg text-accent">{gameState.botScore}점</div>
          </div>
        </div>
      </div>

      {/* Round Info */}
      <Card className="bg-card shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            라운드 {gameState.currentRound}/{gameState.maxRounds}
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
              <p className="text-muted-foreground">목표 단어: <span className="font-bold text-primary text-2xl">"{gameState.currentTarget}"</span></p>
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

      {/* Game Complete */}
      {gameState.status === "completed" && (
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl">게임 완료!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              {gameState.playerScore > gameState.botScore && (
                <div className="text-3xl font-bold text-green-600">🎉 승리!</div>
              )}
              {gameState.botScore > gameState.playerScore && (
                <div className="text-3xl font-bold text-red-600">😅 패배</div>
              )}
              {gameState.playerScore === gameState.botScore && (
                <div className="text-3xl font-bold text-yellow-600">🤝 무승부</div>
              )}
            </div>

            {/* Final Scores */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <h3 className="font-bold text-primary mb-2">{user?.nickname}</h3>
                <div className="text-2xl font-bold">{gameState.playerScore}점</div>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <h3 className="font-bold text-accent mb-2">{gameState.opponent}</h3>
                <div className="text-2xl font-bold">{gameState.botScore}점</div>
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
      {gameState.roundResults.length > 0 && (
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">라운드 기록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gameState.roundResults.map((result, index) => (
                <div key={index} className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="font-bold">라운드 {result.round}</div>
                    <div className="text-sm text-muted-foreground">"{result.target}"</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-primary">{result.playerWord}</div>
                    <div className="text-lg font-bold">{result.playerScore}점</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-accent">{result.botWord}</div>
                    <div className="text-lg font-bold">{result.botScore}점</div>
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

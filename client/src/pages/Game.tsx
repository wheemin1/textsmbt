import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import RoundDots from "@/components/RoundDots";
import WordInput from "@/components/WordInput";
import ScoreRow from "@/components/ScoreRow";
import ResultModal from "@/components/ResultModal";
import { useGameState } from "@/hooks/useGameState";

export default function Game() {
  const params = useParams<{ gameId?: string }>();
  const gameId = params.gameId || null;
  
  const { gameState, isLoading, submitWord, timeRemaining } = useGameState(gameId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-card shadow-xl p-8">
          <CardContent className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-xl font-semibold text-card-foreground">게임 로딩 중...</h2>
            <p className="text-muted-foreground">게임 상태를 불러오고 있습니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gameState || gameState.status === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-card shadow-xl p-8">
          <CardContent className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive rounded-full flex items-center justify-center">
              <i className="fas fa-exclamation text-destructive-foreground text-2xl"></i>
            </div>
            <h2 className="text-xl font-semibold text-card-foreground">게임을 찾을 수 없습니다</h2>
            <p className="text-muted-foreground">유효하지 않은 게임 ID입니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isGameComplete = gameState.status === 'completed';
  
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Game Header */}
      <Card className="bg-card shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">라운드</span>
                <RoundDots currentRound={gameState.currentRound} />
              </div>
              <div className="h-6 w-px bg-border"></div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">상대:</span>
                <span className="font-medium text-foreground" data-testid="text-opponent-nickname">
                  {gameState.opponent?.nickname || "상대방"}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  gameState.isBot 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'bg-accent/20 text-accent'
                }`} data-testid="text-opponent-type">
                  {gameState.isBot ? '[봇]' : '[사람]'}
                </span>
              </div>
            </div>
            
            {/* Timer */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">남은 시간</div>
                <div className={`text-2xl font-mono font-bold transition-colors ${
                  timeRemaining <= 5 ? 'text-destructive' : 'text-accent'
                }`} data-testid="text-time-remaining">
                  {Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:
                  {(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <div className="w-12 h-12 relative">
                <div className="w-full h-full border-4 border-accent/20 rounded-full"></div>
                <div 
                  className="absolute inset-0 w-full h-full border-4 border-accent rounded-full transform -rotate-90 border-transparent border-t-accent transition-transform duration-1000"
                  style={{
                    transform: `rotate(${((15 - timeRemaining) / 15) * 360 - 90}deg)`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Word Input Section */}
      {!isGameComplete && gameState.status === 'active' && (
        <WordInput 
          onSubmit={submitWord}
          disabled={timeRemaining <= 0}
          gameId={gameId}
        />
      )}

      {/* Round History and Scores */}
      <ScoreRow 
        rounds={gameState.rounds || []}
        myBestScore={gameState.myBestScore}
        opponentBestScore={gameState.opponentBestScore}
      />

      {/* Final Results Modal */}
      {isGameComplete && (
        <ResultModal
          gameState={gameState}
          isOpen={true}
          onClose={() => setLocation('/')}
        />
      )}

      {/* Game Statistics Sidebar (Desktop) */}
      <aside className="hidden xl:block fixed right-4 top-1/2 transform -translate-y-1/2 w-64">
        <Card className="bg-card/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-2">
              게임 통계
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">현재 라운드</span>
                <span className="font-semibold text-foreground" data-testid="text-current-round">
                  {gameState.currentRound}/5
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">내 최고점</span>
                <span className="font-semibold text-primary" data-testid="text-my-best-score">
                  {gameState.myBestScore}점
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">상대 최고점</span>
                <span className="font-semibold text-accent" data-testid="text-opponent-best-score">
                  {gameState.opponentBestScore}점
                </span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground text-center">
                Powered by FastText Korean Embeddings
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>
    </main>
  );
}

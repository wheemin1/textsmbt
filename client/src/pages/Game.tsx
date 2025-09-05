import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RoundDots from "@/components/RoundDots";
import WordInput from "@/components/WordInput";
import ScoreRow from "@/components/ScoreRow";
import ResultModal from "@/components/ResultModal";
import { useGameState } from "@/hooks/useGameState";
import { useSimilarityStats } from "@/hooks/useSimilarityStats";
import { Home, TrendingUp, Target, BarChart3, Loader2 } from "lucide-react";
import { useState } from "react";

export default function Game() {
  const params = useParams<{ gameId?: string }>();
  const gameId = params.gameId || null;
  const [, setLocation] = useLocation();
  
  const { gameState, isLoading, submitWord, timeRemaining } = useGameState(gameId);
  const { data: stats, isLoading: statsLoading, error: statsError } = useSimilarityStats(gameId);

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
            {/* Home Button */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="text-muted-foreground hover:text-foreground"
                title="홈으로 가기"
              >
                <Home className="h-4 w-4" />
              </Button>
              
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
              {/* 목표 단어 표시 */}
              {(gameState as any).debugInfo?.targetWord && 
               (gameState as any).debugInfo.targetWord !== "없음" && 
               (gameState as any).debugInfo.targetWord !== "Hidden in production" && (
                <>
                  <div className="h-6 w-px bg-border"></div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">🎯 목표:</span>
                    <span className="font-bold text-primary bg-primary/10 px-2 py-1 rounded text-sm">
                      {(gameState as any).debugInfo.targetWord}
                    </span>
                  </div>
                </>
              )}
              {/* 현재 라운드 최고 점수 표시 */}
              <div className="h-6 w-px bg-border"></div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">최고 점수:</span>
                <span className="font-bold text-accent bg-accent/10 px-2 py-1 rounded text-lg">
                  {gameState.myBestScore}점
                </span>
                <span className="text-xs text-muted-foreground">
                  vs {gameState.opponentBestScore}점
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
                  className="absolute inset-0 w-full h-full border-4 rounded-full transform -rotate-90 border-transparent border-t-accent transition-transform duration-1000"
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

      {/* Similarity Statistics */}
      <Card className="bg-card shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-card-foreground">유사도 통계</h3>
            {statsLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          </div>
          
          {statsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                <p className="text-sm text-muted-foreground">통계 계산 중...</p>
              </div>
            </div>
          )}
          
          {statsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">통계를 불러올 수 없습니다</p>
            </div>
          )}
          
          {stats && !statsLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4" />
                정답 단어: <span className="font-medium text-foreground">{stats.targetWord}</span>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 leading-relaxed">
                  {stats.message}
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                <div className="text-green-600 font-medium text-xs">최고 유사도</div>
                <div className="text-green-900 text-lg font-bold">
                  {stats.maxSimilarity}%
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                <div className="text-gray-600 text-xs">분석된 단어 수</div>
                <div className="text-gray-900 font-bold">
                  {stats.totalWords.toLocaleString()}개
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-muted-foreground text-center">
                  💡 높은 점수를 얻기 위해 정답과 유사한 단어를 찾아보세요!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

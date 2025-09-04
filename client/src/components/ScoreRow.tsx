import { Card, CardContent } from "@/components/ui/card";

interface Round {
  round: number;
  player1Word?: string;
  player1Score?: number;
  player2Word?: string;
  player2Score?: number;
  completed: boolean;
}

interface ScoreRowProps {
  rounds: Round[];
  myBestScore: number;
  opponentBestScore: number;
}

export default function ScoreRow({ rounds, myBestScore, opponentBestScore }: ScoreRowProps) {
  // Find the rounds with best scores
  const myBestRound = rounds.findIndex(r => r.player1Score === myBestScore);
  const opponentBestRound = rounds.findIndex(r => r.player2Score === opponentBestScore);

  return (
    <Card className="bg-card shadow-lg">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">라운드 기록</h3>
        
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => {
            const round = rounds[index];
            const roundNumber = index + 1;
            const isCompleted = round?.completed;
            const isMyBest = myBestRound === index && round?.player1Score === myBestScore;
            const isOpponentBest = opponentBestRound === index && round?.player2Score === opponentBestScore;
            
            return (
              <div 
                key={roundNumber}
                className={`grid grid-cols-12 gap-4 items-center py-3 px-4 rounded-lg transition-colors ${
                  isCompleted 
                    ? 'bg-secondary/30' 
                    : roundNumber === (rounds.length + 1)
                    ? 'bg-accent/10 border border-accent/30'
                    : 'bg-muted/30'
                }`}
                data-testid={`row-round-${roundNumber}`}
              >
                <div className="col-span-2 flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    라운드 {roundNumber}
                  </span>
                  {isMyBest && myBestScore > 0 && (
                    <i className="fas fa-crown text-yellow-400 text-sm" title="내 최고점"></i>
                  )}
                </div>
                
                {isCompleted ? (
                  <>
                    <div className="col-span-5">
                      <div className="text-sm text-muted-foreground">내 점수</div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-foreground" data-testid={`text-my-score-${roundNumber}`}>
                          {round.player1Score || 0}점
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({round.player1Word || '-'})
                        </span>
                      </div>
                    </div>
                    <div className="col-span-5">
                      <div className="text-sm text-muted-foreground">상대 점수</div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-foreground" data-testid={`text-opponent-score-${roundNumber}`}>
                          {round.player2Score || 0}점
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({round.player2Word || '-'})
                        </span>
                        {isOpponentBest && opponentBestScore > 0 && (
                          <i className="fas fa-crown text-yellow-400 text-sm" title="상대 최고점"></i>
                        )}
                      </div>
                    </div>
                  </>
                ) : roundNumber === (rounds.length + 1) ? (
                  <div className="col-span-10 text-center">
                    <span className="text-accent font-medium">진행 중...</span>
                  </div>
                ) : (
                  <div className="col-span-10 text-center">
                    <span className="text-muted-foreground text-sm">대기 중</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Current Totals */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">내 최고점</div>
              <div className="text-xl font-bold text-primary" data-testid="text-total-my-best">
                {myBestScore}점
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">상대 최고점</div>
              <div className="text-xl font-bold text-accent" data-testid="text-total-opponent-best">
                {opponentBestScore}점
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

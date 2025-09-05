import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ResultModalProps {
  gameState: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ResultModal({ gameState, isOpen, onClose }: ResultModalProps) {
  const [, setLocation] = useLocation();
  
  if (!gameState) return null;

  const rounds = gameState.rounds || [];
  const myTotalScore = rounds.reduce((sum: number, round: any) => sum + (round.player1Score || 0), 0);
  const opponentTotalScore = rounds.reduce((sum: number, round: any) => sum + (round.player2Score || 0), 0);
  
  let resultTitle = "무승부!";
  let resultIcon = "fas fa-handshake";
  let resultSubtitle = "박빙의 승부였습니다";
  
  if (gameState.winnerId === localStorage.getItem('userId')) {
    resultTitle = "승리!";
    resultIcon = "fas fa-trophy";
    resultSubtitle = "축하합니다! 상대방을 이겼습니다";
  } else if (gameState.winnerId && gameState.winnerId !== "bot") {
    resultTitle = "패배";
    resultIcon = "fas fa-medal";
    resultSubtitle = "다음엔 더 잘할 수 있어요!";
  } else if (gameState.winnerId === "bot") {
    resultTitle = "패배";
    resultIcon = "fas fa-robot";
    resultSubtitle = "봇에게 졌지만 좋은 연습이었어요!";
  }

  const handlePlayAgain = () => {
    onClose();
    setLocation('/');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <div className="p-6 animate-slide-up" data-testid="modal-game-result">
          {/* Victory/Defeat Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <i className={`${resultIcon} text-3xl text-primary-foreground`}></i>
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-card-foreground mb-2">
                {resultTitle}
              </DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">{resultSubtitle}</p>
          </div>
          
          {/* Final Scores */}
          <div className="bg-secondary/30 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4 text-center">최종 점수</h3>
            
            {/* 정답 표시 */}
            {(gameState as any).debugInfo?.targetWord && (
              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20 text-center">
                <div className="text-sm text-muted-foreground mb-1">🎯 정답</div>
                <div className="font-bold text-primary text-lg">
                  {(gameState as any).debugInfo.targetWord}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {rounds.map((round: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/30">
                  <span className="text-sm text-muted-foreground">라운드 {index + 1}</span>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      (round.player1Score || 0) > (round.player2Score || 0) 
                        ? 'score-highlight' 
                        : 'bg-muted'
                    }`} data-testid={`result-my-score-${index + 1}`}>
                      {round.player1Score || 0}점
                    </span>
                    <span className="text-muted-foreground">vs</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      (round.player2Score || 0) > (round.player1Score || 0) 
                        ? 'score-highlight' 
                        : 'bg-muted'
                    }`} data-testid={`result-opponent-score-${index + 1}`}>
                      {round.player2Score || 0}점
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total Score */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-card-foreground">최종 합계</span>
                <div className="flex items-center space-x-4">
                  <span className="text-xl font-bold text-primary" data-testid="text-final-my-total">
                    {myTotalScore}점
                  </span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="text-xl font-bold text-muted-foreground" data-testid="text-final-opponent-total">
                    {opponentTotalScore}점
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="secondary"
              onClick={onClose}
              data-testid="button-return-home"
            >
              홈으로
            </Button>
            <Button
              onClick={handlePlayAgain}
              data-testid="button-play-again"
            >
              다시 대전
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

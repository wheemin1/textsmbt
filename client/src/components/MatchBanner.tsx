import { Button } from "@/components/ui/button";

interface MatchBannerProps {
  isActive: boolean;
  secondsElapsed: number;
  canStartBot: boolean;
  onStartBot: () => void;
}

export default function MatchBanner({ 
  isActive, 
  secondsElapsed, 
  canStartBot, 
  onStartBot 
}: MatchBannerProps) {
  if (!isActive) return null;

  const remaining = Math.max(0, 12 - secondsElapsed);

  return (
    <div className="bg-accent/10 border border-accent rounded-xl p-6 space-y-4 animate-fade-in" data-testid="component-match-banner">
      <div className="flex items-center justify-center space-x-3">
        <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
        <span className="text-accent font-medium">
          {secondsElapsed >= 6 ? '상대를 찾는 중...' : '매칭 중...'}
        </span>
        <span className="text-accent-foreground/60">
          ({remaining}초 남음)
        </span>
      </div>
      
      {canStartBot && (
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={onStartBot}
          data-testid="button-start-bot-match"
        >
          지금 연습전 시작하기
        </Button>
      )}
    </div>
  );
}

interface RoundDotsProps {
  currentRound: number;
  totalRounds?: number;
}

export default function RoundDots({ currentRound, totalRounds = 5 }: RoundDotsProps) {
  return (
    <div className="flex space-x-2" data-testid="component-round-dots">
      {Array.from({ length: totalRounds }, (_, index) => {
        const round = index + 1;
        const isActive = round === currentRound;
        const isCompleted = round < currentRound;
        const isPending = round > currentRound;

        return (
          <div
            key={round}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              isActive 
                ? 'round-dot-active' 
                : isCompleted 
                ? 'bg-primary/60' 
                : 'border-2 border-primary/40 bg-transparent'
            }`}
            data-testid={`dot-round-${round}`}
            title={`라운드 ${round}${isActive ? ' (진행 중)' : isCompleted ? ' (완료)' : ' (대기 중)'}`}
          />
        );
      })}
    </div>
  );
}

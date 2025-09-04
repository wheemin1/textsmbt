import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Leaderboard() {
  // Mock data - in production this would come from the database
  const leaderboardData = [
    { rank: 1, nickname: "워드마스터", totalWins: 45, bestScore: 98, winRate: 87 },
    { rank: 2, nickname: "의미왕", totalWins: 38, bestScore: 95, winRate: 82 },
    { rank: 3, nickname: "한글고수", totalWins: 32, bestScore: 92, winRate: 78 },
    { rank: 4, nickname: "단어장인", totalWins: 28, bestScore: 89, winRate: 74 },
    { rank: 5, nickname: "유사도킹", totalWins: 25, bestScore: 87, winRate: 71 },
  ];

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return "fas fa-crown text-yellow-400";
      case 2: return "fas fa-medal text-gray-400";
      case 3: return "fas fa-award text-amber-600";
      default: return "fas fa-hashtag text-muted-foreground";
    }
  };

  const getRankColor = (rank: number) => {
    switch(rank) {
      case 1: return "bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-yellow-400";
      case 2: return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400";
      case 3: return "bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600";
      default: return "bg-card border-border";
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <i className="fas fa-arrow-left mr-2"></i>
            홈으로
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">리더보드</h1>
          <p className="text-muted-foreground">최고의 플레이어들을 만나보세요</p>
        </div>
      </div>

      {/* Leaderboard Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-trophy text-primary"></i>
            <span>전체 순위</span>
            <Badge variant="secondary" className="ml-auto">
              <i className="fas fa-clock mr-1"></i>
              실시간
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboardData.map((player) => (
              <div 
                key={player.rank}
                className={`flex items-center p-4 rounded-lg border transition-all hover:shadow-md ${getRankColor(player.rank)}`}
                data-testid={`row-rank-${player.rank}`}
              >
                {/* Rank and Icon */}
                <div className="flex items-center space-x-3 w-16">
                  <i className={`${getRankIcon(player.rank)} text-lg`}></i>
                  <span className="font-bold text-lg">{player.rank}</span>
                </div>
                
                {/* Player Info */}
                <div className="flex-1 ml-4">
                  <h3 className="font-semibold text-foreground text-lg">{player.nickname}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>
                      <i className="fas fa-gamepad mr-1"></i>
                      {player.totalWins}승
                    </span>
                    <span>
                      <i className="fas fa-percentage mr-1"></i>
                      승률 {player.winRate}%
                    </span>
                  </div>
                </div>
                
                {/* Best Score */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{player.bestScore}</div>
                  <div className="text-xs text-muted-foreground">최고 점수</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Season Info */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-calendar-alt text-2xl text-primary-foreground"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">시즌 1</h3>
              <p className="text-sm text-muted-foreground">
                2025년 1월 시즌이 진행 중입니다
              </p>
            </div>
            <div className="flex justify-center space-x-8 text-sm">
              <div className="text-center">
                <div className="font-semibold text-foreground">23일</div>
                <div className="text-muted-foreground">시즌 종료까지</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground">1,247</div>
                <div className="text-muted-foreground">참여 플레이어</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
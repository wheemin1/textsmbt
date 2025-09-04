import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface GameHistoryEntry {
  id: string;
  opponent: string;
  isBot: boolean;
  result: "win" | "loss" | "tie";
  myBestScore: number;
  opponentBestScore: number;
  completedAt: string;
  rounds: any[];
}

export default function GameHistory() {
  // Mock data - in production this would come from the database
  const gameHistory: GameHistoryEntry[] = [
    {
      id: "game-1",
      opponent: "AI 봇",
      isBot: true,
      result: "win",
      myBestScore: 87,
      opponentBestScore: 73,
      completedAt: "2025-01-03T10:30:00Z",
      rounds: []
    },
    {
      id: "game-2", 
      opponent: "워드마스터",
      isBot: false,
      result: "loss",
      myBestScore: 62,
      opponentBestScore: 89,
      completedAt: "2025-01-03T09:15:00Z",
      rounds: []
    },
    {
      id: "game-3",
      opponent: "AI 봇",
      isBot: true,
      result: "tie",
      myBestScore: 75,
      opponentBestScore: 75,
      completedAt: "2025-01-02T16:45:00Z",
      rounds: []
    }
  ];

  const getResultBadge = (result: string) => {
    switch(result) {
      case "win":
        return <Badge className="bg-green-500 text-white">승리</Badge>;
      case "loss":
        return <Badge variant="destructive">패배</Badge>;
      case "tie":
        return <Badge variant="secondary">무승부</Badge>;
      default:
        return <Badge variant="outline">진행중</Badge>;
    }
  };

  const getResultIcon = (result: string) => {
    switch(result) {
      case "win": return "fas fa-trophy text-green-500";
      case "loss": return "fas fa-times-circle text-red-500";
      case "tie": return "fas fa-handshake text-muted-foreground";
      default: return "fas fa-clock text-muted-foreground";
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
          <h1 className="text-3xl font-bold text-foreground">게임 기록</h1>
          <p className="text-muted-foreground">지난 대전 결과를 확인하세요</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{gameHistory.length}</div>
            <div className="text-sm text-muted-foreground">총 게임</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {gameHistory.filter(g => g.result === "win").length}
            </div>
            <div className="text-sm text-muted-foreground">승리</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">
              {gameHistory.filter(g => g.result === "loss").length}
            </div>
            <div className="text-sm text-muted-foreground">패배</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {Math.max(...gameHistory.map(g => g.myBestScore))}
            </div>
            <div className="text-sm text-muted-foreground">최고 점수</div>
          </CardContent>
        </Card>
      </div>

      {/* Game History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-history text-primary"></i>
            <span>최근 대전</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gameHistory.map((game) => (
              <div 
                key={game.id}
                className="flex items-center p-4 rounded-lg border bg-card hover:bg-card/80 transition-colors"
                data-testid={`game-history-${game.id}`}
              >
                {/* Result Icon */}
                <div className="w-12 h-12 flex items-center justify-center mr-4">
                  <i className={`${getResultIcon(game.result)} text-xl`}></i>
                </div>
                
                {/* Game Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-semibold text-foreground">
                      vs {game.opponent}
                    </span>
                    {game.isBot && (
                      <Badge variant="outline" className="text-xs">
                        <i className="fas fa-robot mr-1"></i>
                        봇
                      </Badge>
                    )}
                    {getResultBadge(game.result)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(game.completedAt).toLocaleString('ko-KR')}
                  </div>
                </div>
                
                {/* Scores */}
                <div className="text-right mr-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-foreground">
                      {game.myBestScore}
                    </span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="text-lg font-semibold text-muted-foreground">
                      {game.opponentBestScore}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">최고 점수</div>
                </div>
                
                {/* View Details */}
                <Button variant="outline" size="sm" data-testid={`button-view-${game.id}`}>
                  <i className="fas fa-eye mr-1"></i>
                  상세
                </Button>
              </div>
            ))}
            
            {gameHistory.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-gamepad text-muted-foreground text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  아직 게임 기록이 없습니다
                </h3>
                <p className="text-muted-foreground mb-4">
                  첫 게임을 시작해보세요!
                </p>
                <Link href="/">
                  <Button>
                    <i className="fas fa-play mr-2"></i>
                    게임 시작
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
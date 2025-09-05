import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function StaticGame({ params }: { params: { gameId: string } }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // 정적 배포 버전에서는 게임 기능을 지원하지 않음을 안내
    toast({
      title: "게임 기능 준비 중",
      description: "현재 정적 배포 버전에서는 실시간 게임이 지원되지 않습니다. 로컬 개발 버전을 사용해주세요.",
      variant: "default",
    });
  }, [toast]);

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          게임 페이지
        </h1>
        <p className="text-muted-foreground">게임 ID: {params.gameId}</p>
      </div>

      {/* Info Card */}
      <Card className="bg-card shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl flex items-center justify-center space-x-2">
            <i className="fas fa-info-circle text-primary"></i>
            <span>정적 배포 버전 안내</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center space-y-6">
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
              현재 정적 배포 버전에서는 실시간 게임 기능이 지원되지 않습니다.
            </p>
            <p className="text-muted-foreground">
              완전한 게임 경험을 위해서는 로컬 개발 버전을 사용해주세요.
            </p>
          </div>
          
          <div className="bg-primary/10 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-primary mb-2">로컬 개발 버전 실행 방법</h3>
            <div className="text-left space-y-2 text-sm text-muted-foreground">
              <p>1. 프로젝트 클론: <code className="bg-muted px-2 py-1 rounded">git clone [repository-url]</code></p>
              <p>2. 의존성 설치: <code className="bg-muted px-2 py-1 rounded">npm install</code></p>
              <p>3. 개발 서버 시작: <code className="bg-muted px-2 py-1 rounded">npm run dev</code></p>
              <p>4. 브라우저에서 <code className="bg-muted px-2 py-1 rounded">http://localhost:3000</code> 접속</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Info */}
      <Card className="bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">로컬 개발 버전에서 지원되는 기능</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <i className="fas fa-robot text-accent text-lg"></i>
                <span>AI 봇과의 대전</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-brain text-primary text-lg"></i>
                <span>FastText 한국어 임베딩</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-chart-line text-secondary text-lg"></i>
                <span>실시간 유사도 계산</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <i className="fas fa-stopwatch text-accent text-lg"></i>
                <span>5라운드 시간 제한 게임</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-trophy text-primary text-lg"></i>
                <span>점수 및 통계 시스템</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-history text-secondary text-lg"></i>
                <span>게임 기록 관리</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back to Home */}
      <div className="text-center">
        <Button
          size="lg"
          onClick={handleGoHome}
          className="w-full md:w-auto"
        >
          <i className="fas fa-home mr-2"></i>
          메인으로 돌아가기
        </Button>
      </div>
    </main>
  );
}

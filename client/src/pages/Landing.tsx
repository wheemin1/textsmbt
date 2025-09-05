import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Landing() {
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요");
      return;
    }

    if (nickname.trim().length < 2 || nickname.trim().length > 20) {
      alert("닉네임은 2-20자 사이로 입력해주세요");
      return;
    }

    setIsLoading(true);
    try {
      const user = login(nickname.trim());
      if (user) {
        // 로그인 성공 시 짧은 딜레이 후 홈으로 이동 (상태 업데이트 시간 확보)
        setTimeout(() => {
          setLocation("/");
        }, 100);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("로그인 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-12 animate-fade-in">
        <div className="relative">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            한국어 텍스트 배틀
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl -z-10"></div>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          단어의 의미 유사도로 승부하는 실시간 대전 게임<br />
          <span className="text-accent font-medium">닉네임을 입력하고 다른 플레이어와 경쟁하세요!</span>
        </p>
      </div>

      {/* Login Card */}
      <Card className="bg-card shadow-lg max-w-md mx-auto">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <i className="fas fa-user text-2xl text-primary-foreground"></i>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">게임 시작하기</h2>
            <p className="text-muted-foreground">닉네임을 입력하여 게임을 시작하세요</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="text"
              placeholder="닉네임 (2-20자)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="text-center"
              maxLength={20}
              autoFocus
            />
            
            <Button
              type="submit"
              size="lg"
              className="w-full h-14 rounded-full font-semibold"
              disabled={isLoading || !nickname.trim()}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  로그인 중...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  게임 시작
                </>
              )}
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground">
            닉네임은 로컬 저장되며 다른 기기에서도 같은 닉네임으로 플레이할 수 있습니다
          </p>
        </CardContent>
      </Card>

      {/* Game Info */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card className="bg-card shadow-md">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-brain text-primary text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">의미 유사도 대전</h3>
            <p className="text-sm text-muted-foreground">
              FastText 한국어 임베딩으로 단어의 의미 유사도를 계산하여 승부
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-md">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-stopwatch text-accent text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">실시간 5라운드</h3>
            <p className="text-sm text-muted-foreground">
              라운드당 15초의 제한 시간 내에 최고 점수를 노리세요
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-md">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              {/* AI 봇 아이콘 (색상 #8C8C8C 적용) */}
              <i className="fas fa-robot text-secondary text-xl"></i>
              <i className="fas fa-robot text-xl" style={{ color: "#8C8C8C" }}></i>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">AI 봇 연습</h3>
            <p className="text-sm text-muted-foreground">
              다양한 난이도의 AI 봇과 연습하며 실력을 향상시키세요
            </p>
          </CardContent>
        </Card>
        
      </div>
    </main>
  );
}
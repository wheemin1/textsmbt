import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
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
          <span className="text-accent font-medium">로그인하고 다른 플레이어와 경쟁하세요!</span>
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
            <p className="text-muted-foreground">로그인하여 다른 플레이어와 대전하세요</p>
          </div>
          
          <Button
            size="lg"
            className="w-full h-14 rounded-full font-semibold"
            onClick={async () => {
              try {
                const nickname = prompt("닉네임을 입력하세요 (개발용 모드):");
                if (!nickname) return;

                const response = await fetch("/api/auth/mock-login", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ nickname }),
                  credentials: "include"
                });

                const data = await response.json();
                if (response.ok) {
                  console.log("Mock login success", data);
                  window.location.reload();
                } else {
                  alert(`로그인 실패: ${data.message}`);
                }
              } catch (error) {
                console.error("Login error:", error);
                alert("로그인 중 오류가 발생했습니다");
              }
            }}
            data-testid="button-login"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            로그인하기 (개발용)
          </Button>
          
          <p className="text-xs text-muted-foreground">
            개발 모드: 닉네임만 입력하면 로그인됩니다
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
              <i className="fas fa-robot text-secondary text-xl"></i>
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
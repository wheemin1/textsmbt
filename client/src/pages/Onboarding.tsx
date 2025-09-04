import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (nickname.trim().length < 2) {
      toast({
        variant: "destructive",
        title: "닉네임 오류",
        description: "닉네임은 2글자 이상 입력해주세요",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create or get user
      const user = await api.createUser(nickname.trim());
      
      // Store user data in localStorage
      localStorage.setItem('userNickname', user.nickname);
      localStorage.setItem('userId', user.id);
      
      toast({
        title: "환영합니다!",
        description: `${user.nickname}님, 게임에 오신 것을 환영합니다`,
      });
      
      onComplete();
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "사용자 등록 중 오류가 발생했습니다",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fade-in">
        <Card className="bg-card shadow-2xl game-glow">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-user-plus text-2xl text-primary-foreground"></i>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-card-foreground mb-2">게임에 오신 것을 환영합니다!</h1>
              <p className="text-muted-foreground">플레이하기 전에 닉네임을 설정해주세요</p>
            </div>
            
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="h-14 text-center text-lg font-medium"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    handleSubmit();
                  }
                }}
                data-testid="input-nickname"
                autoFocus
              />
              
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                onClick={handleSubmit}
                disabled={isLoading || nickname.trim().length < 2}
                data-testid="button-start-game"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner animate-spin mr-2"></i>
                    설정 중...
                  </>
                ) : (
                  "시작하기"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

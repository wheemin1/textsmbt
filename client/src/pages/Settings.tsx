import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [nickname, setNickname] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || "");
    }
    // Load settings from localStorage
    setSoundEnabled(localStorage.getItem('soundEnabled') !== 'false');
    setNotifications(localStorage.getItem('notifications') !== 'false');
  }, [user]);

  const handleSaveSettings = () => {
    localStorage.setItem('soundEnabled', soundEnabled.toString());
    localStorage.setItem('notifications', notifications.toString());
    
    toast({
      title: "설정 저장됨",
      description: "변경사항이 저장되었습니다.",
    });
  };

  const handleClearData = () => {
    if (confirm("모든 로컬 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      localStorage.clear();
      toast({
        title: "데이터 삭제됨",
        description: "모든 로컬 데이터가 삭제되었습니다.",
      });
      window.location.reload();
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <i className="fas fa-arrow-left mr-2"></i>
            홈으로
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">설정</h1>
          <p className="text-muted-foreground">게임 설정 및 계정 정보</p>
        </div>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-user text-primary"></i>
            <span>프로필 정보</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <img 
              src={user?.profileImageUrl || '/api/placeholder/64/64'} 
              alt="프로필 사진"
              className="w-16 h-16 rounded-full object-cover border-2 border-border"
            />
            <div className="space-y-2">
              <div>
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full"
                  placeholder="닉네임을 입력하세요"
                  data-testid="input-nickname"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {user?.email && `이메일: ${user.email}`}
              </p>
            </div>
          </div>
          <Button className="w-full" data-testid="button-save-profile">
            <i className="fas fa-save mr-2"></i>
            프로필 저장
          </Button>
        </CardContent>
      </Card>

      {/* Game Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-gamepad text-primary"></i>
            <span>게임 설정</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">효과음</Label>
              <p className="text-xs text-muted-foreground">게임 중 소리 효과 재생</p>
            </div>
            <Switch 
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
              data-testid="switch-sound"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">알림</Label>
              <p className="text-xs text-muted-foreground">게임 결과 및 매칭 알림</p>
            </div>
            <Switch 
              checked={notifications}
              onCheckedChange={setNotifications}
              data-testid="switch-notifications"
            />
          </div>

          <Button 
            onClick={handleSaveSettings}
            className="w-full"
            data-testid="button-save-settings"
          >
            <i className="fas fa-save mr-2"></i>
            설정 저장
          </Button>
        </CardContent>
      </Card>

      {/* Game Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-chart-bar text-primary"></i>
            <span>게임 통계</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">총 게임 수</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-accent">0</div>
              <div className="text-sm text-muted-foreground">승리 횟수</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-secondary">0</div>
              <div className="text-sm text-muted-foreground">최고 점수</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-muted-foreground">0%</div>
              <div className="text-sm text-muted-foreground">승률</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <i className="fas fa-exclamation-triangle"></i>
            <span>위험 구역</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-card-foreground mb-2">로컬 데이터 삭제</h4>
              <p className="text-sm text-muted-foreground mb-4">
                저장된 모든 로컬 설정과 임시 데이터를 삭제합니다. 계정 정보는 유지됩니다.
              </p>
              <Button 
                variant="destructive"
                onClick={handleClearData}
                data-testid="button-clear-data"
              >
                <i className="fas fa-trash mr-2"></i>
                로컬 데이터 삭제
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
import { useState, useEffect } from "react";
import type { User } from "@shared/schema";
import { StaticAuthService } from "../lib/staticAuth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 사용자 정보 로드
    const currentUser = StaticAuthService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);

    // localStorage 변경 감지 (다른 탭에서의 로그인/로그아웃)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'semantle-ko-user') {
        const updatedUser = StaticAuthService.getCurrentUser();
        setUser(updatedUser);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (nickname: string) => {
    const newUser = StaticAuthService.loginWithNickname(nickname);
    setUser(newUser);
    // 강제로 저장소 이벤트 트리거하여 즉시 상태 동기화
    window.dispatchEvent(new StorageEvent('storage', { 
      key: 'semantle-ko-user', 
      newValue: JSON.stringify(newUser),
      storageArea: localStorage
    }));
    return newUser;
  };

  const logout = () => {
    StaticAuthService.logout();
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = StaticAuthService.updateUser(updates);
      setUser(updatedUser);
      return updatedUser;
    }
    return null;
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
  };
}
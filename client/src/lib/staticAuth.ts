import type { User } from "@shared/schema";

export class StaticAuthService {
  private static readonly USER_KEY = 'semantle-ko-user';

  static loginWithNickname(nickname: string): User {
    const user: User = {
      id: crypto.randomUUID(),
      nickname,
      email: null,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      bestScore: 0,
      currentStreak: 0,
      bestStreak: 0,
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    return user;
  }

  static getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      // Date 객체로 변환
      if (user.createdAt) user.createdAt = new Date(user.createdAt);
      if (user.updatedAt) user.updatedAt = new Date(user.updatedAt);
      
      return user;
    } catch (error) {
      console.error('Failed to get user from localStorage:', error);
      return null;
    }
  }

  static logout(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  static updateUser(updates: Partial<User>): User | null {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;

    const updatedUser = {
      ...currentUser,
      ...updates,
      updatedAt: new Date(),
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }

  static updateGameStats(gameWon: boolean, score: number): User | null {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;

    const updates: Partial<User> = {
      gamesPlayed: currentUser.gamesPlayed + 1,
      totalScore: currentUser.totalScore + score,
      bestScore: Math.max(currentUser.bestScore, score),
    };

    if (gameWon) {
      updates.gamesWon = currentUser.gamesWon + 1;
      updates.currentStreak = currentUser.currentStreak + 1;
      updates.bestStreak = Math.max(currentUser.bestStreak || 0, currentUser.currentStreak + 1);
    } else {
      updates.currentStreak = 0;
    }

    return this.updateUser(updates);
  }
}

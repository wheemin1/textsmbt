import { apiRequest } from "./queryClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export interface MatchResult {
  gameId?: string;
  isBot?: boolean;
  opponent?: {
    nickname: string;
  };
  queuePosition?: number;
  estimatedWait?: string;
}

export interface SubmitResult {
  gameId: string;
  round: number;
  myScore: number;
  opponentScore: number;
  myWord: string;
  opponentWord: string;
  roundComplete: boolean;
  gameComplete: boolean;
  winner?: string;
}

export interface GameStatus {
  gameId: string;
  status: string;
  currentRound: number;
  timeRemaining: number;
  rounds: any[];
  myBestScore: number;
  opponentBestScore: number;
  isBot: boolean;
  opponent: {
    nickname: string;
    type: "human" | "bot";
  };
}

export interface WordSuggestions {
  suggestions: string[];
}

export const api = {
  async createUser(nickname: string) {
    const response = await apiRequest("POST", `${API_BASE}/users`, { nickname });
    return response.json();
  },

  async joinQueue(userId: string, language: string = "ko"): Promise<MatchResult> {
    const response = await apiRequest("POST", `${API_BASE}/queue/join`, { userId, language });
    return response.json();
  },

  async submitWord(gameId: string, userId: string, word: string): Promise<SubmitResult> {
    const response = await apiRequest("POST", `${API_BASE}/game/submit`, { gameId, userId, word });
    return response.json();
  },

  async getGameStatus(gameId: string): Promise<GameStatus> {
    const response = await apiRequest("GET", `${API_BASE}/game-status/${gameId}`);
    return response.json();
  },

  async getWordSuggestions(query: string, limit: number = 8): Promise<WordSuggestions> {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    const response = await apiRequest("GET", `${API_BASE}/words/suggest?${params}`);
    return response.json();
  },

  async validateWord(word: string) {
    const response = await apiRequest("POST", `${API_BASE}/words/validate`, { word });
    return response.json();
  }
};

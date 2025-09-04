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

export async function apiRequest(method: string, endpoint: string, body?: any): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for session management
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'NETWORK_ERROR' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  getCurrentUser: async () => {
    try {
      return await apiRequest('GET', '/api/auth/user');
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  logout: async () => {
    await apiRequest('POST', '/api/auth/logout');
  },

  async createUser(nickname: string) {
    return await apiRequest("POST", "/api/users", { nickname });
  },

  async joinQueue(userId: string, language: string = "ko"): Promise<MatchResult> {
    try {
      const response = await apiRequest("POST", `${API_BASE}/queue/join`, { userId, language });
      return response.json();
    } catch (error: any) {
      console.error('Join queue API error:', error);
      throw error;
    }
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
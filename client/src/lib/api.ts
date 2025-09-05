import { apiRequest as makeApiRequest } from "./queryClient";

const API_BASE = import.meta.env.VITE_API_BASE || "";

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

  // Check if response is HTML (likely a redirect or error page)
  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error(`Invalid response type: ${contentType}`);
  }

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
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        return null; // User not authenticated
      }
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
    return await apiRequest("POST", "/api/queue/join", { userId, language });
  },

  async submitWord(gameId: string, userId: string, word: string): Promise<SubmitResult> {
    return await apiRequest("POST", "/api/game/submit", { gameId, userId, word });
  },

  async getGameStatus(gameId: string): Promise<GameStatus> {
    return await apiRequest("GET", `/api/game-status/${gameId}`);
  },

  async getWordSuggestions(query: string, limit: number = 8): Promise<WordSuggestions> {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    return await apiRequest("GET", `/api/words/suggest?${params}`);
  },

  async validateWord(word: string) {
    return await apiRequest("POST", "/api/words/validate", { word });
  },

  async getUserStats(userId: string) {
    return await apiRequest("GET", `/api/users/${userId}/stats`);
  }
};
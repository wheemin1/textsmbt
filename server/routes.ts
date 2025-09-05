import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { gameEngine } from "./services/gameEngine";
import { word2vec } from "./services/word2vecDB"; // New VectorDB service only
import { vectorDB } from "./services/vectorDB"; // Direct VectorDB access
import { similarityStatsService } from "./services/similarityStats";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

// Request validation schemas
const joinQueueSchema = z.object({
  userId: z.string(),
  language: z.string().default("ko")
});

const submitWordSchema = z.object({
  gameId: z.string(),
  userId: z.string(),
  word: z.string().min(1).max(50)
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup authentication
  await setupAuth(app);

  // WebSocket server for real-time game updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const gameConnections = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join_game' && data.gameId) {
          // Add connection to game room
          if (!gameConnections.has(data.gameId)) {
            gameConnections.set(data.gameId, new Set());
          }
          gameConnections.get(data.gameId)!.add(ws);
          
          ws.on('close', () => {
            gameConnections.get(data.gameId)?.delete(ws);
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
  });

  // Broadcast to all clients in a game
  function broadcastToGame(gameId: string, message: any) {
    const connections = gameConnections.get(gameId);
    if (connections) {
      const messageStr = JSON.stringify(message);
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }

  // Health check
  app.get("/api/health", async (req, res) => {
    res.json({ 
      ok: true, 
      serverTime: new Date().toISOString(),
      wordsLoaded: await word2vec.isValidWord("가족")
    });
  });

  // Mock login route for development
  app.post("/api/auth/mock-login", async (req, res) => {
    try {
      const { nickname } = req.body;
      
      if (!nickname || nickname.length < 2) {
        return res.status(400).json({ error: "INVALID_NICKNAME", message: "닉네임은 2글자 이상이어야 합니다" });
      }

      // Create mock user data
      const mockUserId = `mock_${Date.now()}`;
      const mockUser = {
        id: mockUserId,
        nickname: nickname,
        email: `${nickname}@mock.dev`,
        firstName: nickname,
        lastName: "User",
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        bestScore: 0,
        currentStreak: 0,
        bestStreak: 0
      };

      // Store mock user in storage
      await storage.upsertUser(mockUser);

      // Set session
      req.session.user = {
        id: mockUserId,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        profileImageUrl: mockUser.profileImageUrl || undefined,
        accessToken: "mock_token",
        refreshToken: "mock_refresh_token"
      };

      res.json({ message: "Mock login successful", user: mockUser });
    } catch (error) {
      console.error('Mock login error:', error);
      res.status(500).json({ error: "SERVER_ERROR", message: "로그인 중 오류가 발생했습니다" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const userId = req.session.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "로그아웃 중 오류가 발생했습니다" });
      }
      res.json({ message: "로그아웃되었습니다" });
    });
  });

  // Create or get user by nickname (for non-auth users)
  app.post("/api/users", async (req, res) => {
    try {
      const { nickname } = req.body;
      
      if (!nickname || nickname.length < 2) {
        return res.status(400).json({ error: "INVALID_NICKNAME", message: "닉네임은 2글자 이상이어야 합니다" });
      }

      // Try to find existing user
      let user = await storage.getUserByNickname(nickname);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({ nickname });
      }

      res.json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: "SERVER_ERROR", message: "서버 오류가 발생했습니다" });
    }
  });

  // Join matchmaking queue
  app.post("/api/queue/join", async (req, res) => {
    try {
      const validatedData = joinQueueSchema.parse(req.body);
      let { userId, language } = validatedData;

      // First, try to get user from localStorage userId
      let user = await storage.getUser(userId);
      
      // If not found, try session user
      if (!user && req.session.user?.id) {
        userId = req.session.user.id;
        user = await storage.getUser(userId);
      }
      
      // If still not found, return error (user should login first)
      if (!user) {
        return res.status(404).json({ error: "USER_NOT_FOUND", message: "사용자를 찾을 수 없습니다" });
      }

      // Use the actual user ID from database
      const actualUserId = user.id;

      // Remove user from any existing queue
      await storage.removeFromQueue(actualUserId);

      // Look for existing match
      const match = await storage.findQueueMatch(actualUserId, language);
      
      if (match) {
        // Found a match! Create game
        await storage.removeFromQueue(match.userId);
        const game = await gameEngine.createGame(actualUserId, match.userId, false);
        
        res.json({
          gameId: game.id,
          isBot: false,
          opponent: {
            nickname: (await storage.getUser(match.userId))?.nickname || "상대방"
          }
        });
      } else {
        // Add to queue
        await storage.addToQueue({ userId: actualUserId, language });
        
        // For development, immediately create bot game if no match found
        await storage.removeFromQueue(actualUserId);
        const game = await gameEngine.createGame(actualUserId, undefined, true);
        
        res.json({
          gameId: game.id,
          isBot: true,
          opponent: {
            nickname: "AI 봇"
          }
        });
      }
    } catch (error) {
      console.error('Join queue error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "잘못된 요청 데이터" });
      }
      res.status(500).json({ error: "SERVER_ERROR", message: "매칭 중 오류가 발생했습니다" });
    }
  });

  // Submit word for current round
  app.post("/api/game/submit", async (req, res) => {
    try {
      const validatedData = submitWordSchema.parse(req.body);
      const { gameId, userId, word } = validatedData;

      const result = await gameEngine.submitWord(gameId, userId, word);
      
      // Broadcast round result when complete
      if (result.roundComplete) {
        broadcastToGame(gameId, {
          type: 'round_complete',
          result
        });
      }

      res.json(result);
    } catch (error) {
      console.error('Submit word error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "잘못된 요청 데이터" });
      }
      
      const message = error instanceof Error ? error.message : "단어 제출 중 오류가 발생했습니다";
      
      if (message.includes("Invalid word")) {
        return res.status(400).json({ error: "INVALID_WORD", message: "사전에 없는 단어입니다" });
      } else if (message.includes("Already submitted")) {
        return res.status(409).json({ error: "ALREADY_SUBMITTED", message: "이미 이 라운드에 단어를 제출했습니다" });
      } else if (message.includes("already used this word")) {
        return res.status(409).json({ error: "WORD_CONFLICT", message: "상대방이 이미 사용한 단어입니다" });
      } else if (message.includes("previous round")) {
        return res.status(409).json({ error: "WORD_REUSE", message: "이전 라운드에서 사용한 단어는 다시 사용할 수 없습니다" });
      }
      
      res.status(500).json({ error: "SERVER_ERROR", message });
    }
  });

  // Get game status
  app.get("/api/game-status/:gameId", async (req, res) => {
    try {
      const { gameId } = req.params;
      const game = await storage.getGame(gameId);
      
      if (!game) {
        // Return dummy state instead of 404 to prevent client errors
        return res.json({
          gameId,
          status: "not_found",
          currentRound: 1,
          timeRemaining: 0,
          rounds: [],
          myBestScore: 0,
          opponentBestScore: 0
        });
      }

      const submissions = await storage.getGameSubmissions(gameId);
      const rounds = Array.isArray(game.rounds) ? game.rounds : [];
      
      // Calculate best scores
      const myScores = submissions
        .filter(s => s.userId === game.player1Id)
        .map(s => s.score);
      const opponentScores = submissions
        .filter(s => s.userId === game.player2Id || s.userId === "bot")
        .map(s => s.score);

      res.json({
        gameId,
        status: game.status,
        currentRound: game.currentRound,
        timeRemaining: 15, // TODO: Calculate actual remaining time
        rounds,
        myBestScore: myScores.length > 0 ? Math.max(...myScores) : 0,
        opponentBestScore: opponentScores.length > 0 ? Math.max(...opponentScores) : 0,
        isBot: game.isBot,
        opponent: {
          nickname: game.isBot ? "AI 봇" : "상대방", // TODO: Get actual opponent nickname
          type: game.isBot ? "bot" : "human"
        }
      });
    } catch (error) {
      console.error('Get game status error:', error);
      res.status(500).json({ error: "SERVER_ERROR", message: "게임 상태 조회 중 오류가 발생했습니다" });
    }
  });

  // ============ NEW: VectorDB 기반 API 엔드포인트들 ============
  
  // VectorDB 시스템 상태 확인
  app.get("/api/vectordb/status", async (req, res) => {
    try {
      const systemInfo = await word2vec.getSystemInfo();
      
      res.json({
        ...systemInfo,
        message: systemInfo.hasRealVectors 
          ? "✅ VectorDB 시스템 정상 작동 중 (실제 FastText 벡터 사용)"
          : "⚠️ Fallback 모드 (패턴 기반 유사도 계산)",
        recommendation: systemInfo.hasRealVectors 
          ? null 
          : "더 정확한 유사도 계산을 위해 'node scripts/initVectorDB.mjs' 실행을 권장합니다"
      });
    } catch (error) {
      console.error('VectorDB status error:', error);
      res.status(500).json({ error: "SERVER_ERROR", message: "VectorDB 상태 확인 중 오류가 발생했습니다" });
    }
  });

  // VectorDB 직접 유사도 계산 (고급 사용자용)
  app.post("/api/vectordb/similarity", async (req, res) => {
    try {
      const { word1, word2 } = req.body;
      
      if (!word1 || !word2) {
        return res.status(400).json({ 
          error: "MISSING_WORDS", 
          message: "word1과 word2 파라미터가 필요합니다" 
        });
      }

      // VectorDB 직접 계산
      const directSimilarity = await vectorDB.calculateSimilarity(word1, word2);
      
      // 기존 시스템과 비교
      const fallbackSimilarity = await word2vec.calculateSimilarity(word1, word2);
      
      // 단어 벡터 존재 여부 확인
      const word1Vector = await vectorDB.getWordVector(word1);
      const word2Vector = await vectorDB.getWordVector(word2);
      
      res.json({
        word1,
        word2,
        directSimilarity: Math.round(directSimilarity),
        fallbackSimilarity: Math.round(fallbackSimilarity),
        hasRealVectors: !!(word1Vector && word2Vector),
        vectorDimensions: word1Vector ? word1Vector.length : null,
        method: (word1Vector && word2Vector) ? "FastText 벡터" : "패턴 매칭"
      });
    } catch (error) {
      console.error('VectorDB similarity error:', error);
      res.status(500).json({ error: "SERVER_ERROR", message: "유사도 계산 중 오류가 발생했습니다" });
    }
  });

  // 단어와 가장 유사한 상위 N개 단어 조회 (Semantle-ko 스타일)
  app.get("/api/vectordb/similar/:word", async (req, res) => {
    try {
      const { word } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      
      if (!word) {
        return res.status(400).json({ error: "MISSING_WORD", message: "단어가 필요합니다" });
      }

      // VectorDB에서 유사 단어 조회
      const similarWords = await word2vec.getSimilarWords(word, limit);
      
      // 각 단어의 정확한 유사도 계산
      const wordsWithScores = [];
      for (const similarWord of similarWords) {
        const similarity = await word2vec.calculateSimilarity(word, similarWord);
        wordsWithScores.push({
          word: similarWord,
          similarity: Math.round(similarity),
          rank: wordsWithScores.length + 1
        });
      }

      res.json({
        targetWord: word,
        similarWords: wordsWithScores,
        totalFound: wordsWithScores.length,
        method: word2vec.getSystemInfo().hasRealVectors ? "VectorDB" : "패턴 매칭"
      });
    } catch (error) {
      console.error('Get similar words error:', error);
      res.status(500).json({ error: "SERVER_ERROR", message: "유사 단어 조회 중 오류가 발생했습니다" });
    }
  });

  // 단어 벡터 직접 조회 (개발/디버깅용)
  app.get("/api/vectordb/vector/:word", async (req, res) => {
    try {
      const { word } = req.params;
      
      if (!word) {
        return res.status(400).json({ error: "MISSING_WORD", message: "단어가 필요합니다" });
      }

      const vector = await vectorDB.getWordVector(word);
      const isValid = await word2vec.isValidWord(word);
      
      res.json({
        word,
        hasVector: !!vector,
        isValidWord: isValid,
        vectorLength: vector ? vector.length : 0,
        vectorPreview: vector ? vector.slice(0, 10) : null, // 처음 10개 차원만 미리보기
      });
    } catch (error) {
      console.error('Get word vector error:', error);
      res.status(500).json({ error: "SERVER_ERROR", message: "단어 벡터 조회 중 오류가 발생했습니다" });
    }
  });

  // ============ 기존 API 엔드포인트들 ============
  app.get("/api/words/suggest", (req, res) => {
    try {
      const { q, limit } = req.query;
      const query = (q as string) || "";
      const maxResults = Math.min(parseInt(limit as string) || 8, 20);
      
      const suggestions = word2vec.getFallbackSimilarWords(query, maxResults);
      res.json({ suggestions });
    } catch (error) {
      console.error('Word suggestions error:', error);
      res.status(500).json({ error: "SERVER_ERROR", message: "단어 검색 중 오류가 발생했습니다" });
    }
  });

  // Validate word endpoint
  app.post("/api/words/validate", async (req, res) => {
    try {
      const { word } = req.body;
      
      if (!word) {
        return res.status(400).json({ error: "MISSING_WORD", message: "단어를 입력해주세요" });
      }

      const isValid = await word2vec.isValidWord(word);
      res.json({ 
        isValid,
        word,
        message: isValid ? "유효한 단어입니다" : "사전에 없는 단어입니다"
      });
    } catch (error) {
      console.error('Word validation error:', error);
      res.status(500).json({ error: "SERVER_ERROR", message: "단어 검증 중 오류가 발생했습니다" });
    }
  });

  // Get user statistics
  app.get("/api/users/:userId/stats", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "USER_NOT_FOUND", message: "사용자를 찾을 수 없습니다" });
      }

      // Calculate win rate
      const winRate = user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0;
      const lossCount = user.gamesPlayed - user.gamesWon;

      res.json({
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        gamesLost: lossCount,
        winRate,
        bestScore: user.bestScore,
        totalScore: user.totalScore,
        currentStreak: user.currentStreak,
        bestStreak: user.bestStreak,
        averageScore: user.gamesPlayed > 0 ? Math.round(user.totalScore / user.gamesPlayed) : 0
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: "SERVER_ERROR", message: "통계 조회 중 오류가 발생했습니다" });
    }
  });

  // Get similarity statistics for a game
  app.get("/api/game/:gameId/stats", async (req, res) => {
    try {
      const { gameId } = req.params;
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "GAME_NOT_FOUND", message: "게임을 찾을 수 없습니다" });
      }

      // Get the target word for this game
      const targetWord = gameEngine.getTargetWordForDebug(gameId, game.currentRound);
      
      if (!targetWord || targetWord === "Hidden in production") {
        return res.status(403).json({ error: "STATS_UNAVAILABLE", message: "통계를 사용할 수 없습니다" });
      }

      // Get similarity statistics
      const stats = await similarityStatsService.calculateStats(targetWord);
      
      res.json({
        targetWord: stats.targetWord,
        maxSimilarity: stats.maxSimilarity,
        rank10Similarity: stats.rank10Similarity,
        rank100Similarity: stats.rank100Similarity,
        rank1000Similarity: stats.rank1000Similarity,
        totalWords: stats.totalWords,
        message: `정답 단어와 가장 유사한 단어의 유사도는 ${stats.maxSimilarity} 입니다.`,
        details: [
          `10번째로 유사한 단어의 유사도는 ${stats.rank10Similarity}이고`,
          stats.rank100Similarity ? `100번째로 유사한 단어의 유사도는 ${stats.rank100Similarity}이고` : null,
          stats.rank1000Similarity ? `1,000번째로 유사한 단어의 유사도는 ${stats.rank1000Similarity} 입니다.` : null
        ].filter(Boolean).join(', ') + '.'
      });
    } catch (error) {
      console.error('Get game stats error:', error);
      res.status(500).json({ error: "SERVER_ERROR", message: "게임 통계 조회 중 오류가 발생했습니다" });
    }
  });

  // Get word rank for a specific word in a game
  app.get("/api/game/:gameId/word/:word/rank", async (req, res) => {
    try {
      const { gameId, word } = req.params;
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "GAME_NOT_FOUND", message: "게임을 찾을 수 없습니다" });
      }

      const targetWord = gameEngine.getTargetWordForDebug(gameId, game.currentRound);
      
      if (!targetWord || targetWord === "Hidden in production") {
        return res.status(403).json({ error: "STATS_UNAVAILABLE", message: "통계를 사용할 수 없습니다" });
      }

      // Get word rank
      const rank = await similarityStatsService.getWordRank(targetWord, word);
      
      if (rank === null) {
        return res.status(404).json({ error: "WORD_NOT_FOUND", message: "단어의 순위를 계산할 수 없습니다" });
      }

      res.json({
        word,
        targetWord,
        rank,
        message: `"${word}"는 "${targetWord}"와의 유사도 순위 ${rank}번째 입니다.`
      });
    } catch (error) {
      console.error('Get word rank error:', error);
      res.status(500).json({ error: "SERVER_ERROR", message: "단어 순위 조회 중 오류가 발생했습니다" });
    }
  });

  // Calculate similarity between two words
  app.post("/api/words/similarity", async (req, res) => {
    try {
      const { word1, word2 } = req.body;
      
      if (!word1 || !word2) {
        return res.status(400).json({ error: "MISSING_WORDS", message: "두 단어를 모두 입력해주세요" });
      }

      const result = await word2vec.calculateSimilarity(word1, word2);
      
      res.json({
        word1,
        word2,
        similarity: result.similarity,
        rank: result.rank
      });
    } catch (error) {
      console.error('Calculate similarity error:', error);
      res.status(500).json({ error: "SERVER_ERROR", message: "유사도 계산 중 오류가 발생했습니다" });
    }
  });

  return httpServer;
}

import { type Game, type GameSubmission, type RoundData } from "@shared/schema";
import { storage } from "../storage";
import { word2vecService } from "./word2vec";
import { botPlayer } from "./botPlayer";
import { similarityStatsService } from "./similarityStats";

interface RoundResult {
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

class GameEngine {
  private roundTimers: Map<string, NodeJS.Timeout> = new Map();
  
  async submitWord(gameId: string, userId: string, word: string): Promise<RoundResult> {
    const game = await storage.getGame(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "active") {
      throw new Error("Game is not active");
    }

    // Validate word
    if (!word2vecService.isValidWord(word)) {
      throw new Error("Invalid word");
    }

    // Check for duplicate submission in same round
    const existingSubmissions = await storage.getSubmissionsByRound(gameId, game.currentRound);
    const userSubmission = existingSubmissions.find(s => s.userId === userId);
    if (userSubmission) {
      throw new Error("Already submitted for this round");
    }

    // Check if opponent already used this word in current round
    const opponentSubmission = existingSubmissions.find(s => s.userId !== userId);
    if (opponentSubmission && opponentSubmission.word === word) {
      throw new Error("Opponent already used this word");
    }

    // Check if user used this word in previous round
    if (game.currentRound > 1) {
      const prevSubmissions = await storage.getSubmissionsByRound(gameId, game.currentRound - 1);
      const userPrevSubmission = prevSubmissions.find(s => s.userId === userId);
      if (userPrevSubmission && userPrevSubmission.word === word) {
        throw new Error("Cannot reuse word from previous round");
      }
    }

    // Calculate score using semantic similarity
    // TODO: In production, use target word for the day/round
    const targetWord = this.getTargetWord(gameId, game.currentRound);
    const similarityResult = await word2vecService.calculateSimilarity(word, targetWord);
    const score = similarityResult.similarity;

    console.log(`🎯 GameEngine: "${word}" vs "${targetWord}" = ${score}점 (similarityResult:`, similarityResult, `)`);
    
    // Validate score
    if (typeof score !== 'number' || isNaN(score)) {
      console.error(`❌ Invalid score: ${score} for word "${word}" vs "${targetWord}"`);
      throw new Error("Failed to calculate similarity score");
    }

    // Create submission
    const submission = await storage.createSubmission({
      gameId,
      userId,
      round: game.currentRound,
      word,
      score
    });

    console.log(`💾 Created submission:`, submission);

    // Handle bot response if playing against bot
    if (game.isBot && game.player2Id === "bot") {
      setTimeout(async () => {
        await this.handleBotSubmission(gameId, game.currentRound, targetWord);
      }, Math.random() * 600 + 600); // 0.6-1.2s delay
    }

    // Check if someone got 100 points (perfect match) - immediate win
    if (score >= 100) {
      // Mark game as complete immediately
      await storage.updateGame(gameId, {
        status: "completed",
        winnerId: userId
      });

      return {
        gameId,
        round: game.currentRound,
        myScore: score,
        opponentScore: 0,
        myWord: word,
        opponentWord: "",
        roundComplete: true,
        gameComplete: true,
        winner: userId
      };
    }

    // Check if round is complete
    const roundSubmissions = await storage.getSubmissionsByRound(gameId, game.currentRound);
    
    if (roundSubmissions.length === 2 || (game.isBot && roundSubmissions.length === 1)) {
      return await this.completeRound(gameId, game.currentRound);
    }

    // Return partial result (waiting for opponent)
    const partialResult = {
      gameId,
      round: game.currentRound,
      myScore: score,
      opponentScore: 0,
      myWord: word,
      opponentWord: "",
      roundComplete: false,
      gameComplete: false
    };
    
    console.log(`🎮 Returning partial result:`, partialResult);
    return partialResult;
  }

  private async handleBotSubmission(gameId: string, round: number, targetWord: string): Promise<void> {
    const botWord = await botPlayer.selectWord(targetWord, "normal");
    const similarityResult = await word2vecService.calculateSimilarity(botWord, targetWord);
    
    await storage.createSubmission({
      gameId,
      userId: "bot",
      round,
      word: botWord,
      score: similarityResult.similarity
    });

    // Check if bot got 100 points - immediate win
    if (similarityResult.similarity >= 100) {
      await storage.updateGame(gameId, {
        status: "completed",
        winnerId: "bot"
      });
      return;
    }

    // Complete the round
    await this.completeRound(gameId, round);
  }

  private async completeRound(gameId: string, round: number): Promise<RoundResult> {
    const game = await storage.getGame(gameId);
    if (!game) throw new Error("Game not found");

    const submissions = await storage.getSubmissionsByRound(gameId, round);
    const player1Sub = submissions.find(s => s.userId === game.player1Id);
    const player2Sub = submissions.find(s => s.userId === game.player2Id || s.userId === "bot");

    // Clear round timer
    const timerKey = `${gameId}-${round}`;
    const timer = this.roundTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      this.roundTimers.delete(timerKey);
    }

    // Update game rounds
    const rounds = Array.isArray(game.rounds) ? [...game.rounds] : [];
    const roundData: RoundData = {
      round,
      player1Word: player1Sub?.word,
      player1Score: player1Sub?.score,
      player2Word: player2Sub?.word,
      player2Score: player2Sub?.score,
      completed: true,
      completedAt: new Date().toISOString()
    };
    rounds[round - 1] = roundData;

    // Check if game is complete
    const gameComplete = round === 5;
    let winnerId: string | undefined;
    
    if (gameComplete) {
      winnerId = this.determineWinner(rounds, game.player1Id, game.player2Id || "bot");
    }

    // Update game state
    await storage.updateGame(gameId, {
      rounds,
      currentRound: gameComplete ? round : round + 1,
      status: gameComplete ? "completed" : "active",
      winnerId
    });

    // Start next round timer if game continues
    if (!gameComplete) {
      this.startRoundTimer(gameId, round + 1);
    }

    return {
      gameId,
      round,
      myScore: player1Sub?.score || 0,
      opponentScore: player2Sub?.score || 0,
      myWord: player1Sub?.word || "",
      opponentWord: player2Sub?.word || "",
      roundComplete: true,
      gameComplete,
      winner: winnerId
    };
  }

  private determineWinner(rounds: RoundData[], player1Id: string, player2Id: string): string | undefined {
    // Calculate highest score for each player across all rounds
    const player1HighestScore = rounds.reduce((max, round) => {
      return Math.max(max, round.player1Score || 0);
    }, 0);
    
    const player2HighestScore = rounds.reduce((max, round) => {
      return Math.max(max, round.player2Score || 0);
    }, 0);
    
    if (player1HighestScore > player2HighestScore) return player1Id;
    if (player2HighestScore > player1HighestScore) return player2Id;
    
    return undefined; // Tie
  }

  startRoundTimer(gameId: string, round: number): void {
    const timerKey = `${gameId}-${round}`;
    
    const timer = setTimeout(async () => {
      // Handle round timeout - submit 0 scores for missing submissions
      const submissions = await storage.getSubmissionsByRound(gameId, round);
      const game = await storage.getGame(gameId);
      
      if (!game || submissions.length === 2) return;

      // Create timeout submissions for missing players
      if (submissions.length === 0) {
        // Both players timed out
        await Promise.all([
          storage.createSubmission({
            gameId,
            userId: game.player1Id,
            round,
            word: "",
            score: 0
          }),
          storage.createSubmission({
            gameId,
            userId: game.player2Id || "bot",
            round,
            word: "",
            score: 0
          })
        ]);
      } else if (submissions.length === 1) {
        // One player timed out
        const existingUserId = submissions[0].userId;
        const missingUserId = existingUserId === game.player1Id ? 
          (game.player2Id || "bot") : game.player1Id;
        
        await storage.createSubmission({
          gameId,
          userId: missingUserId,
          round,
          word: "",
          score: 0
        });
      }

      // Complete the round
      await this.completeRound(gameId, round);
      this.roundTimers.delete(timerKey);
    }, 15000); // 15 second timeout

    this.roundTimers.set(timerKey, timer);
  }

  private getTargetWord(gameId: string, round: number): string {
    // TODO: Implement daily target word system like Semantle-ko
    // For now, return a fixed target word per game (not per round)
    const words = ['가족', '학교', '음식', '친구', '사랑', '집', '시간', '마음', '행복', '꿈'];
    return words[gameId.length % words.length];
  }

  // 개발 모드에서 목표 단어를 노출하는 공개 메서드
  getTargetWordForDebug(gameId: string, round: number): string {
    console.log(`🔍 Debug: gameId=${gameId}, round=${round}, NODE_ENV=${process.env.NODE_ENV}`);
    if (process.env.NODE_ENV !== 'development') {
      return 'Hidden in production';
    }
    const targetWord = this.getTargetWord(gameId, round);
    console.log(`🔍 Debug: calculated targetWord="${targetWord}"`);
    
    // 유효한 단어인지 확인
    if (!targetWord || targetWord === "없음" || targetWord.trim() === "") {
      console.warn(`⚠️ Invalid target word: "${targetWord}", using fallback`);
      return '시간'; // 기본 대체 단어
    }
    
    return targetWord;
  }

  async createGame(player1Id: string, player2Id?: string, isBot: boolean = false): Promise<Game> {
    // Pre-calculate target word for first round
    const tempGameId = Math.random().toString(36);
    const targetWord = this.getTargetWord(tempGameId, 1);
    
    const game = await storage.createGame({
      player1Id,
      player2Id: isBot ? "bot" : player2Id,
      isBot,
      botDifficulty: isBot ? "normal" : undefined,
      status: "active",
      currentRound: 1,
      rounds: [{
        round: 1,
        targetWord: targetWord,
        submissions: [],
        timeStarted: Date.now(),
        timeEnded: null
      }]
    });

    // Start first round timer
    this.startRoundTimer(game.id, 1);

    // Pre-calculate similarity stats for the target word
    // Use actual game.id for target word calculation
    const actualTargetWord = this.getTargetWord(game.id, 1);
    similarityStatsService.preCalculateStats(actualTargetWord).catch(error => {
      console.warn(`Failed to pre-calculate stats for "${actualTargetWord}":`, error);
    });

    // Update the round with correct target word if needed
    if (actualTargetWord !== targetWord) {
      game.rounds[0].targetWord = actualTargetWord;
      await storage.updateGame(game.id, { rounds: game.rounds });
    }

    return game;
  }
}

export const gameEngine = new GameEngine();

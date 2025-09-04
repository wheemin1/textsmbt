import { type User, type Game, type GameSubmission, type MatchmakingEntry, type InsertUser, type InsertGame, type InsertGameSubmission, type InsertMatchmaking } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByNickname(nickname: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Games
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined>;
  
  // Game submissions
  getGameSubmissions(gameId: string): Promise<GameSubmission[]>;
  createSubmission(submission: InsertGameSubmission): Promise<GameSubmission>;
  getSubmissionsByRound(gameId: string, round: number): Promise<GameSubmission[]>;
  
  // Matchmaking
  addToQueue(entry: InsertMatchmaking): Promise<MatchmakingEntry>;
  findQueueMatch(userId: string, language: string): Promise<MatchmakingEntry | undefined>;
  removeFromQueue(userId: string): Promise<void>;
  getQueuePosition(userId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private games: Map<string, Game>;
  private submissions: Map<string, GameSubmission>;
  private queue: Map<string, MatchmakingEntry>;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.submissions = new Map();
    this.queue = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByNickname(nickname: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.nickname === nickname,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async getGame(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = randomUUID();
    const now = new Date();
    const game: Game = { 
      ...insertGame,
      id, 
      createdAt: now,
      updatedAt: now,
      status: insertGame.status || 'waiting',
      player2Id: insertGame.player2Id || null,
      isBot: insertGame.isBot || false,
      botDifficulty: insertGame.botDifficulty || null,
      currentRound: insertGame.currentRound || 1,
      rounds: insertGame.rounds || [],
      winnerId: insertGame.winnerId || null
    };
    this.games.set(id, game);
    return game;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { 
      ...game, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async getGameSubmissions(gameId: string): Promise<GameSubmission[]> {
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.gameId === gameId
    );
  }

  async createSubmission(insertSubmission: InsertGameSubmission): Promise<GameSubmission> {
    const id = randomUUID();
    const submission: GameSubmission = { 
      ...insertSubmission, 
      id,
      submittedAt: new Date() 
    };
    this.submissions.set(id, submission);
    return submission;
  }

  async getSubmissionsByRound(gameId: string, round: number): Promise<GameSubmission[]> {
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.gameId === gameId && submission.round === round
    );
  }

  async addToQueue(insertEntry: InsertMatchmaking): Promise<MatchmakingEntry> {
    const id = randomUUID();
    const entry: MatchmakingEntry = { 
      ...insertEntry, 
      id,
      createdAt: new Date(),
      language: insertEntry.language || 'ko'
    };
    this.queue.set(id, entry);
    return entry;
  }

  async findQueueMatch(userId: string, language: string): Promise<MatchmakingEntry | undefined> {
    return Array.from(this.queue.values()).find(
      (entry) => entry.userId !== userId && entry.language === language
    );
  }

  async removeFromQueue(userId: string): Promise<void> {
    for (const [id, entry] of this.queue.entries()) {
      if (entry.userId === userId) {
        this.queue.delete(id);
        break;
      }
    }
  }

  async getQueuePosition(userId: string): Promise<number> {
    const entries = Array.from(this.queue.values())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return entries.findIndex(entry => entry.userId === userId) + 1;
  }
}

export const storage = new MemStorage();

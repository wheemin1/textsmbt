import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nickname: varchar("nickname", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  player1Id: varchar("player1_id").references(() => users.id).notNull(),
  player2Id: varchar("player2_id").references(() => users.id),
  isBot: boolean("is_bot").default(false).notNull(),
  botDifficulty: varchar("bot_difficulty", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("waiting"), // waiting, active, completed
  currentRound: integer("current_round").default(1).notNull(),
  rounds: jsonb("rounds").default([]).notNull(), // Array of round data
  winnerId: varchar("winner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const gameSubmissions = pgTable("game_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").references(() => games.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  round: integer("round").notNull(),
  word: varchar("word", { length: 50 }).notNull(),
  score: integer("score").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const matchmakingQueue = pgTable("matchmaking_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  language: varchar("language", { length: 10 }).default("ko").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameSubmissionSchema = createInsertSchema(gameSubmissions).omit({
  id: true,
  submittedAt: true,
});

export const insertMatchmakingSchema = createInsertSchema(matchmakingQueue).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type GameSubmission = typeof gameSubmissions.$inferSelect;
export type MatchmakingEntry = typeof matchmakingQueue.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertGameSubmission = z.infer<typeof insertGameSubmissionSchema>;
export type InsertMatchmaking = z.infer<typeof insertMatchmakingSchema>;

// Game state types
export interface RoundData {
  round: number;
  player1Word?: string;
  player1Score?: number;
  player2Word?: string;
  player2Score?: number;
  completed: boolean;
  completedAt?: string;
}

export interface GameState {
  gameId: string;
  currentRound: number;
  timeRemaining: number;
  isBot: boolean;
  opponent: {
    nickname: string;
    type: "human" | "bot";
  };
  rounds: RoundData[];
  myBestScore: number;
  opponentBestScore: number;
  status: "waiting" | "active" | "completed";
  winnerId?: string;
}

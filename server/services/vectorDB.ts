import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

interface WordVector {
  word: string;
  vector: number[];
  similarity?: number;
}

export class VectorDB {
  private db: Database | null = null;
  private readonly dbPath = path.join(process.cwd(), 'data', 'vectors.db');

  async initialize(): Promise<void> {
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    // 벡터 저장 테이블 생성
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS word_vectors (
        word TEXT PRIMARY KEY,
        vector BLOB NOT NULL,
        frequency INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 인덱스 생성 (빠른 검색용)
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_word_frequency ON word_vectors(frequency DESC);
    `);

    console.log('VectorDB initialized successfully');
  }

  async loadFastTextVectors(vecFilePath: string, targetWords?: string[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fileStream = fs.createReadStream(vecFilePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let lineCount = 0;
    let insertedCount = 0;
    const batchSize = 1000;
    let batch: { word: string; vectorBuffer: Buffer }[] = [];

    console.log('Loading FastText vectors into database...');

    for await (const line of rl) {
      if (lineCount === 0) {
        lineCount++;
        continue; // 첫 번째 라인은 메타데이터
      }

      const parts = line.trim().split(' ');
      const word = parts[0];
      
      // 한국어 단어만 필터링
      if (!this.isKoreanWord(word)) continue;
      
      // 특정 단어 리스트가 있으면 해당 단어만 로딩
      if (targetWords && !targetWords.includes(word)) continue;

      const vector = parts.slice(1).map(x => parseFloat(x));
      if (vector.length !== 300) continue; // FastText는 300차원

      // numpy array를 Buffer로 직렬화 (Semantle-ko 방식)
      const vectorBuffer = this.serializeVector(vector);
      
      batch.push({ word, vectorBuffer });

      if (batch.length >= batchSize) {
        await this.insertBatch(batch);
        insertedCount += batch.length;
        batch = [];
        console.log(`Inserted ${insertedCount} vectors...`);
      }

      lineCount++;
    }

    // 마지막 배치 처리
    if (batch.length > 0) {
      await this.insertBatch(batch);
      insertedCount += batch.length;
    }

    console.log(`Total vectors loaded: ${insertedCount}`);
  }

  private async insertBatch(batch: { word: string; vectorBuffer: Buffer }[]): Promise<void> {
    if (!this.db) return;

    const stmt = await this.db.prepare(`
      INSERT OR REPLACE INTO word_vectors (word, vector) VALUES (?, ?)
    `);

    for (const { word, vectorBuffer } of batch) {
      await stmt.run(word, vectorBuffer);
    }

    await stmt.finalize();
  }

  async getWordVector(word: string): Promise<number[] | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.get(
      'SELECT vector FROM word_vectors WHERE word = ?',
      word
    );

    if (!result) return null;
    return this.deserializeVector(result.vector);
  }

  async calculateSimilarity(word1: string, word2: string): Promise<number> {
    const vector1 = await this.getWordVector(word1);
    const vector2 = await this.getWordVector(word2);

    if (!vector1 || !vector2) return 0;

    return this.cosineSimilarity(vector1, vector2);
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (magnitude === 0) return 0;

    const similarity = dotProduct / magnitude;
    
    // Semantle-ko 스타일 점수 변환 (0-100 범위)
    return Math.min(100, Math.max(0, (similarity + 0.15) * 120));
  }

  private serializeVector(vector: number[]): Buffer {
    // Float64Array로 변환 후 Buffer로 직렬화
    const float64Array = new Float64Array(vector);
    return Buffer.from(float64Array.buffer);
  }

  private deserializeVector(buffer: Buffer): number[] {
    // Buffer에서 Float64Array로 복원 후 배열로 변환
    const float64Array = new Float64Array(buffer.buffer, buffer.byteOffset, buffer.length / 8);
    return Array.from(float64Array);
  }

  private isKoreanWord(word: string): boolean {
    return /^[가-힣]+$/.test(word);
  }

  async getTopSimilarWords(targetWord: string, limit: number = 100): Promise<WordVector[]> {
    if (!this.db) throw new Error('Database not initialized');

    const targetVector = await this.getWordVector(targetWord);
    if (!targetVector) return [];

    // 모든 단어에 대해 유사도 계산 (실제로는 인덱스 기반 최적화 필요)
    const stmt = await this.db.prepare('SELECT word, vector FROM word_vectors LIMIT 10000');
    const results = [];

    while (true) {
      const row = await stmt.get();
      if (!row) break;

      if (row.word === targetWord) continue;

      const vector = this.deserializeVector(row.vector);
      const similarity = this.cosineSimilarity(targetVector, vector);
      
      results.push({
        word: row.word,
        vector,
        similarity
      });
    }

    await stmt.finalize();

    return results
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export const vectorDB = new VectorDB();

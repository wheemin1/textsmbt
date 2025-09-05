#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const FASTTEXT_FILE = path.join(process.cwd(), 'data', 'fasttext', 'cc.ko.300.vec');
const LARGE_KOREAN_WORDS_FILE = path.join(process.cwd(), 'data', 'korean_words_large.txt');
const DB_PATH = path.join(process.cwd(), 'data', 'vectors.db');

// Direct VectorDB implementation for large-scale initialization
class LargeVectorDB {
  constructor() {
    this.db = null;
  }

  async initialize() {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    // Drop existing table and recreate
    await this.db.exec(`DROP TABLE IF EXISTS word_vectors`);
    
    // 벡터 저장 테이블 생성
    await this.db.exec(`
      CREATE TABLE word_vectors (
        word TEXT PRIMARY KEY,
        vector BLOB NOT NULL,
        frequency INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 인덱스 생성 (빠른 검색용)
    await this.db.exec(`
      CREATE INDEX idx_word_frequency ON word_vectors(frequency DESC);
    `);

    console.log('✅ Large VectorDB initialized successfully');
  }

  async loadLargeKoreanWords(vecFilePath, targetWords) {
    if (!this.db) throw new Error('Database not initialized');

    const fileStream = fs.createReadStream(vecFilePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let lineCount = 0;
    let insertedCount = 0;
    const batchSize = 2000;
    let batch = [];
    const targetWordsSet = new Set(targetWords); // 빠른 검색을 위한 Set

    console.log('📥 Loading large Korean FastText vectors...');
    console.log(`🎯 Target words: ${targetWords.length}`);

    for await (const line of rl) {
      if (lineCount === 0) {
        lineCount++;
        continue; // 첫 번째 라인은 메타데이터
      }

      const parts = line.trim().split(' ');
      const word = parts[0];
      
      // 한국어 단어만 필터링
      if (!this.isKoreanWord(word)) continue;
      
      // 대용량 타겟 단어 리스트 확인
      if (!targetWordsSet.has(word)) continue;

      const vector = parts.slice(1).map(x => parseFloat(x));
      if (vector.length !== 300) continue; // FastText는 300차원

      // numpy array를 Buffer로 직렬화
      const vectorBuffer = this.serializeVector(vector);
      
      batch.push({ word, vectorBuffer });

      if (batch.length >= batchSize) {
        await this.insertBatch(batch);
        insertedCount += batch.length;
        batch = [];
        console.log(`📊 Inserted ${insertedCount} vectors... (${(insertedCount/targetWords.length*100).toFixed(1)}%)`);
      }

      lineCount++;
    }

    // 마지막 배치 처리
    if (batch.length > 0) {
      await this.insertBatch(batch);
      insertedCount += batch.length;
    }

    console.log(`✅ Total vectors loaded: ${insertedCount}`);
    return insertedCount;
  }

  async insertBatch(batch) {
    if (!this.db) return;

    const stmt = await this.db.prepare(`
      INSERT OR REPLACE INTO word_vectors (word, vector) VALUES (?, ?)
    `);

    for (const { word, vectorBuffer } of batch) {
      await stmt.run(word, vectorBuffer);
    }

    await stmt.finalize();
  }

  serializeVector(vector) {
    // Float64Array로 변환 후 Buffer로 직렬화
    const float64Array = new Float64Array(vector);
    return Buffer.from(float64Array.buffer);
  }

  isKoreanWord(word) {
    return /^[가-힣]+$/.test(word);
  }

  async getWordVector(word) {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.get(
      'SELECT vector FROM word_vectors WHERE word = ?',
      word
    );

    if (!result) return null;
    
    // Buffer에서 Float64Array로 복원 후 배열로 변환
    const float64Array = new Float64Array(result.vector.buffer, result.vector.byteOffset, result.vector.length / 8);
    return Array.from(float64Array);
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

async function initializeLargeDatabase() {
  console.log('🚀 Starting LARGE VectorDB initialization...');
  
  const vectorDB = new LargeVectorDB();
  
  try {
    // 1. 데이터베이스 초기화
    await vectorDB.initialize();
    console.log('✅ Database initialized');

    // 2. 대용량 한국어 단어 리스트 로드 (10,000개)
    let targetWords = [];
    
    if (fs.existsSync(LARGE_KOREAN_WORDS_FILE)) {
      const largeWords = fs.readFileSync(LARGE_KOREAN_WORDS_FILE, 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(word => word.length > 0);
      targetWords = largeWords;
      console.log(`📚 Loaded ${targetWords.length} large Korean words`);
    } else {
      console.log('❌ Large Korean words file not found');
      process.exit(1);
    }

    // 3. FastText 벡터 파일이 있는지 확인
    if (!fs.existsSync(FASTTEXT_FILE)) {
      console.log('⚠️  FastText file not found at:', FASTTEXT_FILE);
      console.log('💡 Run: npm run setup:fasttext first');
      process.exit(1);
    }

    // 4. 벡터 데이터를 DB에 로드
    console.log('📥 Loading LARGE FastText vectors into database...');
    console.log('⏳ This may take 10-15 minutes for 10,000 words...');
    
    const insertedCount = await vectorDB.loadLargeKoreanWords(FASTTEXT_FILE, targetWords);
    
    // 5. 테스트 쿼리 실행
    console.log('🧪 Running test queries...');
    
    const testWords = ['자연', '나무', '산', '바다', '사람', '음식', '학교', '사랑', '행복'];
    for (const word of testWords) {
      const vector = await vectorDB.getWordVector(word);
      if (vector) {
        console.log(`✅ ${word}: vector loaded (${vector.length} dimensions)`);
        
        // 다른 단어와의 유사도 테스트
        if (word !== '자연') {
          const vector1 = await vectorDB.getWordVector('자연');
          if (vector1) {
            const similarity = cosineSimilarity(vector1, vector);
            const score = Math.min(100, Math.max(0, (similarity + 0.15) * 120));
            console.log(`   🔗 Similarity to '자연': ${score.toFixed(2)}`);
          }
        }
      } else {
        console.log(`❌ ${word}: vector not found`);
      }
    }

    console.log('✅ LARGE VectorDB initialization completed successfully!');
    console.log('🎮 You now have access to a massive Korean word database');
    console.log(`📊 Database location: ${DB_PATH}`);
    console.log(`📦 Total vectors: ${insertedCount}`);
    console.log(`🚀 Coverage: ${(insertedCount/targetWords.length*100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  } finally {
    await vectorDB.close();
  }
}

function cosineSimilarity(vec1, vec2) {
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

  return dotProduct / magnitude;
}

// CLI 실행
initializeLargeDatabase().catch(console.error);

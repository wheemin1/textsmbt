#!/usr/bin/env node

import { vectorDB } from '../server/services/vectorDB.js';
import fs from 'fs';
import path from 'path';

const FASTTEXT_FILE = path.join(process.cwd(), 'cc.ko.300.vec');
const KOREAN_WORDS_FILE = path.join(process.cwd(), 'data', 'korean_words.txt');
const FREQUENT_WORDS_FILE = path.join(process.cwd(), 'data', 'korean_frequent_words.txt');

async function initializeDatabase() {
  console.log('🚀 Starting VectorDB initialization...');
  
  try {
    // 1. 데이터베이스 초기화
    await vectorDB.initialize();
    console.log('✅ Database initialized');

    // 2. 한국어 단어 리스트 로드
    let targetWords: string[] = [];
    
    // 게임용 핵심 단어들 로드
    if (fs.existsSync(FREQUENT_WORDS_FILE)) {
      const frequentWords = fs.readFileSync(FREQUENT_WORDS_FILE, 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(word => word.length > 0);
      targetWords = [...targetWords, ...frequentWords];
      console.log(`📝 Loaded ${frequentWords.length} frequent words`);
    }

    // 전체 사전 단어들 (우선순위 낮음)
    if (fs.existsSync(KOREAN_WORDS_FILE)) {
      const allWords = fs.readFileSync(KOREAN_WORDS_FILE, 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(word => word.length > 0);
      
      // 중복 제거
      const uniqueWords = [...new Set([...targetWords, ...allWords])];
      targetWords = uniqueWords;
      console.log(`📚 Total unique words: ${targetWords.length}`);
    }

    // 3. FastText 벡터 파일이 있는지 확인
    if (!fs.existsSync(FASTTEXT_FILE)) {
      console.log('⚠️  FastText file not found. Please download cc.ko.300.vec');
      console.log('💡 You can download it from: https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.ko.300.vec.gz');
      
      // 압축 해제 안내
      if (fs.existsSync(FASTTEXT_FILE + '.gz')) {
        console.log('📦 Found compressed file. Extracting...');
        const { execSync } = await import('child_process');
        try {
          execSync(`gzip -d "${FASTTEXT_FILE}.gz"`);
          console.log('✅ FastText file extracted');
        } catch (error) {
          console.error('❌ Failed to extract file:', error);
          process.exit(1);
        }
      } else {
        console.log('❌ No FastText file found. Please download it first.');
        process.exit(1);
      }
    }

    // 4. 벡터 데이터를 DB에 로드
    console.log('📥 Loading FastText vectors into database...');
    console.log(`🎯 Target words: ${targetWords.length}`);
    console.log('⏳ This may take several minutes...');
    
    await vectorDB.loadFastTextVectors(FASTTEXT_FILE, targetWords);
    
    // 5. 테스트 쿼리 실행
    console.log('🧪 Running test queries...');
    
    const testWords = ['자연', '나무', '산', '바다', '사람'];
    for (const word of testWords) {
      const vector = await vectorDB.getWordVector(word);
      if (vector) {
        console.log(`✅ ${word}: vector loaded (${vector.length} dimensions)`);
        
        // 유사도 테스트
        if (word !== '자연') {
          const similarity = await vectorDB.calculateSimilarity('자연', word);
          console.log(`   🔗 Similarity to '자연': ${similarity.toFixed(2)}`);
        }
      } else {
        console.log(`❌ ${word}: vector not found`);
      }
    }

    console.log('✅ VectorDB initialization completed successfully!');
    console.log('🎮 You can now use the database-based similarity calculation');

  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  } finally {
    await vectorDB.close();
  }
}

// CLI 실행 감지
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase().catch(console.error);
}

export { initializeDatabase };

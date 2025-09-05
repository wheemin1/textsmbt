// Korean word similarity service using VectorDB (Semantle-ko architecture)
// Replaces file-based FastText loading with efficient SQLite database

import fs from 'fs';
import path from 'path';
import { vectorDB } from './vectorDB';
import { koreanDictionary } from './koreanDictionary';

interface WordVector {
  word: string;
  vector: number[];
}

interface SimilarityResult {
  similarity: number;
  rank?: string;
}

class Word2VecService {
  private isLoaded = false;
  private frequentWords: string[] = [];
  private useVectorDB = false;
  private fallbackMatrix: Map<string, number> = new Map();

  constructor() {
    this.init();
  }

  async init() {
    if (!this.isLoaded) {
      await this.loadKoreanWords();
      await this.tryInitVectorDB();
      this.loadFallbackSimilarities();
      this.isLoaded = true;
    }
  }

  // Try to initialize VectorDB (Semantle-ko style)
  private async tryInitVectorDB(): Promise<void> {
    try {
      await vectorDB.initialize();
      
      // Test if VectorDB has data
      const testVector = await vectorDB.getWordVector('자연');
      if (testVector) {
        this.useVectorDB = true;
        console.log('✅ VectorDB loaded successfully - using real FastText vectors');
        console.log(`📊 Vector dimensions: ${testVector.length}`);
      } else {
        console.log('⚠️  VectorDB is empty - falling back to pattern matching');
        this.useVectorDB = false;
      }
    } catch (error) {
      console.log('⚠️  VectorDB initialization failed - using fallback similarity');
      console.log('💡 Run: node scripts/initVectorDB.mjs to setup database');
      this.useVectorDB = false;
    }
  }

  private async loadKoreanWords() {
    try {
      const frequentWordsPath = path.join(process.cwd(), 'data', 'korean_frequent_words.txt');
      
      if (fs.existsSync(frequentWordsPath)) {
        const content = fs.readFileSync(frequentWordsPath, 'utf-8');
        this.frequentWords = content
          .split('\n')
          .map(line => line.trim())
          .filter(word => word.length > 0);
        
        console.log(`📝 Loaded ${this.frequentWords.length} Korean frequent words`);
      }
    } catch (error) {
      console.log('Warning: Could not load Korean frequent words:', error);
    }
  }

  private loadFallbackSimilarities() {
    // 게임에서 실제로 사용되는 단어 쌍들의 fallback 유사도
    const knownSimilarities = new Map<string, number>([
      // '자연' 기준 실제 테스트된 유사도들
      ['자연-나무', 76],
      ['자연-산', 71], 
      ['자연-꽃', 68],
      ['자연-강', 65],
      ['자연-하늘', 62],
      ['자연-바다', 60],
      ['자연-환경', 82],
      ['자연-생태', 75],
      ['자연-식물', 73],
      
      // '가족' 기준
      ['가족-어머니', 85],
      ['가족-아버지', 85],
      ['가족-부모', 90],
      ['가족-형제', 80],
      ['가족-자매', 80],
      ['가족-친척', 75],
      
      // '음식' 기준
      ['음식-밥', 80],
      ['음식-김치', 75],
      ['음식-요리', 85],
      ['음식-식당', 70],
      ['음식-맛', 75],
      
      // 기타 높은 유사도 쌍들
      ['학교-교육', 80],
      ['음악-노래', 85],
      ['사랑-행복', 75],
      ['시간-오늘', 60],
      ['친구-사람', 65]
    ]);

    this.fallbackMatrix = knownSimilarities;
    console.log(`💾 Loaded ${knownSimilarities.size} fallback similarities`);
  }

  async calculateSimilarity(word1: string, word2: string): Promise<number> {
    await this.init();

    // VectorDB 사용 가능한 경우 (실제 FastText 벡터)
    if (this.useVectorDB) {
      try {
        const similarity = await vectorDB.calculateSimilarity(word1, word2);
        if (similarity > 0) {
          return Math.round(similarity);
        }
      } catch (error) {
        console.log(`VectorDB calculation failed for ${word1}-${word2}:`, error);
      }
    }

    // Fallback: 미리 계산된 유사도 사용
    const key1 = `${word1}-${word2}`;
    const key2 = `${word2}-${word1}`;
    
    if (this.fallbackMatrix.has(key1)) {
      return this.fallbackMatrix.get(key1)!;
    }
    if (this.fallbackMatrix.has(key2)) {
      return this.fallbackMatrix.get(key2)!;
    }

    // 최종 fallback: 의미적 유사도 추정
    return this.calculateSemanticSimilarity(word1, word2);
  }

  private calculateSemanticSimilarity(word1: string, word2: string): number {
    // Semantle-ko 스타일의 의미 그룹 기반 유사도 계산
    const semanticGroups = {
      nature: {
        words: ['자연', '나무', '꽃', '산', '바다', '강', '하늘', '별', '달', '태양', '환경', '생태', '식물'],
        weight: 0.85
      },
      family: {
        words: ['가족', '어머니', '아버지', '부모', '형제', '자매', '친척', '할머니', '할아버지'],
        weight: 0.90
      },
      emotion: {
        words: ['사랑', '행복', '기쁨', '슬픔', '화', '우울', '기분', '감정', '마음'],
        weight: 0.80
      },
      food: {
        words: ['음식', '밥', '김치', '요리', '식당', '맛', '먹다', '요리사', '식품'],
        weight: 0.80
      },
      education: {
        words: ['학교', '교육', '학생', '선생님', '공부', '시험', '숙제', '도서관'],
        weight: 0.75
      },
      time: {
        words: ['시간', '오늘', '내일', '아침', '저녁', '밤', '년', '월', '일'],
        weight: 0.70
      }
    };

    let maxSimilarity = 0;

    // 같은 의미 그룹에 속하는지 확인
    for (const [groupName, group] of Object.entries(semanticGroups)) {
      const word1InGroup = group.words.includes(word1);
      const word2InGroup = group.words.includes(word2);
      
      if (word1InGroup && word2InGroup) {
        // 같은 그룹 내에서의 유사도 계산
        const baseScore = 70; // 기본 그룹 내 유사도
        const bonus = Math.random() * 20; // 15-20점 랜덤 보너스
        maxSimilarity = Math.max(maxSimilarity, (baseScore + bonus) * group.weight);
      }
    }

    // 문자열 유사도 (편집 거리 기반)
    const stringSimScore = this.calculateStringSimilarity(word1, word2) * 40;
    
    // 음성적 유사도 (초성, 중성 비교)
    const phoneticScore = this.calculatePhoneticSimilarity(word1, word2) * 30;

    // 최종 점수 조합
    const finalScore = Math.max(maxSimilarity, stringSimScore + phoneticScore);
    
    // Semantle 스타일 점수 범위 (0-100)
    return Math.min(100, Math.max(0, Math.round(finalScore)));
  }

  private calculateStringSimilarity(word1: string, word2: string): number {
    if (word1 === word2) return 1.0;
    
    const len1 = word1.length;
    const len2 = word2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;
    
    // 편집 거리 계산
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = word1[i - 1] === word2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    return 1 - (matrix[len1][len2] / maxLen);
  }

  private calculatePhoneticSimilarity(word1: string, word2: string): number {
    // 한국어 음성적 유사도 (초성 기반 간단 구현)
    const getInitialConsonant = (char: string): string => {
      const code = char.charCodeAt(0) - 44032;
      if (code < 0 || code > 11171) return char;
      return String.fromCharCode(Math.floor(code / 588) + 4352);
    };

    let matches = 0;
    const minLen = Math.min(word1.length, word2.length);
    
    for (let i = 0; i < minLen; i++) {
      if (getInitialConsonant(word1[i]) === getInitialConsonant(word2[i])) {
        matches++;
      }
    }
    
    return minLen > 0 ? matches / minLen : 0;
  }

  // 단어 유효성 검사 (한국어 사전 기반)
  async isValidWord(word: string): Promise<boolean> {
    await this.init();
    
    // VectorDB에 있는 단어인지 확인
    if (this.useVectorDB) {
      const vector = await vectorDB.getWordVector(word);
      if (vector) return true;
    }

    // 한국어 사전에 있는지 확인
    const isInDictionary = await koreanDictionary.isValidWord(word);
    if (isInDictionary) return true;

    // 자주 사용되는 단어 리스트에 있는지 확인
    return this.frequentWords.includes(word);
  }

  // 게임용 단어 추천 (높은 유사도 단어들)
  async getSimilarWords(targetWord: string, limit: number = 10): Promise<string[]> {
    await this.init();

    if (this.useVectorDB) {
      try {
        const similarWords = await vectorDB.getTopSimilarWords(targetWord, limit);
        return similarWords.map(item => item.word);
      } catch (error) {
        console.log(`Error getting similar words from DB:`, error);
      }
    }

    // Fallback: 의미 그룹 기반 추천
    return this.getFallbackSimilarWords(targetWord, limit);
  }

  public getFallbackSimilarWords(targetWord: string, limit: number): string[] {
    const candidates: Array<{word: string, similarity: number}> = [];
    
    // 자주 사용되는 단어들 중에서 유사도 계산
    const sampleWords = this.frequentWords.slice(0, 200); // 성능상 200개로 제한
    
    for (const word of sampleWords) {
      if (word === targetWord) continue;
      
      const similarity = this.calculateSemanticSimilarity(targetWord, word);
      if (similarity > 30) { // 임계값 이상만
        candidates.push({ word, similarity });
      }
    }

    return candidates
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.word);
  }

  // 현재 사용 중인 벡터 시스템 정보
  async getSystemInfo(): Promise<{ type: string; hasRealVectors: boolean; wordsCount: number }> {
    const wordsCount = this.useVectorDB 
      ? await vectorDB.getVectorCount()
      : this.frequentWords.length;

    return {
      type: this.useVectorDB ? 'VectorDB' : 'Fallback',
      hasRealVectors: this.useVectorDB,
      wordsCount
    };
  }
}

export const word2vec = new Word2VecService();

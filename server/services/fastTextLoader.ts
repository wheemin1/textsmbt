// FastText Korean Word Vectors Loader
// Loads and processes cc.ko.300.vec file format

import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface FastTextVector {
  word: string;
  vector: number[];
}

export class FastTextLoader {
  private vectorsPath: string;
  private vocabSize: number = 0;
  private dimensions: number = 300;

  constructor(vectorsPath?: string) {
    this.vectorsPath = vectorsPath || path.join(process.cwd(), 'data', 'fasttext', 'cc.ko.300.vec');
  }

  // Load FastText vectors from file
  async loadVectors(maxWords: number = 50000): Promise<Map<string, number[]>> {
    const vectors = new Map<string, number[]>();

    if (!fs.existsSync(this.vectorsPath)) {
      console.warn(`⚠️ FastText file not found: ${this.vectorsPath}`);
      console.log('📥 To download FastText Korean vectors:');
      console.log('1. Visit: https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.ko.300.vec.gz');
      console.log('2. Extract to: data/fasttext/cc.ko.300.vec');
      return vectors;
    }

    console.log('🔄 Loading FastText Korean vectors...');
    
    const fileStream = fs.createReadStream(this.vectorsPath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineCount = 0;
    let firstLine = true;

    for await (const line of rl) {
      if (firstLine) {
        // First line contains vocab size and dimensions
        const [vocabStr, dimStr] = line.split(' ');
        this.vocabSize = parseInt(vocabStr);
        this.dimensions = parseInt(dimStr);
        console.log(`📊 FastText: ${this.vocabSize} words, ${this.dimensions} dimensions`);
        firstLine = false;
        continue;
      }

      if (lineCount >= maxWords) {
        break;
      }

      const parts = line.split(' ');
      if (parts.length !== this.dimensions + 1) {
        continue; // Skip malformed lines
      }

      const word = parts[0];
      
      // Skip if not Korean word (basic filter)
      if (!this.isKoreanWord(word)) {
        continue;
      }

      const vector = parts.slice(1).map(val => parseFloat(val));
      
      // Validate vector
      if (vector.length === this.dimensions && vector.every(v => !isNaN(v))) {
        vectors.set(word, vector);
        lineCount++;

        // Debug specific words
        if (word === '시간' || word === '시계' || word === '사과') {
          console.log(`🔍 FASTTEXT DEBUG: ${word} → [${vector.slice(0, 5).join(', ')}...]`);
        }

        if (lineCount % 10000 === 0) {
          console.log(`📈 Loaded ${lineCount} Korean words...`);
        }
      }
    }

    console.log(`✅ FastText loading complete: ${vectors.size} Korean words`);
    return vectors;
  }

  // Check if word contains Korean characters
  private isKoreanWord(word: string): boolean {
    // Korean Unicode ranges: 가-힣 (완성형), ㄱ-ㅎ (자음), ㅏ-ㅣ (모음)
    const koreanRegex = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;
    return koreanRegex.test(word) && word.length >= 2 && word.length <= 10;
  }

  // Calculate cosine similarity between two vectors
  static cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  // Find most similar words to a target word
  static findMostSimilar(
    targetWord: string,
    vectors: Map<string, number[]>,
    topK: number = 10
  ): Array<{ word: string; similarity: number }> {
    const targetVector = vectors.get(targetWord);
    if (!targetVector) {
      return [];
    }

    const similarities: Array<{ word: string; similarity: number }> = [];

    vectors.forEach((vector, word) => {
      if (word === targetWord) return;

      const similarity = FastTextLoader.cosineSimilarity(targetVector, vector);
      similarities.push({ word, similarity });
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  // Precompute similarity matrix for frequently used words
  static async precomputeSimilarities(
    words: string[],
    vectors: Map<string, number[]>
  ): Promise<Map<string, number>> {
    const similarities = new Map<string, number>();
    let processed = 0;

    console.log(`🔄 Precomputing similarities for ${words.length} word pairs...`);

    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const word1 = words[i];
        const word2 = words[j];

        const vec1 = vectors.get(word1);
        const vec2 = vectors.get(word2);

        if (vec1 && vec2) {
          const similarity = FastTextLoader.cosineSimilarity(vec1, vec2);
          
          const key1 = `${word1}-${word2}`;
          const key2 = `${word2}-${word1}`;
          
          similarities.set(key1, similarity);
          similarities.set(key2, similarity);
        }

        processed++;
        if (processed % 1000 === 0) {
          console.log(`📊 Precomputed ${processed} similarities...`);
        }
      }
    }

    console.log(`✅ Precomputing complete: ${similarities.size} similarity pairs`);
    return similarities;
  }
}

export const fastTextLoader = new FastTextLoader();

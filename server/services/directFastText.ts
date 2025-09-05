import * as fs from 'fs';
import * as readline from 'readline';

export class DirectFastText {
  private vectors: Map<string, number[]> = new Map();
  private dimensions: number = 300;
  private fastTextPath: string = '';
  
  private isHangul(word: string): boolean {
    // semantle-ko의 is_hangul 함수와 동일한 로직
    // 한글 유니코드 범위: AC00-D7AF (가-힣)
    const hangulRegex = /^[가-힣]+$/;
    return hangulRegex.test(word);
  }

  // Get vector for any word from FastText file (on-demand loading)
  async getVector(word: string): Promise<number[] | null> {
    // Check if already cached
    if (this.vectors.has(word)) {
      return this.vectors.get(word)!;
    }

    // Load from FastText file on-demand
    const vector = await this.loadSingleVector(word);
    if (vector) {
      this.vectors.set(word, vector);
      return vector;
    }
    
    return null;
  }

  // Load a single word vector from FastText file
  private async loadSingleVector(word: string): Promise<number[] | null> {
    if (!this.fastTextPath || !fs.existsSync(this.fastTextPath)) {
      console.warn('⚠️ FastText file not available in production environment');
      return null;
    }

    const fileStream = fs.createReadStream(this.fastTextPath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    try {
      let lineCount = 0;
      for await (const line of rl) {
        lineCount++;
        
        // Skip header
        if (lineCount === 1) continue;
        
        const parts = line.split(' ');
        if (parts.length < this.dimensions + 1) continue;
        
        const currentWord = parts[0];
        
        // Found the word we're looking for
        if (currentWord === word && this.isHangul(currentWord)) {
          const vector = parts.slice(1, this.dimensions + 1).map(Number);
          rl.close();
          console.log(`🎯 Loaded "${word}": [${vector.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...] (on-demand)`);
          return vector;
        }
      }
    } catch (error) {
      console.error(`Error loading vector for ${word}:`, error);
    }
    
    rl.close();
    return null;
  }

  async loadVectors(filePath: string, targetWords: string[]): Promise<void> {
    console.log('🔄 Loading FastText vectors directly...');
    this.fastTextPath = filePath; // Store path for on-demand loading
    
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineCount = 0;
    let foundWords = 0;
    
    for await (const line of rl) {
      lineCount++;
      
      // Skip header line
      if (lineCount === 1) {
        const parts = line.split(' ');
        this.dimensions = parseInt(parts[1]);
        console.log(`📊 FastText: ${parts[0]} words, ${this.dimensions} dimensions`);
        continue;
      }

      const parts = line.split(' ');
      if (parts.length !== this.dimensions + 1) continue;
      
      const word = parts[0];
      
      // semantle-ko와 동일: 한글만 필터링
      if (!this.isHangul(word)) continue;
      
      // Only load target words for now
      if (targetWords.includes(word)) {
        const vector = parts.slice(1).map(x => parseFloat(x));
        
        // semantle-ko와 완전히 동일: 원본 벡터를 그대로 사용 (정규화 없음)
        // process_vecs.py: vec = array([float(w1) for w1 in words[1:]])
        this.vectors.set(word, vector);
        foundWords++;
        
        console.log(`🎯 Loaded "${word}": [${vector.slice(0, 5).map(x => x.toFixed(4)).join(', ')}...] (raw FastText)`);
        
        if (foundWords === targetWords.length) {
          break; // Found all target words
        }
      }
      
      // Limit search to avoid loading entire file
      if (lineCount > 500000) break;
    }
    
    rl.close();
    console.log(`✅ Loaded ${foundWords}/${targetWords.length} target words`);
  }

  cosineSimilarity(word1: string, word2: string): number {
    const vec1 = this.vectors.get(word1);
    const vec2 = this.vectors.get(word2);
    
    if (!vec1 || !vec2) {
      throw new Error(`Vector not found: ${word1} or ${word2}`);
    }

    // semantle-ko와 완전히 동일한 계산:
    // def cosine_similarity(vec1: array, vec2: array) -> float:
    //     return vec1.dot(vec2) / (norm(vec1) * norm(vec2))
    
    // Dot product
    let dotProduct = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
    }
    
    // L2 norm (numpy.linalg.norm 방식)
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    if (norm1 === 0 || norm2 === 0) return 0;

    const similarity = dotProduct / (norm1 * norm2);
    
    if ((word1 === '시계' && word2 === '시간') || (word1 === '시간' && word2 === '시계') ||
        (word1 === '벽시계' && word2 === '시간') || (word1 === '시간' && word2 === '벽시계')) {
      console.log(`🔍 SEMANTLE-KO 동일 계산: "${word1}" vs "${word2}"`);
      console.log(`   Dot product: ${dotProduct.toFixed(6)}`);
      console.log(`   Norm1 (${word1}): ${norm1.toFixed(6)}`);
      console.log(`   Norm2 (${word2}): ${norm2.toFixed(6)}`);
      console.log(`   Cosine similarity: ${similarity.toFixed(6)}`);
      console.log(`   Score (×100): ${Math.max(0, Math.round(similarity * 100))}`);
    }
    
    return similarity;
  }

  // Calculate cosine similarity between two vectors
  calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vector dimensions must match');
    }

    // Dot product
    let dotProduct = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
    }
    
    // L2 norm (numpy.linalg.norm 방식)
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (norm1 * norm2);
  }

  // Calculate cosine similarity between two words
  async calculateWordSimilarity(word1: string, word2: string): Promise<number> {
    const vec1 = await this.getVector(word1);
    const vec2 = await this.getVector(word2);
    
    if (!vec1 || !vec2) {
      return 0;
    }

    return this.calculateCosineSimilarity(vec1, vec2);
  }
  
  hasWord(word: string): boolean {
    return this.vectors.has(word);
  }
}

export const directFastText = new DirectFastText();

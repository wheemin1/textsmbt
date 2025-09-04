// Korean word similarity service based on Semantle-ko's word2vec.py
// TODO: Integrate with FastText Korean embeddings for production

interface WordVector {
  word: string;
  vector: number[];
}

interface SimilarityResult {
  similarity: number;
  rank?: string;
}

class Word2VecService {
  private wordVectors: Map<string, number[]> = new Map();
  private isLoaded = false;

  constructor() {
    this.loadSampleVectors();
  }

  private loadSampleVectors() {
    // TODO: Replace with actual FastText Korean embeddings loading
    // This should load from cc.ko.300.vec or pre-processed vectors
    // For now, using simplified mock vectors for development
    const sampleWords = [
      '가족', '집안', '가정', '부모', '자녀',
      '학교', '교육', '공부', '선생님', '학생',
      '음식', '요리', '밥', '식당', '맛',
      '친구', '사람', '동료', '지인', '관계',
      '사랑', '마음', '감정', '기분', '생각'
    ];

    // Generate mock vectors (in production, load from FastText embeddings)
    sampleWords.forEach((word, index) => {
      const vector = Array(300).fill(0).map(() => Math.random() * 2 - 1);
      this.wordVectors.set(word, vector);
    });

    this.isLoaded = true;
  }

  // TODO: Production implementation should load from:
  // 1. FastText Korean vectors: cc.ko.300.vec.gz
  // 2. Filtered word list from filter_words.py
  // 3. Pre-calculated similarities from process_similar.py
  async loadProductionVectors(): Promise<void> {
    // Implementation for loading actual FastText embeddings
    // const vectorData = await loadFastTextVectors('data/cc.ko.300.vec');
    // this.wordVectors = new Map(vectorData);
    throw new Error("Production vector loading not implemented yet");
  }

  getWordVector(word: string): number[] | undefined {
    return this.wordVectors.get(word);
  }

  calculateSimilarity(word1: string, word2: string): SimilarityResult {
    const vec1 = this.getWordVector(word1);
    const vec2 = this.getWordVector(word2);

    if (!vec1 || !vec2) {
      throw new Error(`Word not found in vocabulary: ${!vec1 ? word1 : word2}`);
    }

    const similarity = this.cosineSimilarity(vec1, vec2);
    
    // Convert to percentage score (0-100)
    const score = Math.round((similarity + 1) * 50);
    
    return {
      similarity: score,
      rank: score > 90 ? "상위 10위" : score > 70 ? "상위 100위" : "100위 이상"
    };
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0));
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  isValidWord(word: string): boolean {
    return this.wordVectors.has(word);
  }

  getRandomWord(): string {
    const words = Array.from(this.wordVectors.keys());
    return words[Math.floor(Math.random() * words.length)];
  }

  getSuggestions(query: string, limit: number = 8): string[] {
    const words = Array.from(this.wordVectors.keys());
    return words
      .filter(word => word.includes(query))
      .slice(0, limit);
  }
}

export const word2vecService = new Word2VecService();

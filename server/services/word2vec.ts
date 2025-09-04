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
      // 가족 관련
      '가족', '집안', '가정', '부모', '자녀', '형제', '자매', '조부모', '사촌',
      // 교육 관련  
      '학교', '교육', '공부', '선생님', '학생', '수업', '시험', '숙제', '대학',
      // 음식 관련
      '음식', '요리', '밥', '식당', '맛', '반찬', '국물', '간식', '녹차',
      // 인간관계
      '친구', '사람', '동료', '지인', '관계', '인간', '개인', '사회', '이웃',
      // 감정 및 생각
      '사랑', '마음', '감정', '기분', '생각', '느낌', '의견', '판단', '지혜',
      // 공간 및 장소
      '집', '방', '건물', '아파트', '마을', '도시', '나라', '세계', '지구',
      // 시간 개념
      '시간', '날짜', '년도', '계절', '오늘', '내일', '어제', '미래', '과거',
      // 직업 및 경제
      '일', '직업', '회사', '사업', '경제', '돈', '가격', '비용', '수입',
      // 건강 및 의료
      '건강', '병원', '의사', '약', '운동', '몸', '마음', '정신', '치료',
      // 문화 및 예술
      '문화', '예술', '음악', '영화', '책', '소설', '시', '문학', '그림',
      // 자연 및 환경
      '자연', '환경', '나무', '산', '바다', '강', '하늘', '구름', '비',
      // 기술 및 과학
      '기술', '과학', '컴퓨터', '인터넷', '프로그램', '데이터', '인공지능', '로봇'
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

// Korean word similarity service based on Semantle-ko's approach
// Uses proper cosine similarity calculation like semantle-ko's word2vec.py

import fs from 'fs';
import path from 'path';
import { FastTextLoader, fastTextLoader } from './fastTextLoader';
import { directFastText } from './directFastText';
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
  private wordVectors: Map<string, number[]> = new Map();
  private isLoaded = false;
  private frequentWords: string[] = [];
  private similarityMatrix: Map<string, number> = new Map();
  private useFastText = false;

  constructor() {
    this.init();
  }

  async init() {
    if (!this.isLoaded) {
      await this.loadKoreanWords();
      await this.loadSimilarityMatrix();
      await this.tryLoadFastText();
      this.loadSampleVectors();
    }
  }

  // Try to load FastText vectors if available
  private async tryLoadFastText(): Promise<void> {
    try {
      // TARGET_WORDS from StaticGame.tsx - 게임에서 사용되는 모든 목표 단어
      const TARGET_WORDS = [
        "가족", "어머니", "아버지", "부모", "형제", "자매", "친구", "사랑", "행복", "기쁨",
        "자연", "나무", "꽃", "산", "바다", "강", "하늘", "별", "달", "태양",
        "음식", "집", "학교", "회사", "시간", "오늘", "내일", "아침", "저녁", "밤",
        "생각", "문제", "방법", "이유", "결과", "변화", "성장", "경험", "기회", "희망",
        "사회", "문화", "교육", "정치", "기술", "과학", "예술", "운동", "여행", "음악"
      ];
      
      // 봇 단어들 - 게임에서 봇이 사용하는 단어들
      const BOT_WORDS = [
        "우주", "세상", "마음", "인생", "세계", "사람", "나라", "지구", "미래", "과거",
        "현실", "꿈", "소망", "목표", "계획", "준비", "시작", "완성", "성취", "발전",
        "창조", "발견", "탐구", "연구", "학습", "지식", "지혜", "이해", "깨달음", "성찰"
      ];

      const fastTextPath = path.join(process.cwd(), 'data', 'fasttext', 'cc.ko.300.vec');
      
      // 핵심: 모든 게임 관련 단어들을 미리 로드
      const allGameWords = [...TARGET_WORDS, ...BOT_WORDS];
      
      console.log(`🎯 Loading ${allGameWords.length} game words from FastText...`);
      await directFastText.loadVectors(fastTextPath, allGameWords);
      
      console.log(`🚀 DirectFastText enabled with key words`);
      this.useFastText = true;
    } catch (error) {
      console.log('ℹ️ DirectFastText not available, trying original FastText...', error);
      
      // Fallback to original FastText loader
      try {
        const fastTextVectors = await fastTextLoader.loadVectors(10000);
        
        if (fastTextVectors.size > 0) {
          console.log(`🚀 FastText enabled with ${fastTextVectors.size} Korean words`);
          this.wordVectors = fastTextVectors;
          this.useFastText = true;
          
          // Precompute similarities for frequent words if we have FastText
          if (this.frequentWords.length > 0) {
            const topWords = this.frequentWords.slice(0, 200);
            const precomputedSims = await FastTextLoader.precomputeSimilarities(
              topWords,
              fastTextVectors
            );
            
            // Merge with existing similarity matrix
            precomputedSims.forEach((similarity, key) => {
              this.similarityMatrix.set(key, similarity);
            });
            
            console.log(`📊 Enhanced similarity matrix: ${this.similarityMatrix.size / 2} word pairs`);
          }
        }
      } catch (fallbackError) {
        console.log('ℹ️ FastText not available, using fallback similarity calculations');
        this.useFastText = false;
      }
    }
  }

  // Load pre-calculated similarity matrix
  private async loadSimilarityMatrix(): Promise<void> {
    try {
      const matrixFilePath = path.join(process.cwd(), 'data', 'korean_word_similarities.csv');
      const content = fs.readFileSync(matrixFilePath, 'utf-8');
      
      content.split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .forEach(line => {
          const [word1, word2, score] = line.split(',');
          if (word1 && word2 && score) {
            const key1 = `${word1.trim()}-${word2.trim()}`;
            const key2 = `${word2.trim()}-${word1.trim()}`;
            const similarity = parseFloat(score.trim());
            this.similarityMatrix.set(key1, similarity);
            this.similarityMatrix.set(key2, similarity);
          }
        });
      
      console.log(`✅ Loaded ${this.similarityMatrix.size / 2} word similarity pairs`);
    } catch (error) {
      console.warn('⚠️ Could not load similarity matrix, using fallback calculations');
    }
  }

  // Load Korean frequent words from dictionary instead of manual file
  private async loadKoreanWords(): Promise<void> {
    try {
      // Try to load from Korean dictionary first
      await koreanDictionary.init();
      const dictStats = koreanDictionary.getDictionaryStats();
      
      if (dictStats.isLoaded && dictStats.totalWords > 0) {
        // Extract common Korean words from dictionary
        // Filter for typical Korean words (2-4 characters, common patterns)
        const allDictWords = koreanDictionary.getAllWords();
        this.frequentWords = allDictWords
          .filter((word: string) => {
            // Filter for reasonable Korean words
            return word.length >= 2 && 
                   word.length <= 4 && 
                   /^[가-힣]+$/.test(word) && // Only Hangul
                   !word.includes('ㅇ') && // Avoid partial characters
                   !word.includes('ㄱ'); // Avoid partial characters
          })
          .slice(0, 1000); // Take top 1000
        
        console.log(`✅ Extracted ${this.frequentWords.length} frequent words from Korean dictionary`);
        return;
      }
    } catch (error) {
      console.warn('⚠️ Could not use Korean dictionary, trying file fallback');
    }

    // Fallback to existing file method
    try {
      const wordsFilePath = path.join(process.cwd(), 'data', 'korean_frequent_words.txt');
      const content = fs.readFileSync(wordsFilePath, 'utf-8');
      
      // Parse words from file (filter out comments and empty lines)
      this.frequentWords = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'))
        .slice(0, 1000); // Use top 1000 words
      
      console.log(`✅ Loaded ${this.frequentWords.length} Korean frequent words from file`);
    } catch (error) {
      console.warn('⚠️ Could not load korean_frequent_words.txt, using fallback word list');
      // Fallback to embedded word list if file not found
      this.loadFallbackWords();
    }
  }

  private loadFallbackWords(): void {
    this.frequentWords = [
      // Core high-frequency words as fallback
      '것', '하다', '있다', '되다', '나', '없다', '사람', '우리', '아니다', '같다',
      '대하다', '년', '때문', '말하다', '위하다', '그러나', '알다', '그렇다', '또', '사회',
      '많다', '좋다', '더', '받다', '그것', '집', '나오다', '그리고', '문제', '그런',
      '살다', '생각하다', '모르다', '속', '만들다', '데', '두', '앞', '경우', '중',
      // Add more fallback words...
      '가족', '부모', '아버지', '어머니', '아들', '딸', '형', '누나', '동생',
      '학교', '교육', '공부', '선생님', '학생', '수업', '시험', '숙제', '대학',
      '음식', '요리', '밥', '식당', '맛', '반찬', '국물', '간식', '녹차', '커피',
      '사랑', '마음', '감정', '기분', '생각', '느낌', '의견', '판단', '지혜', '행복',
      '집', '방', '건물', '아파트', '마을', '도시', '나라', '세계', '지구',
      '시간', '날짜', '년도', '계절', '오늘', '내일', '어제', '미래', '과거', '현재'
    ];
  }

  private loadSampleVectors() {
    // Use frequent words from Korean dictionary instead of manual list
    const wordsToUse = this.frequentWords.length > 0 ? this.frequentWords : [
      // Fallback words if file loading failed
      '것', '하다', '있다', '되다', '나', '없다', '사람', '우리', '아니다', '같다',
      '집', '학교', '음식', '사랑', '시간', '가족', '친구', '일', '돈', '행복'
    ];

    // Generate mock vectors (in production, load from FastText embeddings)
    wordsToUse.forEach((word, index) => {
      const vector = Array(300).fill(0).map(() => Math.random() * 2 - 1);
      this.wordVectors.set(word, vector);
    });

    this.isLoaded = true;
    console.log(`🚀 Word2Vec service initialized with ${wordsToUse.length} Korean words`);
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

  async calculateSimilarity(word1: string, word2: string): Promise<SimilarityResult> {
    console.log(`💫💫💫 WORD2VEC SERVICE ENTRY POINT: "${word1}" vs "${word2}"`);
    
    // Validate words using Korean dictionary first
    if (!koreanDictionary.isValidKoreanWord(word1)) {
      console.warn(`⚠️ Invalid Korean word: ${word1}`);
      // Don't throw error, just warn - let the game continue for now
    }
    if (!koreanDictionary.isValidKoreanWord(word2)) {
      console.warn(`⚠️ Invalid Korean word: ${word2}`);
      // Don't throw error, just warn - let the game continue for now  
    }
    
    // Exact match
    if (word1 === word2) {
      return { similarity: 100, rank: "정답!" };
    }

    // Try DirectFastText with on-demand loading for ANY Korean words
    if (this.useFastText) {
      try {
        const vec1 = await directFastText.getVector(word1);
        const vec2 = await directFastText.getVector(word2);
        
        if (vec1 && vec2) {
          console.log(`🚀 PATH 1 - On-demand loading: "${word1}" vs "${word2}"`);
          const similarity = directFastText.calculateCosineSimilarity(vec1, vec2);
          
          // 🎯 NewsJelly semantle-ko와 유사한 스케일로 조정
          // 원본에서는 brother-son이 83.80점인데 우리는 21점 → 약 4배 차이
          // 실험적으로 스케일 팩터 적용 (가족 관계 단어들을 기준으로)
          // Scale factor to match NewsJelly scoring (brother-son: 83.80 target)
          const scaleFactor = 2.0; // Temporarily reduced to test if clamping exists
          const rawScore = similarity * 100;
          const adjustedScore = Math.max(0, Math.round(rawScore * scaleFactor));
          
          console.log(`🚀🚀🚀 SCALE FACTOR APPLIED: "${word1}" vs "${word2}" cosine=${similarity.toFixed(6)} → raw=${Math.round(rawScore)} → SCALED=${adjustedScore}`);
          
          return {
            similarity: adjustedScore,
            rank: this.getRankFromScore(adjustedScore)
          };
        }
      } catch (error) {
        console.error(`Error calculating similarity for ${word1} vs ${word2}:`, error);
      }
    }

    const vec1 = this.getWordVector(word1);
    const vec2 = this.getWordVector(word2);

    // Try DirectFastText first
    if (this.useFastText && directFastText.hasWord(word1) && directFastText.hasWord(word2)) {
      console.log(`🚀 PATH 2 - Cached vectors: "${word1}" vs "${word2}"`);
      const similarity = directFastText.cosineSimilarity(word1, word2);
      
      // 🎯 NewsJelly semantle-ko와 유사한 스케일로 조정
      // brother-son: 원본 83.80점, 우리 36점 → 83.80/36 = 2.33배 조정
      const scaleFactor = 2.0; // Temporarily reduced to test if clamping exists
      const rawScore = similarity * 100;
      const adjustedScore = Math.max(0, Math.round(rawScore * scaleFactor));
      
      console.log(`🚀🚀🚀 SCALE FACTOR (cached): "${word1}" vs "${word2}" cosine=${similarity.toFixed(6)} → raw=${Math.round(rawScore)} → SCALED=${adjustedScore}`);
      
      return {
        similarity: adjustedScore,
        rank: this.getRankFromScore(adjustedScore)
      };
    }

    // Fallback to original FastText
    const fastTextVec1 = this.wordVectors.get(word1);
    const fastTextVec2 = this.wordVectors.get(word2);

    // FastText 벡터가 있으면 실제 코사인 유사도 사용
    if (this.useFastText && fastTextVec1 && fastTextVec2) {
      const similarity = FastTextLoader.cosineSimilarity(fastTextVec1, fastTextVec2);
      
      // DEBUG: 직접 파일에서 벡터를 다시 로드해서 계산
      if ((word1 === '시계' || word1 === '사과') && word2 === '시간') {
        console.log(`🔍 DEBUG: ${word1} vector preview: [${fastTextVec1.slice(0, 5).join(', ')}...]`);
        console.log(`🔍 DEBUG: ${word2} vector preview: [${fastTextVec2.slice(0, 5).join(', ')}...]`);
      }
      
      // semantle-ko와 완전히 동일한 방식: 코사인 유사도에 100을 곱함
      // 코사인 유사도는 -1 ~ 1 범위이므로, 음수는 0으로 처리
      const score = Math.max(0, Math.round(similarity * 100));
      
      console.log(`🎯 SEMANTLE-KO style: "${word1}" vs "${word2}" cosine=${similarity.toFixed(6)} → score=${score}`);
      
      return {
        similarity: score,
        rank: this.getRankFromScore(score)
      };
    }

    // 개발 모드에서는 단어가 사전에 없어도 임시 점수 계산
    if (process.env.NODE_ENV === 'development' && (!vec1 || !vec2)) {
      // 단어 유사도를 간단한 규칙으로 계산
      const similarity = this.calculateSimpleSimilarity(word1, word2);
      let score = Math.round(similarity * 100);
      
      // 0점 방지: 최소 5점은 보장
      score = Math.max(5, score);
      
      console.log(`🔍 Similarity: "${word1}" vs "${word2}" = ${similarity.toFixed(3)} → ${score}점`);
      
      return {
        similarity: score,
        rank: score > 90 ? "상위 10위" : score > 70 ? "상위 100위" : score > 50 ? "상위 500위" : "500위 이상"
      };
    }

    if (!vec1 || !vec2) {
      throw new Error(`Word not found in vocabulary: ${!vec1 ? word1 : word2}`);
    }

    const similarity = this.cosineSimilarity(vec1, vec2);
    
    // Convert cosine similarity to percentage score (following semantle-ko pattern)
    // Cosine similarity ranges from -1 to 1, but usually 0 to 1 for similar words
    // Convert to 0-100 scale with proper scaling
    const score = Math.max(0, Math.round(similarity * 100));
    
    return {
      similarity: score,
      rank: score > 95 ? "상위 10위" : score > 85 ? "상위 100위" : score > 70 ? "상위 500위" : "500위 이상"
    };
  }

  // 개발용 간단한 유사도 계산 (Semantle-Ko 패턴 적용)
  private calculateSimpleSimilarity(word1: string, word2: string): number {
    // Exact match
    if (word1 === word2) return 1.0;
    
    // Check pre-calculated similarity matrix first
    const matrixKey = `${word1}-${word2}`;
    const matrixSimilarity = this.similarityMatrix.get(matrixKey);
    if (matrixSimilarity !== undefined) {
      console.log(`📊 Matrix similarity: "${word1}" vs "${word2}" = ${matrixSimilarity.toFixed(3)}`);
      return matrixSimilarity;
    }
    
    // Korean-specific semantic similarity patterns from Semantle-Ko analysis
    const semanticGroups = {
      // 가족 관계
      family: ['가족', '집안', '가정', '부모', '자녀', '형제', '자매', '조부모', '사촌', '친척', '아버지', '어머니', '아들', '딸', '형', '누나', '동생', '할아버지', '할머니', '삼촌', '이모', '고모', '친구', '연인', '남편', '아내'],
      
      // 교육 관련
      education: ['학교', '교육', '공부', '선생님', '학생', '수업', '시험', '숙제', '대학', '교실', '책', '학습', '과목', '수학', '과학', '역사', '언어', '문학', '예술', '졸업', '입학', '성적'],
      
      // 음식 관련  
      food: ['음식', '요리', '밥', '식당', '맛', '반찬', '국물', '간식', '녹차', '커피', '사과', '바나나', '빵', '고기', '야채', '과일', '물', '우유', '차', '술'],
      
      // 감정 상태
      emotion: ['사랑', '마음', '감정', '기분', '생각', '느낌', '의견', '판단', '지혜', '행복', '슬픔', '기쁨', '화', '걱정', '불안', '평화', '희망', '꿈', '추억', '그리움'],
      
      // 공간 장소
      place: ['집', '방', '건물', '아파트', '마을', '도시', '나라', '세계', '지구', '학교', '회사', '병원', '상점', '공원', '도서관', '극장', '시장', '역', '공항', '호텔'],
      
      // 시간 개념
      time: ['시간', '날짜', '년도', '계절', '오늘', '내일', '어제', '미래', '과거', '현재', '순간', '아침', '점심', '저녁', '밤', '새벽', '주말', '휴일', '생일', '기념일'],
      
      // 자연 환경
      nature: ['자연', '환경', '나무', '산', '바다', '강', '하늘', '구름', '비', '눈', '꽃', '잎', '바람', '햇빛', '달', '별', '새', '벌레', '동물', '식물'],
      
      // 교통 수단
      transport: ['자동차', '버스', '지하철', '기차', '비행기', '자전거', '오토바이', '택시', '트럭', '배', '길', '도로', '다리', '터널', '주차', '운전', '교통', '여행'],
      
      // 색상 관련
      color: ['빨간색', '파란색', '노란색', '검은색', '흰색', '초록색', '보라색', '주황색', '갈색', '회색', '분홍색', '금색', '은색', '투명', '밝다', '어둡다', '선명하다', '흐리다'],
      
      // 날씨 기후
      weather: ['봄', '여름', '가을', '겨울', '햇빛', '바람', '천둥', '번개', '안개', '무지개', '더위', '추위', '습기', '건조', '맑다', '흐리다', '따뜻하다', '차갑다', '시원하다', '덥다'],
      
      // 동물 관련
      animal: ['고양이', '강아지', '새', '물고기', '사자', '호랑이', '코끼리', '토끼', '곰', '여우', '말', '소', '돼지', '양', '닭', '오리', '거북이', '뱀', '개구리', '나비'],
      
      // 스포츠 운동
      sport: ['축구', '야구', '농구', '테니스', '수영', '달리기', '골프', '배드민턴', '탁구', '배구', '권투', '태권도', '스키', '스케이트', '등산', '낚시', '경기', '선수', '팀', '승리'],
      
      // 직업 경제
      work: ['일', '직업', '회사', '사업', '경제', '돈', '가격', '비용', '수입', '월급', '투자', '은행', '카드', '현금', '쇼핑', '구매', '판매', '서비스', '고객', '시장'],
      
      // 기술 과학
      tech: ['기술', '과학', '컴퓨터', '인터넷', '프로그램', '데이터', '인공지능', '로봇', '폰', '게임', '웹사이트', '앱', '소프트웨어', '하드웨어', '전자', '디지털', '온라인', '오프라인'],
      
      // 건강 의료
      health: ['건강', '병원', '의사', '약', '운동', '몸', '마음', '정신', '치료', '간호사', '수술', '검사', '진료', '응급', '안전', '위험', '사고', '보험', '예방', '회복'],
      
      // 음악 예술
      art: ['음악', '노래', '악기', '피아노', '기타', '드럼', '춤', '그림', '사진', '영화', '연극', '소설', '시', '만화', '조각', '전시', '공연', '콘서트', '박물관', '갤러리']
    };
    
    // Check if words are in same semantic group - high similarity
    for (const group of Object.values(semanticGroups)) {
      if (group.includes(word1) && group.includes(word2)) {
        // Calculate position-based similarity within group
        const pos1 = group.indexOf(word1);
        const pos2 = group.indexOf(word2);
        const distance = Math.abs(pos1 - pos2);
        const similarity = Math.max(0.7, 0.95 - (distance * 0.02)); // 0.7-0.95 range
        console.log(`🎯 Semantic group similarity: "${word1}" vs "${word2}" = ${similarity.toFixed(3)}`);
        return similarity;
      }
    }
    
    // Character-level similarity for Korean morphology
    const charSimilarity = this.calculateCharacterSimilarity(word1, word2);
    if (charSimilarity > 0.6) {
      const similarity = charSimilarity * 0.6; // Maximum 0.6 for character similarity
      console.log(`🔤 Character similarity: "${word1}" vs "${word2}" = ${similarity.toFixed(3)}`);
      return similarity;
    }
    
    // Length and structure similarity
    const lengthSimilarity = this.calculateLengthSimilarity(word1, word2);
    
    // Random baseline for unrelated words (following semantle-ko patterns)
    // Ensure minimum similarity to avoid 0 scores (like real word2vec)
    const randomBaseline = 0.20 + (Math.random() * 0.20); // 0.20-0.40 range
    const finalSimilarity = Math.max(randomBaseline, lengthSimilarity * 0.4);
    
    console.log(`🎲 Baseline similarity: "${word1}" vs "${word2}" = ${finalSimilarity.toFixed(3)}`);
    return finalSimilarity;
  }
  
  private calculateCharacterSimilarity(word1: string, word2: string): number {
    const chars1 = word1.split('');
    const chars2 = word2.split('');
    const commonChars = chars1.filter(char => chars2.includes(char)).length;
    const totalChars = Math.max(chars1.length, chars2.length);
    return commonChars / totalChars;
  }
  
  private calculateLengthSimilarity(word1: string, word2: string): number {
    const lengthDiff = Math.abs(word1.length - word2.length);
    const maxLength = Math.max(word1.length, word2.length);
    return 1 - (lengthDiff / maxLength);
  }

  // Pure cosine similarity calculation (based on semantle-ko's word2vec.py)
  // return vec1.dot(vec2) / (norm(vec1) * norm(vec2))
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vector dimensions must match');
    }
    
    // Calculate dot product
    let dotProduct = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
    }
    
    // Calculate norms (magnitudes)
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    // Prevent division by zero
    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }
    
    // Return cosine similarity: vec1.dot(vec2) / (norm(vec1) * norm(vec2))
    return dotProduct / (norm1 * norm2);
  }

  isValidWord(word: string): boolean {
    // 개발 모드에서는 한국어 단어면 허용
    if (process.env.NODE_ENV === 'development') {
      // 한국어 문자가 포함되어 있고 1-10글자 사이면 허용
      const koreanRegex = /^[가-힣]{1,10}$/;
      return koreanRegex.test(word);
    }
    
    return this.wordVectors.has(word);
  }

  getRandomWord(): string {
    // Use frequent words for better game experience
    if (this.frequentWords.length > 0) {
      // Pick from top frequent words for better gameplay
      const topWords = this.frequentWords.slice(0, 200); // Use top 200 words
      return topWords[Math.floor(Math.random() * topWords.length)];
    }
    
    // Fallback to wordVectors if frequent words not available
    const words = Array.from(this.wordVectors.keys());
    return words[Math.floor(Math.random() * words.length)];
  }

  getSuggestions(query: string, limit: number = 8): string[] {
    const words = Array.from(this.wordVectors.keys());
    return words
      .filter(word => word.includes(query))
      .slice(0, limit);
  }

  private getRankFromScore(score: number): string {
    if (score >= 95) return "상위 10위";
    if (score >= 85) return "상위 50위"; 
    if (score >= 75) return "상위 100위";
    if (score >= 60) return "상위 500위";
    if (score >= 45) return "상위 1000위";
    return "1000위 이상";
  }
}

export const word2vecService = new Word2VecService();

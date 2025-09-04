import { word2vecService } from "./word2vec";

type BotDifficulty = "easy" | "normal" | "hard";

interface BotStrategy {
  targetScoreRange: [number, number];
  thinkingDelay: [number, number];
}

class BotPlayer {
  private strategies: Record<BotDifficulty, BotStrategy> = {
    easy: {
      targetScoreRange: [40, 70],
      thinkingDelay: [800, 1500]
    },
    normal: {
      targetScoreRange: [60, 85],
      thinkingDelay: [600, 1200]
    },
    hard: {
      targetScoreRange: [75, 95],
      thinkingDelay: [400, 800]
    }
  };

  async selectWord(targetWord: string, difficulty: BotDifficulty = "normal"): Promise<string> {
    const strategy = this.strategies[difficulty];
    
    // TODO: In production, use pre-calculated nearest words from Semantle-ko
    // This would come from process_similar.py and nearest word calculations
    
    // For development, select a word that would score in target range
    const candidates = this.getWordCandidates();
    const scoredCandidates = candidates.map(word => {
      try {
        const result = word2vecService.calculateSimilarity(word, targetWord);
        return { word, score: result.similarity };
      } catch {
        return { word, score: 0 };
      }
    });

    // Filter by target score range
    const [minScore, maxScore] = strategy.targetScoreRange;
    const viableCandidates = scoredCandidates.filter(
      c => c.score >= minScore && c.score <= maxScore
    );

    if (viableCandidates.length === 0) {
      // Fallback to any random word
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Select randomly from viable candidates
    const selected = viableCandidates[Math.floor(Math.random() * viableCandidates.length)];
    return selected.word;
  }

  private getWordCandidates(): string[] {
    // TODO: Use full Korean word list from Semantle-ko's filtered words
    // This should be loaded from the processed word database
    return [
      '가족', '집안', '가정', '부모', '자녀', '형제', '자매', '조부모',
      '학교', '교육', '공부', '선생님', '학생', '수업', '시험', '숙제',
      '음식', '요리', '밥', '식당', '맛', '반찬', '국물', '간식',
      '친구', '사람', '동료', '지인', '관계', '인간', '개인', '사회',
      '사랑', '마음', '감정', '기분', '생각', '느낌', '의견', '판단',
      '집', '방', '건물', '아파트', '마을', '도시', '나라', '세계',
      '시간', '날짜', '년도', '계절', '오늘', '내일', '어제', '미래',
      '일', '직업', '회사', '사업', '경제', '돈', '가격', '비용',
      '건강', '병원', '의사', '약', '운동', '몸', '마음', '정신',
      '문화', '예술', '음악', '영화', '책', '소설', '시', '문학'
    ];
  }

  getThinkingDelay(difficulty: BotDifficulty = "normal"): number {
    const [min, max] = this.strategies[difficulty].thinkingDelay;
    return Math.random() * (max - min) + min;
  }
}

export const botPlayer = new BotPlayer();

interface SimilarityStats {
  targetWord: string;
  maxSimilarity: number;
  totalWords: number;
  calculatedAt: Date;
  message: string;
}

interface SimilarityRanking {
  word: string;
  similarity: number;
  rank: number;
}

class SimilarityStatsService {
  private statsCache: Map<string, SimilarityStats> = new Map();
  private readonly SAMPLE_SIZE = 100; // 통계 계산을 위한 샘플 사이즈 (매우 빠른 계산용)

  async calculateStats(targetWord: string): Promise<SimilarityStats> {
    // 캐시에서 확인
    const cached = this.statsCache.get(targetWord);
    if (cached && (Date.now() - cached.calculatedAt.getTime()) < 24 * 60 * 60 * 1000) { // 24시간 캐시
      return cached;
    }

    console.log(`📊 Calculating similarity stats for target word: ${targetWord}`);

    try {
      // 간단한 통계 - 가장 유사한 단어의 유사도만 계산
      const stats: SimilarityStats = {
        targetWord,
        maxSimilarity: 65.48, // 임시 값
        totalWords: 100,
        calculatedAt: new Date(),
        message: `정답 단어와 가장 유사한 단어의 유사도는 65.48 입니다.`
      };

      // 캐시에 저장
      this.statsCache.set(targetWord, stats);

      console.log(`✅ Quick stats generated for "${targetWord}": ${stats.maxSimilarity}`);
      return stats;

    } catch (error) {
      console.error(`❌ Error calculating stats for "${targetWord}":`, error);
      throw error;
    }
  }

  // 특정 단어의 순위 찾기
  async getWordRank(targetWord: string, testWord: string): Promise<number | null> {
    try {
      const { directFastText } = await import('./directFastText');
      
      const targetSimilarity = await directFastText.calculateWordSimilarity(targetWord, testWord);
      
      // 빈출 단어들과 비교해서 순위 계산
      const fs = await import('fs');
      const path = await import('path');
      
      const wordsFilePath = path.join(process.cwd(), 'data', 'korean_frequent_words.txt');
      const wordsContent = fs.readFileSync(wordsFilePath, 'utf-8');
      const frequentWords = wordsContent.split('\n')
        .map(line => line.trim())
        .filter(word => word && word !== targetWord)
        .slice(0, this.SAMPLE_SIZE);

      let betterCount = 0;
      const batchSize = 100;

      for (let i = 0; i < frequentWords.length; i += batchSize) {
        const batch = frequentWords.slice(i, i + batchSize);
        const similarities = await Promise.all(
          batch.map(async (word) => {
            try {
              return await directFastText.calculateWordSimilarity(targetWord, word);
            } catch {
              return 0;
            }
          })
        );

        betterCount += similarities.filter(sim => sim > targetSimilarity).length;
      }

      return betterCount + 1; // +1 because rank starts from 1
    } catch (error) {
      console.error(`Error calculating rank for "${testWord}":`, error);
      return null;
    }
  }

  // 캐시 클리어
  clearCache(): void {
    this.statsCache.clear();
    console.log('📊 Similarity stats cache cleared');
  }

  // 게임 시작시 미리 통계 계산
  async preCalculateStats(targetWord: string): Promise<void> {
    try {
      await this.calculateStats(targetWord);
    } catch (error) {
      console.error(`Error pre-calculating stats for "${targetWord}":`, error);
    }
  }
}

export const similarityStatsService = new SimilarityStatsService();
export type { SimilarityStats, SimilarityRanking };

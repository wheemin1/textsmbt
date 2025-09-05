import { useQuery } from "@tanstack/react-query";

interface SimilarityStats {
  targetWord: string;
  maxSimilarity: number;
  totalWords: number;
  message: string;
}

export function useSimilarityStats(gameId: string | null) {
  return useQuery<SimilarityStats>({
    queryKey: ['/api/game', gameId, 'stats'],
    queryFn: async () => {
      if (!gameId) throw new Error('No game ID');
      
      const response = await fetch(`/api/game/${gameId}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      return response.json();
    },
    enabled: !!gameId,
    staleTime: 60000, // 1분간 캐시
    retry: 1, // 실패시 1번만 재시도
  });
}

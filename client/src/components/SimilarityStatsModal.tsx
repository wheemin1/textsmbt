import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Target, BarChart3 } from 'lucide-react';

interface SimilarityStats {
  targetWord: string;
  maxSimilarity: number;
  rank10Similarity: number;
  rank100Similarity?: number;
  rank1000Similarity?: number;
  totalWords: number;
  message: string;
  details: string;
}

interface SimilarityStatsProps {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SimilarityStatsModal({ gameId, isOpen, onClose }: SimilarityStatsProps) {
  const [stats, setStats] = useState<SimilarityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/game/${gameId}/stats`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '통계를 가져올 수 없습니다');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '통계 조회 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && gameId) {
      fetchStats();
    }
  }, [isOpen, gameId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg">유사도 통계</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          <CardDescription>
            이번 게임의 정답 단어에 대한 유사도 통계입니다
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">통계 계산 중...</span>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={fetchStats}
              >
                다시 시도
              </Button>
            </div>
          )}
          
          {stats && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Target className="w-4 h-4" />
                  정답 단어: <span className="font-medium">{stats.targetWord}</span>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {stats.message}
                  </p>
                  <p className="text-sm text-blue-800 mt-2 leading-relaxed">
                    {stats.details}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  상세 통계
                </h4>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <div className="text-green-600 font-medium">최고 유사도</div>
                    <div className="text-green-900 text-lg font-bold">
                      {stats.maxSimilarity}%
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded p-3">
                    <div className="text-orange-600 font-medium">10위 유사도</div>
                    <div className="text-orange-900 text-lg font-bold">
                      {stats.rank10Similarity}%
                    </div>
                  </div>
                  
                  {stats.rank100Similarity && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <div className="text-yellow-600 font-medium">100위 유사도</div>
                      <div className="text-yellow-900 text-lg font-bold">
                        {stats.rank100Similarity}%
                      </div>
                    </div>
                  )}
                  
                  {stats.rank1000Similarity && (
                    <div className="bg-purple-50 border border-purple-200 rounded p-3">
                      <div className="text-purple-600 font-medium">1000위 유사도</div>
                      <div className="text-purple-900 text-lg font-bold">
                        {stats.rank1000Similarity}%
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                  <div className="text-gray-600 text-xs">분석된 단어 수</div>
                  <div className="text-gray-900 font-bold">
                    {stats.totalWords.toLocaleString()}개
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  💡 높은 점수를 얻기 위해 상위 유사도 범위의 단어를 찾아보세요!
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SimilarityStatsModal;

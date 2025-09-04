import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { websocketManager } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";

export interface GameStateHook {
  gameId: string | null;
  gameState: any;
  isLoading: boolean;
  error: string | null;
  submitWord: (word: string) => Promise<void>;
  timeRemaining: number;
}

export function useGameState(gameId: string | null): GameStateHook {
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch game status
  const { data: gameState, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/game-status', gameId],
    enabled: !!gameId,
    refetchInterval: 1000, // Poll every second during active game
  });

  // WebSocket for real-time updates
  useEffect(() => {
    if (!gameId) return;

    const connectWS = async () => {
      try {
        await websocketManager.connect();
        websocketManager.joinGame(gameId);
      } catch (error) {
        console.error('WebSocket connection failed:', error);
      }
    };

    connectWS();

    // Subscribe to game events
    const unsubscribeGameFound = websocketManager.subscribe('game_found', (message) => {
      if (message.gameId === gameId) {
        toast({
          title: "게임 시작",
          description: message.isBot ? "봇과의 대전이 시작됩니다!" : "상대방을 찾았습니다!",
        });
        refetch();
      }
    });

    const unsubscribeRoundComplete = websocketManager.subscribe('round_complete', (message) => {
      if (message.result.gameId === gameId) {
        toast({
          title: `라운드 ${message.result.round} 완료`,
          description: `내 점수: ${message.result.myScore}점, 상대 점수: ${message.result.opponentScore}점`,
        });
        refetch();
      }
    });

    return () => {
      unsubscribeGameFound();
      unsubscribeRoundComplete();
    };
  }, [gameId, refetch, toast]);

  // Timer countdown
  useEffect(() => {
    if (!gameState || gameState.status !== 'active') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState?.currentRound]);

  // Reset timer when round changes
  useEffect(() => {
    if (gameState?.currentRound) {
      setTimeRemaining(15);
    }
  }, [gameState?.currentRound]);

  const submitWord = async (word: string) => {
    if (!gameId || isSubmitting) return;
    
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      setIsSubmitting(true);
      await api.submitWord(gameId, userId, word);
      
      toast({
        title: "단어 제출 완료",
        description: "상대방의 제출을 기다리고 있습니다...",
      });
      
      // Refetch to get updated state
      refetch();
    } catch (error: any) {
      console.error('Submit word error:', error);
      
      let errorMessage = "단어 제출 중 오류가 발생했습니다";
      if (error.message.includes("INVALID_WORD")) {
        errorMessage = "사전에 없는 단어입니다";
      } else if (error.message.includes("ALREADY_SUBMITTED")) {
        errorMessage = "이미 이 라운드에 단어를 제출했습니다";
      } else if (error.message.includes("WORD_CONFLICT")) {
        errorMessage = "상대방이 이미 사용한 단어입니다";
      } else if (error.message.includes("WORD_REUSE")) {
        errorMessage = "이전 라운드에서 사용한 단어는 다시 사용할 수 없습니다";
      }
      
      toast({
        variant: "destructive",
        title: "제출 실패",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    gameId,
    gameState,
    isLoading,
    error: error?.message || null,
    submitWord,
    timeRemaining,
  };
}

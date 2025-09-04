import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface WordInputProps {
  onSubmit: (word: string) => Promise<void>;
  disabled?: boolean;
  gameId: string | null;
}

export default function WordInput({ onSubmit, disabled = false, gameId }: WordInputProps) {
  const [word, setWord] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch word suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['/api/words/suggest', word],
    enabled: word.length >= 1,
    staleTime: 30000, // Cache suggestions for 30 seconds
  }) as { data?: { suggestions: string[] } };

  useEffect(() => {
    if (word.length >= 1 && suggestions?.suggestions?.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [word, suggestions]);

  const handleSubmit = async () => {
    if (!word.trim() || isSubmitting || disabled) return;
    
    try {
      setIsSubmitting(true);
      setShowSuggestions(false);
      await onSubmit(word.trim());
      setWord("");
    } catch (error) {
      console.error('Word submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setWord(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <Card className="bg-card shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
      <CardContent className="p-8 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-card-foreground mb-2">단어를 입력하세요</h2>
          <p className="text-muted-foreground">목표 단어와 가장 유사한 의미의 단어를 찾아보세요</p>
        </div>
        
        <div className="max-w-md mx-auto space-y-4 relative">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="단어를 입력하세요..."
              className="h-16 text-lg font-medium text-center"
              disabled={disabled || isSubmitting}
              data-testid="input-word"
              autoFocus
            />
            
            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions?.suggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto z-20">
                {suggestions.suggestions.map((suggestion: string, index: number) => (
                  <div
                    key={`${suggestion}-${index}`}
                    className="px-4 py-3 hover:bg-accent/10 cursor-pointer border-b border-border last:border-b-0 transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                    data-testid={`suggestion-${index}`}
                  >
                    <span className="text-popover-foreground">{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button
            size="lg"
            className="w-full h-14 font-semibold"
            onClick={handleSubmit}
            disabled={!word.trim() || disabled || isSubmitting}
            data-testid="button-submit-word"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner animate-spin mr-2"></i>
                제출 중...
              </>
            ) : (
              <>
                <i className="fas fa-check mr-2"></i>
                제출하기
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

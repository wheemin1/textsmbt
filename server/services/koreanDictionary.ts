// Korean dictionary service using hunspell dictionary
// Validates Korean words using ko-aff-dic-0.7.92

import fs from 'fs';
import path from 'path';

interface DictionaryEntry {
  word: string;
  flags: string;
}

class KoreanDictionaryService {
  private validWords: Set<string> = new Set();
  private isLoaded = false;

  constructor() {
    this.init();
  }

  async init() {
    if (!this.isLoaded) {
      await this.loadDictionary();
    }
  }

  // Load Korean dictionary from ko-aff-dic-0.7.92
  private async loadDictionary(): Promise<void> {
    try {
      const dictPath = path.join(process.cwd(), 'ko-aff-dic-0.7.92', 'ko.dic');
      const content = fs.readFileSync(dictPath, 'utf-8');
      
      const lines = content.split('\n');
      // Skip first line (word count)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          // Parse dictionary entry: word/flags
          const [word] = line.split('/');
          if (word && word.length > 0) {
            this.validWords.add(word);
          }
        }
      }
      
      this.isLoaded = true;
      console.log(`✅ Loaded ${this.validWords.size} Korean words from dictionary`);
    } catch (error) {
      console.error('❌ Failed to load Korean dictionary:', error);
      this.isLoaded = false;
    }
  }

  // Check if a word is valid Korean
  isValidKoreanWord(word: string): boolean {
    if (!this.isLoaded) {
      console.warn('⚠️ Dictionary not loaded, allowing word:', word);
      return true; // Allow if dictionary not loaded
    }
    
    return this.validWords.has(word);
  }

  // Get all valid words as array
  getAllWords(): string[] {
    return Array.from(this.validWords);
  }

  // Get dictionary statistics
  getDictionaryStats() {
    return {
      totalWords: this.validWords.size,
      isLoaded: this.isLoaded
    };
  }

  // Check multiple words at once
  validateWords(words: string[]): { [key: string]: boolean } {
    const results: { [key: string]: boolean } = {};
    
    for (const word of words) {
      results[word] = this.isValidKoreanWord(word);
    }
    
    return results;
  }

  // Find similar words (basic implementation)
  findSimilarWords(word: string, maxResults: number = 10): string[] {
    if (!this.isLoaded) return [];
    
    const similar: string[] = [];
    const wordLower = word.toLowerCase();
    
    // Convert Set to Array for iteration
    const dictWords = Array.from(this.validWords);
    for (const dictWord of dictWords) {
      if (dictWord.includes(wordLower) || wordLower.includes(dictWord)) {
        similar.push(dictWord);
        if (similar.length >= maxResults) break;
      }
    }
    
    return similar;
  }
}

// Export singleton instance
export const koreanDictionary = new KoreanDictionaryService();
export default koreanDictionary;

import { useState, useEffect } from "react";

interface Definition {
  definition: string;
  example?: string;
  synonyms?: string[];
}

interface WordMeaning {
  partOfSpeech: string;
  definitions: Definition[];
}

interface DictionaryEntry {
  word: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: WordMeaning[];
  error?: boolean;
}

export function useWordDefinition(word: string): {
  data: DictionaryEntry | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<DictionaryEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!word) return;
    
    const fetchDefinition = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`);
        
        if (!response.ok) {
          // Handle 404 (word not found) or other API errors
          if (response.status === 404) {
            setData({
              word,
              phonetics: [],
              meanings: [],
              error: true
            });
          } else {
            throw new Error(`API Error: ${response.status}`);
          }
          return;
        }
        
        const data = await response.json();
        // API returns an array of entries, we use the first one
        setData(data[0] || null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        console.error('Error fetching word definition:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDefinition();
  }, [word]);

  return { data, isLoading, error };
}
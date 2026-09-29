import { useState, useEffect } from 'react';

export function useGhostSuggestion(step: number, currentText: string, context: any) {
  const [suggestion, setSuggestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestion = async () => {
      if (!currentText || currentText.length < 3) {
        setSuggestion('');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step,
            currentText,
            context,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestion(data.suggestion || '');
        }
      } catch (error) {
        console.error("Suggestion fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestion, 800); // Debounce to prevent API spam
    return () => clearTimeout(timer);
  }, [step, currentText, context]);

  return { suggestion, isLoading, setSuggestion };
}

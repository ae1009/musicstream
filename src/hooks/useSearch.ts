import { useState, useEffect, useRef } from 'react';
import { searchApi, UnifiedSearchResult } from '../services/api/search';

const EMPTY: UnifiedSearchResult = { tracks: [], podcasts: [], youtube: [], total: 0 };

export function useSearch(sources: ('music' | 'podcasts' | 'youtube')[] = ['music', 'podcasts']) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnifiedSearchResult>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    if (!query.trim()) {
      setResults(EMPTY);
      return;
    }

    timer.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchApi.unified(query.trim(), sources);
        setResults(data);
      } catch {
        setError('Error al buscar. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  return { query, setQuery, results, loading, error };
}

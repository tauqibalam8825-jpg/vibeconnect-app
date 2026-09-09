import { useCallback, useEffect, useState } from 'react';
import { WPCategory } from '../api/types';
import { fetchCategories } from '../api/wordpress';

export function useCategories() {
  const [categories, setCategories] = useState<WPCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await fetchCategories();
      setCategories(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    categories,
    loading,
    error,
    refreshing,
    refresh: () => load(true),
  };
}

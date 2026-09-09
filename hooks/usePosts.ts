/** Paginated posts hook with pull-to-refresh + infinite scroll. */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppPost, PostsQuery } from '../api/types';
import { fetchPosts } from '../api/wordpress';

interface Options extends PostsQuery {
  enabled?: boolean;
}

export function usePosts(options: Options = {}) {
  const { enabled = true, ...query } = options;
  const [posts, setPosts] = useState<AppPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryKey = JSON.stringify(query);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(
    async (pageNum: number, mode: 'replace' | 'append' | 'refresh') => {
      if (!enabled) return;
      try {
        if (mode === 'replace') setLoading(true);
        if (mode === 'refresh') setRefreshing(true);
        if (mode === 'append') setLoadingMore(true);
        setError(null);

        const result = await fetchPosts({ ...query, page: pageNum });
        if (!mounted.current) return;

        setTotalPages(result.totalPages || 1);
        setPage(pageNum);
        setPosts((prev) =>
          mode === 'append' ? [...prev, ...result.posts] : result.posts
        );
      } catch (e: unknown) {
        if (!mounted.current) return;
        setError(e instanceof Error ? e.message : 'Failed to load posts');
      } finally {
        if (!mounted.current) return;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, queryKey]
  );

  useEffect(() => {
    setPosts([]);
    setPage(1);
    load(1, 'replace');
  }, [load]);

  const refresh = useCallback(() => load(1, 'refresh'), [load]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || refreshing) return;
    if (page >= totalPages) return;
    load(page + 1, 'append');
  }, [load, loading, loadingMore, refreshing, page, totalPages]);

  return {
    posts,
    loading,
    refreshing,
    loadingMore,
    error,
    refresh,
    loadMore,
    hasMore: page < totalPages,
  };
}

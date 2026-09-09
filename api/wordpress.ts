/**
 * WordPress REST API client
 *
 * Talks to any self-hosted WP site exposing /wp-json/wp/v2.
 * All network calls go through Axios with a shared base URL from config.
 *
 * Buyer tip: if your site uses a custom REST prefix or plain permalinks,
 * adjust `getBaseUrl()` accordingly.
 */

import axios, { AxiosInstance } from 'axios';
import config from '../config/config';
import {
  AppPost,
  PostsQuery,
  PostsResult,
  WPCategory,
  WPPost,
  WPTag,
} from './types';
import { getCache, setCache } from '../utils/storage';
import { decodeHtml, stripHtml } from '../utils/html';

function getBaseUrl(): string {
  const origin = config.wordpressUrl.replace(/\/+$/, '');
  return `${origin}/wp-json/wp/v2`;
}

let client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!client || client.defaults.baseURL !== getBaseUrl()) {
    client = axios.create({
      baseURL: getBaseUrl(),
      timeout: 20000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }
  return client;
}

/** Reset client after buyer changes wordpressUrl at runtime (Settings). */
export function resetApiClient(): void {
  client = null;
}

/** Pick the best available image URL from embedded media. */
function pickImage(post: WPPost): {
  url?: string;
  width?: number;
  height?: number;
} {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (!media) return {};

  const sizes = media.media_details?.sizes;
  // Prefer medium_large → large → medium → full for feed performance
  const preferred =
    sizes?.medium_large || sizes?.large || sizes?.medium || sizes?.full;

  return {
    url: preferred?.source_url || media.source_url,
    width: preferred?.width || media.media_details?.width,
    height: preferred?.height || media.media_details?.height,
  };
}

/** Map raw WP post → app-friendly shape */
export function normalizePost(post: WPPost): AppPost {
  const author = post._embedded?.author?.[0];
  const terms = post._embedded?.['wp:term'] || [];
  const cats = (terms[0] || []) as { id: number; name: string; taxonomy?: string }[];
  const tags = (terms[1] || []) as { id: number; name: string }[];
  const image = pickImage(post);

  return {
    id: post.id,
    title: decodeHtml(post.title?.rendered || ''),
    excerpt: stripHtml(post.excerpt?.rendered || ''),
    content: post.content?.rendered || '',
    date: post.date,
    link: post.link,
    slug: post.slug,
    authorName: author?.name || 'Staff',
    authorAvatar: author?.avatar_urls?.['96'] || author?.avatar_urls?.['48'],
    imageUrl: image.url,
    imageWidth: image.width,
    imageHeight: image.height,
    categories: cats.map((c) => ({ id: c.id, name: decodeHtml(c.name) })),
    tags: tags.map((t) => ({ id: t.id, name: decodeHtml(t.name) })),
    categoryIds: post.categories || [],
  };
}

/**
 * Fetch paginated posts with optional filters.
 * Uses _embed so featured media + author arrive in one request.
 */
export async function fetchPosts(query: PostsQuery = {}): Promise<PostsResult> {
  const {
    page = 1,
    perPage = config.postsPerPage,
    categories,
    tags,
    search,
    orderby = 'date',
    order = 'desc',
  } = query;

  const params: Record<string, string | number> = {
    page,
    per_page: perPage,
    _embed: '1',
    orderby,
    order,
  };

  if (categories?.length) params.categories = categories.join(',');
  if (tags?.length) params.tags = tags.join(',');
  if (search?.trim()) params.search = search.trim();

  const cacheKey = `posts:${JSON.stringify(params)}`;

  // Serve fresh-enough cache instantly (stale-while-configure pattern)
  if (page === 1 && !search) {
    const cached = await getCache<PostsResult>(cacheKey);
    if (cached) {
      // Kick off network refresh but return cache for snappy UI
      // Caller can still pull-to-refresh for forced network.
    }
  }

  try {
    const res = await getClient().get<WPPost[]>('/posts', { params });
    const total = parseInt(res.headers['x-wp-total'] || '0', 10);
    const totalPages = parseInt(res.headers['x-wp-totalpages'] || '0', 10);
    const result: PostsResult = {
      posts: (res.data || []).map(normalizePost),
      total,
      totalPages,
    };

    if (page === 1 && !search) {
      await setCache(cacheKey, result, config.cacheTtlSeconds);
    }

    return result;
  } catch (err: unknown) {
    // Fallback to cache on network failure
    const cached = await getCache<PostsResult>(cacheKey);
    if (cached) return cached;
    throw normalizeError(err);
  }
}

/** Single post by ID */
export async function fetchPost(id: number): Promise<AppPost> {
  const cacheKey = `post:${id}`;
  try {
    const res = await getClient().get<WPPost>(`/posts/${id}`, {
      params: { _embed: '1' },
    });
    const post = normalizePost(res.data);
    await setCache(cacheKey, post, config.cacheTtlSeconds);
    return post;
  } catch (err: unknown) {
    const cached = await getCache<AppPost>(cacheKey);
    if (cached) return cached;
    throw normalizeError(err);
  }
}

/** All categories (cached aggressively — rarely change) */
export async function fetchCategories(): Promise<WPCategory[]> {
  const cacheKey = 'categories:all';
  try {
    const res = await getClient().get<WPCategory[]>('/categories', {
      params: { per_page: 100, hide_empty: true, orderby: 'count', order: 'desc' },
    });
    const data = res.data || [];
    await setCache(cacheKey, data, config.cacheTtlSeconds * 4);
    return data;
  } catch (err: unknown) {
    const cached = await getCache<WPCategory[]>(cacheKey);
    if (cached) return cached;
    throw normalizeError(err);
  }
}

/** Tags list */
export async function fetchTags(): Promise<WPTag[]> {
  const cacheKey = 'tags:all';
  try {
    const res = await getClient().get<WPTag[]>('/tags', {
      params: { per_page: 50, hide_empty: true, orderby: 'count', order: 'desc' },
    });
    const data = res.data || [];
    await setCache(cacheKey, data, config.cacheTtlSeconds * 4);
    return data;
  } catch (err: unknown) {
    const cached = await getCache<WPTag[]>(cacheKey);
    if (cached) return cached;
    throw normalizeError(err);
  }
}

/** Lightweight connectivity / config check used by Settings */
export async function pingWordPress(url?: string): Promise<{ ok: boolean; name?: string; error?: string }> {
  try {
    const origin = (url || config.wordpressUrl).replace(/\/+$/, '');
    const res = await axios.get(`${origin}/wp-json`, { timeout: 12000 });
    return { ok: true, name: res.data?.name || origin };
  } catch (err: unknown) {
    return { ok: false, error: normalizeError(err).message };
  }
}

function normalizeError(err: unknown): Error {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED') return new Error('Request timed out. Check your connection.');
    if (err.response?.status === 404) return new Error('WordPress REST API not found. Is the URL correct?');
    if (err.response?.status === 403) return new Error('Access forbidden. Check REST API permissions.');
    if (!err.response) return new Error('Network error. Please check your connection and site URL.');
    return new Error(err.response?.data?.message || err.message || 'Something went wrong.');
  }
  if (err instanceof Error) return err;
  return new Error('Unexpected error talking to WordPress.');
}

/**
 * WordPress REST API type definitions (wp/v2)
 * Docs: https://developer.wordpress.org/rest-api/
 */

export interface WPRendered {
  rendered: string;
  protected?: boolean;
}

export interface WPMediaSizes {
  thumbnail?: WPMediaSize;
  medium?: WPMediaSize;
  medium_large?: WPMediaSize;
  large?: WPMediaSize;
  full?: WPMediaSize;
  [key: string]: WPMediaSize | undefined;
}

export interface WPMediaSize {
  file?: string;
  width: number;
  height: number;
  mime_type?: string;
  source_url: string;
}

export interface WPMedia {
  id: number;
  source_url: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: WPMediaSizes;
  };
}

export interface WPAuthor {
  id: number;
  name: string;
  url?: string;
  description?: string;
  slug?: string;
  avatar_urls?: Record<string, string>;
}

export interface WPCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  parent: number;
}

export interface WPTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
}

export interface WPPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: WPRendered;
  content: WPRendered;
  excerpt: WPRendered;
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  /** Embedded resources when requested with _embed */
  _embedded?: {
    author?: WPAuthor[];
    'wp:featuredmedia'?: WPMedia[];
    'wp:term'?: Array<Array<WPCategory | WPTag>>;
  };
}

/** Normalized post used throughout the UI layer */
export interface AppPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  link: string;
  slug: string;
  authorName: string;
  authorAvatar?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  categories: { id: number; name: string }[];
  tags: { id: number; name: string }[];
  categoryIds: number[];
}

export interface PostsQuery {
  page?: number;
  perPage?: number;
  categories?: number[];
  tags?: number[];
  search?: string;
  orderby?: 'date' | 'relevance' | 'id' | 'title' | 'slug';
  order?: 'asc' | 'desc';
}

export interface PostsResult {
  posts: AppPost[];
  total: number;
  totalPages: number;
}

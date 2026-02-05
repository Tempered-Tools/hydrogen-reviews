/**
 * @tempered/hydrogen-reviews/server
 *
 * Server-side utilities for fetching reviews data.
 * Use these functions in Hydrogen loaders for SSR.
 *
 * @example
 * ```tsx
 * import { fetchReviews, fetchRatingSummary } from '@tempered/hydrogen-reviews/server';
 *
 * export async function loader({ params, context }) {
 *   const { handle } = params;
 *   const product = await context.storefront.query(PRODUCT_QUERY, {
 *     variables: { handle },
 *   });
 *
 *   const reviews = await fetchReviews({
 *     apiUrl: context.env.LITEREVIEWS_API_URL,
 *     apiKey: context.env.LITEREVIEWS_API_KEY,
 *     productId: product.id,
 *     limit: 10,
 *   });
 *
 *   return { product, reviews };
 * }
 * ```
 */

import type {
  Review,
  RatingSummary,
  ReviewsResponse,
  ReviewSortOption,
  ReviewFilters,
} from './types.js';

export interface ServerFetchOptions {
  /**
   * LiteReviews API base URL
   */
  apiUrl: string;

  /**
   * API key for authentication (required if shopDomain not provided)
   */
  apiKey?: string;

  /**
   * Shop domain for authentication (required if apiKey not provided)
   * @example "my-store.myshopify.com"
   */
  shopDomain?: string;

  /**
   * Product ID to fetch reviews for
   */
  productId: string;

  /**
   * Page number (default: 1)
   */
  page?: number;

  /**
   * Reviews per page (default: 10)
   */
  limit?: number;

  /**
   * Sort order
   */
  sort?: ReviewSortOption;

  /**
   * Filter options
   */
  filters?: ReviewFilters;
}

/**
 * Fetch reviews from the LiteReviews API.
 * Use this in Hydrogen loaders for server-side rendering.
 */
export async function fetchReviews(options: ServerFetchOptions): Promise<ReviewsResponse> {
  const {
    apiUrl,
    apiKey,
    shopDomain,
    productId,
    page = 1,
    limit = 10,
    sort = 'newest',
    filters = {},
  } = options;

  if (!apiKey && !shopDomain) {
    throw new Error('Either apiKey or shopDomain is required');
  }

  const params = new URLSearchParams({
    productId,
    page: page.toString(),
    limit: limit.toString(),
    sort,
  });

  if (shopDomain) params.set('shop', shopDomain);
  if (filters.rating) params.set('rating', filters.rating.toString());
  if (filters.verifiedOnly) params.set('verifiedOnly', 'true');
  if (filters.withPhotos) params.set('withPhotos', 'true');

  const response = await fetch(`${apiUrl}/api/v1/reviews?${params}`, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch reviews: ${response.statusText}`);
  }

  return response.json();
}

export interface ServerRatingSummaryOptions {
  /**
   * LiteReviews API base URL
   */
  apiUrl: string;

  /**
   * API key for authentication (required if shopDomain not provided)
   */
  apiKey?: string;

  /**
   * Shop domain for authentication (required if apiKey not provided)
   * @example "my-store.myshopify.com"
   */
  shopDomain?: string;

  /**
   * Product ID to fetch rating for
   */
  productId: string;
}

/**
 * Fetch rating summary from the LiteReviews API.
 * Use this in Hydrogen loaders for server-side rendering.
 */
export async function fetchRatingSummary(
  options: ServerRatingSummaryOptions,
): Promise<RatingSummary> {
  const { apiUrl, apiKey, shopDomain, productId } = options;

  if (!apiKey && !shopDomain) {
    throw new Error('Either apiKey or shopDomain is required');
  }

  const params = new URLSearchParams({ productId });
  if (shopDomain) params.set('shop', shopDomain);

  const response = await fetch(
    `${apiUrl}/api/v1/ratings?${params}`,
    {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch rating summary: ${response.statusText}`);
  }

  return response.json();
}

export interface ServerBatchRatingsOptions {
  /**
   * LiteReviews API base URL
   */
  apiUrl: string;

  /**
   * API key for authentication (required if shopDomain not provided)
   */
  apiKey?: string;

  /**
   * Shop domain for authentication (required if apiKey not provided)
   * @example "my-store.myshopify.com"
   */
  shopDomain?: string;

  /**
   * Product IDs to fetch ratings for
   */
  productIds: string[];
}

/**
 * Fetch rating summaries for multiple products in a single request.
 * Use this for collection pages to display star ratings efficiently.
 */
export async function fetchBatchRatings(
  options: ServerBatchRatingsOptions,
): Promise<Record<string, RatingSummary>> {
  const { apiUrl, apiKey, shopDomain, productIds } = options;

  if (!apiKey && !shopDomain) {
    throw new Error('Either apiKey or shopDomain is required');
  }

  // Use GET with productIds query param (v1 API supports batch via query)
  const params = new URLSearchParams({
    productIds: productIds.join(','),
  });
  if (shopDomain) params.set('shop', shopDomain);

  const response = await fetch(
    `${apiUrl}/api/v1/ratings?${params}`,
    {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch batch ratings: ${response.statusText}`);
  }

  return response.json();
}

// Re-export types for convenience
export type { Review, RatingSummary, ReviewsResponse, ReviewSortOption, ReviewFilters };

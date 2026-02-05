/**
 * useReviews hook
 *
 * React hook for fetching and managing product reviews.
 */

import { useState, useEffect, useCallback } from 'react';

import { useReviewConfig } from '../components/ReviewProvider.js';

import type {
  Review,
  ReviewsResponse,
  FetchReviewsOptions,
  RatingSummary,
} from '../types.js';

interface UseReviewsReturn {
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  fetchReviews: (options?: Partial<FetchReviewsOptions>) => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  refresh: () => void;
}

/**
 * Hook for fetching and managing product reviews.
 *
 * @example
 * ```tsx
 * const {
 *   reviews,
 *   totalReviews,
 *   averageRating,
 *   isLoading,
 *   nextPage,
 *   prevPage,
 * } = useReviews({
 *   productId: product.id,
 *   limit: 10,
 *   sort: 'newest',
 * });
 * ```
 */
export function useReviews(options: FetchReviewsOptions): UseReviewsReturn {
  const config = useReviewConfig();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(options.page ?? 1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(
    async (fetchOptions?: Partial<FetchReviewsOptions>) => {
      setIsLoading(true);
      setError(null);

      const mergedOptions = { ...options, ...fetchOptions };
      const page = fetchOptions?.page ?? currentPage;

      try {
        const params = new URLSearchParams({
          productId: mergedOptions.productId,
          page: page.toString(),
          limit: (mergedOptions.limit ?? 10).toString(),
          sort: mergedOptions.sort ?? 'newest',
          shop: config.shopDomain,
        });

        if (mergedOptions.filters?.rating) {
          params.set('rating', mergedOptions.filters.rating.toString());
        }
        if (mergedOptions.filters?.verifiedOnly) {
          params.set('verifiedOnly', 'true');
        }
        if (mergedOptions.filters?.withPhotos) {
          params.set('withPhotos', 'true');
        }

        const response = await fetch(`${config.apiUrl}/api/v1/reviews?${params}`, {
          headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const data: ReviewsResponse = await response.json();
        setReviews(data.reviews);
        setTotalReviews(data.total);
        setAverageRating(data.averageRating);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [config, options, currentPage],
  );

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      fetchReviews({ page: currentPage + 1 });
    }
  }, [currentPage, totalPages, fetchReviews]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      fetchReviews({ page: currentPage - 1 });
    }
  }, [currentPage, fetchReviews]);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        fetchReviews({ page });
      }
    },
    [totalPages, fetchReviews],
  );

  const refresh = useCallback(() => {
    fetchReviews({ page: currentPage });
  }, [fetchReviews, currentPage]);

  return {
    reviews,
    totalReviews,
    averageRating,
    currentPage,
    totalPages,
    isLoading,
    error,
    fetchReviews,
    nextPage,
    prevPage,
    goToPage,
    refresh,
  };
}

interface UseRatingSummaryReturn {
  summary: RatingSummary | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook for fetching a product's rating summary.
 *
 * @example
 * ```tsx
 * const { summary, isLoading } = useRatingSummary(product.id);
 *
 * if (summary) {
 *   console.log(`Average: ${summary.averageRating}, Total: ${summary.totalReviews}`);
 * }
 * ```
 */
export function useRatingSummary(productId: string): UseRatingSummaryReturn {
  const config = useReviewConfig();

  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${config.apiUrl}/api/v1/ratings?productId=${encodeURIComponent(productId)}&shop=${encodeURIComponent(config.shopDomain)}`,
        {
          headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch rating summary');
      }

      const data: RatingSummary = await response.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [config, productId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    refresh: fetchSummary,
  };
}

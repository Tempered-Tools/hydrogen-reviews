/**
 * ReviewWidget
 *
 * Complete review widget combining ReviewList and ReviewForm.
 * This is the main component for displaying reviews on a product page.
 */

import { useState, useEffect, useCallback } from 'react';

import { useReviewConfig } from './ReviewProvider.js';
import { ReviewForm } from './ReviewForm.js';
import { ReviewList } from './ReviewList.js';
import { StarRating } from './StarRating.js';

import type { Review, ReviewsResponse, ReviewSortOption, ReviewFilters } from '../types.js';
import type { CSSProperties, ReactNode } from 'react';

export interface ReviewWidgetProps {
  /**
   * Product ID to display reviews for
   */
  productId: string;

  /**
   * Number of reviews per page (default: 5)
   */
  perPage?: number;

  /**
   * Enable review submission form
   */
  enableSubmission?: boolean;

  /**
   * Enable photo uploads in submission form
   */
  enablePhotoUpload?: boolean;

  /**
   * Show verified purchase badge
   */
  showVerifiedBadge?: boolean;

  /**
   * Show review photos
   */
  showPhotos?: boolean;

  /**
   * Show merchant responses
   */
  showMerchantResponse?: boolean;

  /**
   * Enable sorting controls
   */
  enableSorting?: boolean;

  /**
   * Enable filtering controls
   */
  enableFiltering?: boolean;

  /**
   * Custom header render
   */
  renderHeader?: (props: { averageRating: number; totalReviews: number }) => ReactNode;

  /**
   * Custom empty state render
   */
  renderEmpty?: () => ReactNode;

  /**
   * Custom loading state render
   */
  renderLoading?: () => ReactNode;

  /**
   * Additional CSS class
   */
  className?: string;

  /**
   * Additional inline styles
   */
  style?: CSSProperties;
}

/**
 * Complete review widget component.
 *
 * @example
 * ```tsx
 * <ReviewWidget
 *   productId={product.id}
 *   perPage={10}
 *   enableSubmission
 *   enablePhotoUpload
 *   showVerifiedBadge
 *   showPhotos
 * />
 * ```
 */
export function ReviewWidget({
  productId,
  perPage = 5,
  enableSubmission = true,
  enablePhotoUpload = false,
  showVerifiedBadge = true,
  showPhotos = true,
  showMerchantResponse = true,
  enableSorting = true,
  enableFiltering = false,
  renderHeader,
  renderEmpty,
  renderLoading,
  className = '',
  style,
}: ReviewWidgetProps) {
  const config = useReviewConfig();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<ReviewSortOption>('newest');
  const [filters, setFilters] = useState<ReviewFilters>({});

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        productId,
        page: currentPage.toString(),
        limit: perPage.toString(),
        sort,
        shop: config.shopDomain,
      });

      if (filters.rating) params.set('rating', filters.rating.toString());
      if (filters.verifiedOnly) params.set('verifiedOnly', 'true');
      if (filters.withPhotos) params.set('withPhotos', 'true');

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [config, productId, currentPage, perPage, sort, filters]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSortChange = (newSort: ReviewSortOption) => {
    setSort(newSort);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: ReviewFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSuccess = () => {
    // Refresh reviews after successful submission
    fetchReviews();
  };

  if (isLoading && reviews.length === 0) {
    if (renderLoading) {
      return <>{renderLoading()}</>;
    }
    return (
      <div className={className} style={{ textAlign: 'center', padding: '2rem', ...style }}>
        Loading reviews...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={className}
        style={{
          padding: '1rem',
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: 4,
          color: '#dc2626',
          ...style,
        }}
      >
        Error loading reviews: {error}
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      {/* Header */}
      {renderHeader ? (
        renderHeader({ averageRating, totalReviews })
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 600 }}>
              {averageRating > 0 ? averageRating.toFixed(1) : '-'}
            </span>
            <StarRating rating={Math.round(averageRating)} />
            <span style={{ color: '#666', fontSize: '0.875rem' }}>
              {totalReviews} review{totalReviews === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      {(enableSorting || enableFiltering) && totalReviews > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {enableSorting && (
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value as ReviewSortOption)}
              style={{ padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          )}

          {enableFiltering && (
            <>
              <select
                value={filters.rating?.toString() ?? ''}
                onChange={(e) => {
                  const newRating = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  handleFilterChange({ ...filters, rating: newRating });
                }}
                style={{ padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
              >
                <option value="">All ratings</option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} star{r === 1 ? '' : 's'}
                  </option>
                ))}
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly ?? false}
                  onChange={(e) => {
                    const newValue = e.target.checked ? true : undefined;
                    handleFilterChange({ ...filters, verifiedOnly: newValue });
                  }}
                />
                Verified only
              </label>

              {showPhotos && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={filters.withPhotos ?? false}
                    onChange={(e) => {
                      const newValue = e.target.checked ? true : undefined;
                      handleFilterChange({ ...filters, withPhotos: newValue });
                    }}
                  />
                  With photos
                </label>
              )}
            </>
          )}
        </div>
      )}

      {/* Review List */}
      <ReviewList
        reviews={reviews}
        showVerifiedBadge={showVerifiedBadge}
        showPhotos={showPhotos}
        showMerchantResponse={showMerchantResponse}
        renderEmpty={renderEmpty}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '1.5rem',
          }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ccc',
              background: '#fff',
              borderRadius: 4,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <span style={{ padding: '0.5rem 1rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ccc',
              background: '#fff',
              borderRadius: 4,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Submission Form */}
      {enableSubmission && (
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e5e5' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
            Write a review
          </h3>
          <ReviewForm
            productId={productId}
            enablePhotos={enablePhotoUpload}
            onSuccess={handleSuccess}
          />
        </div>
      )}
    </div>
  );
}

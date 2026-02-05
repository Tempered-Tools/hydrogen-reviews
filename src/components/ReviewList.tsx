/**
 * ReviewList
 *
 * Displays a list of product reviews.
 */

import { StarRating } from './StarRating.js';

import type { Review } from '../types.js';
import type { CSSProperties, ReactNode } from 'react';

export interface ReviewListProps {
  /**
   * Array of reviews to display
   */
  reviews: Review[];

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
   * Custom render function for each review
   */
  renderReview?: (review: Review) => ReactNode;

  /**
   * Custom render function for empty state
   */
  renderEmpty?: (() => ReactNode) | undefined;

  /**
   * Additional CSS class
   */
  className?: string;

  /**
   * Additional inline styles
   */
  style?: CSSProperties;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Review list component.
 *
 * @example
 * ```tsx
 * <ReviewList
 *   reviews={reviews}
 *   showVerifiedBadge
 *   showPhotos
 *   showMerchantResponse
 * />
 * ```
 */
export function ReviewList({
  reviews,
  showVerifiedBadge = true,
  showPhotos = true,
  showMerchantResponse = true,
  renderReview,
  renderEmpty,
  className = '',
  style,
}: ReviewListProps) {
  if (reviews.length === 0) {
    if (renderEmpty) {
      return <>{renderEmpty()}</>;
    }
    return (
      <div className={className} style={{ textAlign: 'center', padding: '2rem', color: '#666', ...style }}>
        No reviews yet. Be the first to leave a review!
      </div>
    );
  }

  return (
    <ul
      className={className}
      style={{ listStyle: 'none', padding: 0, margin: 0, ...style }}
    >
      {reviews.map((review) => {
        if (renderReview) {
          return <li key={review.id}>{renderReview(review)}</li>;
        }

        return (
          <li
            key={review.id}
            style={{
              padding: '1.5rem 0',
              borderBottom: '1px solid #e5e5e5',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{review.authorName}</span>
                {showVerifiedBadge && review.verifiedPurchase && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#16a34a' }}>
                    ✓ Verified purchase
                  </span>
                )}
                <div style={{ marginTop: '0.25rem' }}>
                  <StarRating rating={review.rating} size={16} />
                </div>
              </div>
              <span style={{ fontSize: '0.875rem', color: '#666' }}>
                {formatDate(review.createdAt)}
              </span>
            </div>

            {review.title && (
              <h4 style={{ fontWeight: 600, margin: '0.5rem 0' }}>{review.title}</h4>
            )}

            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{review.body}</p>

            {showPhotos && review.photoUrls.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {review.photoUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Review photo ${index + 1}`}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 4,
                    }}
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            {showMerchantResponse && review.merchantResponse && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#f5f5f5',
                  borderRadius: 4,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Response from merchant
                </div>
                <p style={{ margin: 0 }}>{review.merchantResponse}</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

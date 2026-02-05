/**
 * @tempered/hydrogen-reviews types
 */

/**
 * Review status
 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

/**
 * Review source
 */
export type ReviewSource = 'widget' | 'email' | 'import' | 'api';

/**
 * A single product review
 */
export interface Review {
  id: string;
  productId: string;
  productHandle?: string;
  rating: number;
  title?: string;
  body: string;
  authorName: string;
  authorEmail?: string;
  status: ReviewStatus;
  source: ReviewSource;
  verifiedPurchase: boolean;
  orderId?: string;
  photoUrls: string[];
  merchantResponse?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Rating summary for a product
 */
export interface RatingSummary {
  productId: string;
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Paginated reviews response
 */
export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  averageRating: number;
}

/**
 * Review submission data
 */
export interface ReviewSubmission {
  productId: string;
  rating: number;
  title?: string;
  body: string;
  authorName: string;
  authorEmail?: string;
  photos?: File[];
}

/**
 * Review submission response
 */
export interface ReviewSubmissionResponse {
  success: boolean;
  reviewId?: string;
  error?: string;
}

/**
 * LiteReviews API client configuration
 */
export interface LiteReviewsConfig {
  /**
   * API base URL for the LiteReviews backend
   * @example "https://litereviews.temperedtools.xyz"
   */
  apiUrl: string;

  /**
   * API key for authentication (optional for read operations)
   */
  apiKey?: string;

  /**
   * Shop domain
   * @example "my-store.myshopify.com"
   */
  shopDomain: string;
}

/**
 * Sort options for reviews
 */
export type ReviewSortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

/**
 * Filter options for reviews
 */
export interface ReviewFilters {
  rating?: number | undefined;
  verifiedOnly?: boolean | undefined;
  withPhotos?: boolean | undefined;
}

/**
 * Options for fetching reviews
 */
export interface FetchReviewsOptions {
  productId: string;
  page?: number;
  limit?: number;
  sort?: ReviewSortOption;
  filters?: ReviewFilters;
}

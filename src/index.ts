/**
 * @tempered/hydrogen-reviews
 *
 * Product reviews components for Shopify Hydrogen storefronts.
 *
 * @example
 * ```tsx
 * import {
 *   ReviewProvider,
 *   ReviewWidget,
 *   StarRating,
 *   useReviews,
 * } from '@tempered/hydrogen-reviews';
 *
 * // In your root layout
 * export default function App() {
 *   return (
 *     <ReviewProvider
 *       config={{
 *         apiUrl: 'https://litereviews.temperedtools.xyz',
 *         shopDomain: 'my-store.myshopify.com',
 *       }}
 *     >
 *       <Outlet />
 *     </ReviewProvider>
 *   );
 * }
 *
 * // On a product page
 * export default function ProductPage() {
 *   const { product } = useLoaderData();
 *
 *   return (
 *     <div>
 *       <h1>{product.title}</h1>
 *       <ReviewWidget
 *         productId={product.id}
 *         enableSubmission
 *         showVerifiedBadge
 *       />
 *     </div>
 *   );
 * }
 * ```
 */

// Components
export { ReviewProvider, useReviewConfig } from './components/ReviewProvider.js';
export { ReviewWidget } from './components/ReviewWidget.js';
export { ReviewList } from './components/ReviewList.js';
export { ReviewForm } from './components/ReviewForm.js';
export { StarRating } from './components/StarRating.js';

// Hooks
export { useReviews, useRatingSummary } from './hooks/useReviews.js';

// Types
export type {
  Review,
  ReviewStatus,
  ReviewSource,
  RatingSummary,
  ReviewsResponse,
  ReviewSubmission,
  ReviewSubmissionResponse,
  LiteReviewsConfig,
  ReviewSortOption,
  ReviewFilters,
  FetchReviewsOptions,
} from './types.js';

// Component props types
export type { ReviewProviderProps } from './components/ReviewProvider.js';
export type { ReviewWidgetProps } from './components/ReviewWidget.js';
export type { ReviewListProps } from './components/ReviewList.js';
export type { ReviewFormProps } from './components/ReviewForm.js';
export type { StarRatingProps } from './components/StarRating.js';
